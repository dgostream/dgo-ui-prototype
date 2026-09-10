"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect, useCallback, useRef, Suspense, type ReactNode } from "react";
import {
  Check,
  ChevronRight,
  ArrowLeft,
  Tv,
  Smartphone,
  Lock,
  Play,
  CreditCard,
  Film,
  Ticket,
  Info,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/utils/cn";
import {
  DEV_REGION_EVENT,
  SESSION_PVOD,
  SUBSCRIPTION_EVENT,
  getDevRegion,
  getSubscriptionSession,
  sessionFromSku,
  setSubscriptionSession,
  type SubscriptionSession,
} from "@/utils/paywall";
import {
  type PriceRegion,
  type PlanTier,
  type PlanDuration,
  type SubscriptionSku,
  TIER_META,
  DURATION_LABELS,
  findSku,
  formatMoney,
  formatMonthlyRate,
  savingsVsMonthly,
  billingCadenceLabel,
  durationMonths,
} from "@/utils/subscriptionCatalog";

function safeReturnPath(raw: string | null): string | null {
  if (!raw) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return null;
  if (!decoded.startsWith("/watch/")) return null;
  if (decoded.includes("@") || decoded.includes("\\")) return null;
  return decoded;
}

type JourneyKind = "subscription" | "pvod";
type NepalPsp = "esewa" | "khalti" | "connectips" | "fonepay" | "getpay" | null;

type AppliedCoupon = { code: string; percent: number };

const PROTOTYPE_COUPONS: Record<string, number> = {
  DGO10: 10,
  DGO20: 20,
};

function applyCouponAmount(amount: number, currency: "NPR" | "USD", coupon: AppliedCoupon | null): number {
  if (!coupon) return amount;
  const raw = amount * (1 - coupon.percent / 100);
  return currency === "NPR" ? Math.round(raw) : Math.round(raw * 100) / 100;
}

type PlanChangeKind =
  | "new"
  | "current"
  | "renewal"
  | "fixed-tier-upgrade"
  | "immediate-extension"
  | "provider-upgrade"
  | "provider-downgrade"
  | "deferred";

type PlanChange = {
  kind: PlanChangeKind;
  amount: number;
  allowed: boolean;
};

function resolvePlanChange(
  current: SubscriptionSession | null,
  target: SubscriptionSku | null,
  renewalMode: boolean
): PlanChange | null {
  if (!target) return null;
  if (!renewalMode || !current || current.region !== target.region) {
    return { kind: "new", amount: target.price, allowed: true };
  }
  if (current.skuId === target.id) {
    return current.billingMode === "recurring"
      ? { kind: "current", amount: target.price, allowed: false }
      : { kind: "renewal", amount: target.price, allowed: true };
  }
  if (current.billingMode === "recurring") {
    const currentMonths = durationMonths(current.duration);
    const targetMonths = durationMonths(target.duration);
    const downgrade =
      (current.tier === "plus" && target.tier === "mobile") || targetMonths < currentMonths;
    return {
      kind: downgrade ? "provider-downgrade" : "provider-upgrade",
      amount: target.price,
      allowed: true,
    };
  }

  const currentMonths = durationMonths(current.duration);
  const targetMonths = durationMonths(target.duration);
  if (targetMonths < currentMonths || (current.tier === "plus" && target.tier === "mobile")) {
    return { kind: "deferred", amount: target.price, allowed: false };
  }
  if (current.tier === "mobile" && target.tier === "plus" && current.duration === target.duration) {
    const currentSku = findSku(current.region, current.tier, current.duration);
    return {
      kind: "fixed-tier-upgrade",
      amount: Math.max(0, target.price - (currentSku?.price ?? 0)),
      allowed: true,
    };
  }
  if (targetMonths > currentMonths) {
    return { kind: "immediate-extension", amount: target.price, allowed: true };
  }
  return { kind: "deferred", amount: target.price, allowed: false };
}
type StripeFormState = {
  email: string;
  name: string;
  number: string;
  expiry: string;
  cvc: string;
  country: string;
  zip: string;
};

const PVOD_NPR = 100;
const PVOD_USD = 1.99;

const DURATIONS: PlanDuration[] = ["01M", "03M", "12M"];
const TIERS: PlanTier[] = ["mobile", "plus"];

const NEPAL_PSPS = [
  {
    id: "khalti" as const,
    name: "Khalti by IME",
    tagline: "Digital wallet",
    color: "#5c2d91",
    bg: "#0d0812",
    border: "#5c2d9130",
    iconSrc: "/khalti-by-ime.png",
    iconEmoji: "💜",
  },
  {
    id: "esewa" as const,
    name: "eSewa",
    tagline: "Digital wallet",
    color: "#60bb46",
    bg: "#0a1a07",
    border: "#60bb4630",
    iconSrc: "/esewa-icon-large.webp",
    iconEmoji: "💚",
  },
  {
    id: "connectips" as const,
    name: "ConnectIPS",
    tagline: "Bank transfer",
    color: "#f97316",
    bg: "#120800",
    border: "#f9731630",
    iconSrc: "/connectips.png",
    iconEmoji: "🔗",
  },
  {
    id: "fonepay" as const,
    name: "Fonepay",
    tagline: "QR payment",
    color: "#2563eb",
    bg: "#07090f",
    border: "#2563eb30",
    iconSrc: "/fonepay.webp",
    iconEmoji: "📱",
  },
  {
    id: "getpay" as const,
    name: "GetPay",
    tagline: "Visa / Mastercard",
    color: "#2ee6c8",
    bg: "#071214",
    border: "#2ee6c830",
    iconSrc: "/getpay.svg",
    iconEmoji: "💳",
  },
] as const;

function generateOrderRef(prefix: string): string {
  const bytes = new Uint8Array(4);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 4; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `${prefix}-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

function CouponField({
  coupon,
  onApply,
  onClear,
  compact = false,
}: {
  coupon: AppliedCoupon | null;
  onApply: (code: string) => string | null;
  onClear: () => void;
  compact?: boolean;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const result = onApply(value);
    if (result) {
      setError(result);
      return;
    }
    setError(null);
    setValue("");
  };

  return (
    <div className={cn(compact ? "space-y-1.5" : "space-y-2")}>
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40">
        <Ticket className="h-3 w-3" />
        Coupon
      </p>
      {coupon ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-400/25 bg-emerald-400/8 px-3 py-2">
          <p className="text-xs text-emerald-200">
            <span className="font-black">{coupon.code}</span>
            {` · ${coupon.percent}% off`}
          </p>
          <button
            type="button"
            onClick={() => {
              onClear();
              setError(null);
            }}
            className="text-[11px] font-bold text-white/45 hover:text-white"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16));
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Enter code"
            autoComplete="off"
            className={cn(
              "min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-3 text-sm tracking-wider text-white outline-none placeholder:text-white/25 focus:border-brand-purple/50",
              compact ? "py-2" : "py-2.5"
            )}
          />
          <button
            type="button"
            onClick={submit}
            className={cn(
              "shrink-0 rounded-lg border border-white/12 bg-white/6 px-3 text-xs font-black text-white/80 hover:bg-white/10",
              compact ? "py-2" : "py-2.5"
            )}
          >
            Apply
          </button>
        </div>
      )}
      {error ? <p className="text-[11px] text-red-300/80">{error}</p> : null}
    </div>
  );
}

function PaymentMethodIcon({
  src,
  emoji,
  boxClass = "h-9 w-9 md:h-10 md:w-10",
  emojiClass = "text-xl md:text-2xl",
}: {
  src: string;
  emoji: string;
  boxClass?: string;
  emojiClass?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className={cn("flex shrink-0 items-center justify-center", boxClass, emojiClass)} aria-hidden>
        {emoji}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10",
        boxClass
      )}
    >
      <img
        src={src}
        alt=""
        className="h-full w-full object-contain p-1"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

function checkoutPriceForSku(sku: SubscriptionSku): number {
  return sku.region === "row" && sku.duration === "03M"
    ? Number((sku.price / durationMonths(sku.duration)).toFixed(2))
    : sku.price;
}

function planActionLabel(change: PlanChange | null, currentPlan: boolean): string {
  if (change?.kind === "current") return "Current plan";
  if (change?.kind === "fixed-tier-upgrade") return "Upgrade";
  if (change?.kind === "deferred") return "Available after current term";
  return currentPlan ? "Add time" : "Continue";
}

function JoinPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flowParam = searchParams.get("flow");
  const renewalMode = searchParams.get("mode") === "renew";
  const manageMode = searchParams.get("mode") === "manage";
  const planManagementMode = renewalMode || manageMode;
  const returnRaw = searchParams.get("return");
  const returnPath = useMemo(() => safeReturnPath(returnRaw), [returnRaw]);
  const [region, setRegion] = useState<PriceRegion>("nepal");
  const [kind, setKind] = useState<JourneyKind>("subscription");
  const [step, setStep] = useState(0);
  const [tierId, setTierId] = useState<PlanTier>("plus");
  const [duration, setDuration] = useState<PlanDuration>("03M");
  const [paymentMethod, setPaymentMethod] = useState<NepalPsp>(null);
  const [mobileNumber, setMobileNumber] = useState("");
  const [cardForm, setCardForm] = useState({ number: "", name: "", expiry: "", cvc: "" });
  const [stripeForm, setStripeForm] = useState<StripeFormState>({
    email: "",
    name: "",
    number: "",
    expiry: "",
    cvc: "",
    country: "United States",
    zip: "",
  });
  const [stripeBusy, setStripeBusy] = useState(false);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [currentSession, setCurrentSession] = useState<SubscriptionSession | null>(null);
  const [orderRef] = useState(() => generateOrderRef("DGO"));
  const stepContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => {
      const session = getSubscriptionSession();
      setCurrentSession(session);
      if (planManagementMode && session) {
        setRegion(session.region);
        setTierId(session.tier);
        setDuration(session.duration);
      } else {
        setRegion(getDevRegion());
      }
    };
    sync();
    window.addEventListener(DEV_REGION_EVENT, sync);
    window.addEventListener(SUBSCRIPTION_EVENT, sync);
    return () => {
      window.removeEventListener(DEV_REGION_EVENT, sync);
      window.removeEventListener(SUBSCRIPTION_EVENT, sync);
    };
  }, [planManagementMode]);

  useEffect(() => {
    setKind("subscription");
    setStep(0);
    setPaymentMethod(null);
  }, [flowParam]);

  useEffect(() => {
    setPaymentMethod(null);
    setStripeBusy(false);
  }, [region]);

  useEffect(() => {
    if (step === 0) return;
    window.requestAnimationFrame(() => stepContentRef.current?.focus());
  }, [step]);

  const sku = useMemo(() => findSku(region, tierId, duration) ?? null, [region, tierId, duration]);
  const planChange = useMemo(
    () => resolvePlanChange(currentSession, sku, planManagementMode),
    [currentSession, planManagementMode, sku]
  );

  const pvodAmount = region === "nepal" ? PVOD_NPR : PVOD_USD;
  const pvodCurrency = region === "nepal" ? ("NPR" as const) : ("USD" as const);

  const amount =
    kind === "pvod"
      ? pvodAmount
      : planChange?.kind === "new" && sku
        ? checkoutPriceForSku(sku)
        : planChange?.amount ?? sku?.price ?? 0;
  const currency = kind === "pvod" ? pvodCurrency : sku?.currency ?? "NPR";
  const dueAmount = applyCouponAmount(amount, currency, coupon);

  const applyCouponCode = (raw: string): string | null => {
    const code = raw.trim().toUpperCase();
    const percent = PROTOTYPE_COUPONS[code];
    if (!percent) return "That code isn’t valid.";
    setCoupon({ code, percent });
    return null;
  };

  const orderTitle =
    kind === "pvod"
      ? "Premium rental (PVOD)"
      : sku
        ? `${TIER_META[sku.tier].name} · ${DURATION_LABELS[sku.duration]}`
        : "DGO plan";

  const stepLabels =
    kind === "subscription"
      ? ["Choose plan", "Payment", "Confirmed"]
      : kind === "pvod"
        ? ["Rental", "Payment", "Confirmed"]
        : [];

  const maxStep = 2;

  const next = () => setStep((s) => Math.min(s + 1, maxStep));
  const back = () => {
    if (step === 0) {
      router.push("/");
      return;
    }
    setStep((s) => s - 1);
  };

  const canAdvanceFromPlan = kind === "pvod" ? true : !!sku && (planChange?.allowed ?? true);

  return (
    <main className="min-h-screen bg-black text-white selection:bg-brand-purple/30">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 md:px-14 py-3.5">
          <button
            type="button"
            onClick={back}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors font-bold text-sm shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <span className="font-black tracking-wide text-xs md:text-sm text-white/80 truncate">
            {kind === "pvod"
              ? "Premium rental"
              : manageMode
                ? "Manage plan"
                : renewalMode
                  ? "Add time or upgrade"
                  : "Choose a plan"}
          </span>
          <img src="/dgo-logo-new.png" alt="DGO" className="h-7 md:h-9 w-auto object-contain opacity-70 shrink-0" />
        </div>

        {kind && step < maxStep ? (
          <div className="border-t border-white/5 px-4 sm:px-8 md:px-14 pt-6 pb-4">
            <div className="mx-auto flex max-w-3xl items-center gap-3">
              {stepLabels.map((s, i) => (
                <div
                  key={s}
                  className="flex min-w-0 flex-1 items-center gap-2"
                  aria-current={i === step ? "step" : undefined}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black",
                      i < step
                        ? "bg-brand-purple text-white"
                        : i === step
                          ? "bg-white text-black"
                          : "bg-white/10 text-white/35"
                    )}
                  >
                    {i < step ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "truncate text-[11px] font-semibold",
                      i === step ? "text-white" : "text-white/30"
                    )}
                  >
                    {s}
                  </span>
                </div>
              ))}
            </div>
            <div className="mx-auto mt-3 h-0.5 max-w-3xl overflow-hidden rounded-full bg-white/8">
              <motion.div
                className="h-full rounded-full bg-brand-gradient"
                animate={{ width: `${((step + 1) / stepLabels.length) * 100}%` }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        ) : null}
      </header>

      <div
        className={cn(
          kind === "subscription" && step === 1 && region === "row" ? "pb-4" : "pb-24",
          kind && step < maxStep
            ? step === 1
              ? "pt-[176px] md:pt-[188px]"
              : "pt-[164px] md:pt-[176px]"
            : "pt-[80px]"
        )}
      >
        <div ref={stepContentRef} tabIndex={-1} className="outline-none">
        <AnimatePresence mode="wait">
          {kind === "subscription" && step === 0 && (
            <motion.div
              key={`sub-plan-${region}`}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35 }}
            >
              <StepChoosePlan
                region={region}
                tierId={tierId}
                setTierId={setTierId}
                duration={duration}
                setDuration={setDuration}
                onNext={next}
                canContinue={!!canAdvanceFromPlan}
                renewalMode={planManagementMode}
                manageMode={manageMode}
                currentSession={currentSession}
                selectedChange={planChange}
              />
            </motion.div>
          )}

          {kind === "pvod" && step === 0 && (
            <motion.div
              key={`pvod-${region}`}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35 }}
            >
              <StepPvodOverview
                amount={pvodAmount}
                currency={pvodCurrency}
                onNext={next}
              />
            </motion.div>
          )}

          {kind && step === 1 && (
            <motion.div
              key={`pay-${region}`}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35 }}
            >
              <StepPayment
                region={region}
                orderTitle={orderTitle}
                amount={amount}
                dueAmount={dueAmount}
                currency={currency}
                sku={kind === "subscription" ? sku : null}
                coupon={coupon}
                onApplyCoupon={applyCouponCode}
                onClearCoupon={() => setCoupon(null)}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                mobileNumber={mobileNumber}
                setMobileNumber={setMobileNumber}
                cardForm={cardForm}
                setCardForm={setCardForm}
                stripeForm={stripeForm}
                setStripeForm={setStripeForm}
                stripeBusy={stripeBusy}
                setStripeBusy={setStripeBusy}
                currentSession={currentSession}
                planChangeKind={planChange?.kind ?? "new"}
                onNext={next}
              />
            </motion.div>
          )}

          {kind && step === 2 && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45 }}
            >
              <StepConfirmation
                kind={kind}
                sku={sku}
                amount={dueAmount}
                currency={currency}
                orderRef={orderRef}
                router={router}
                returnPath={returnPath}
                currentSession={currentSession}
                planChangeKind={planChange?.kind ?? "new"}
                paymentLabel={region === "row" ? "Stripe" : NEPAL_PSPS.find((method) => method.id === paymentMethod)?.name ?? "Payment method"}
              />
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <JoinPageInner />
    </Suspense>
  );
}

const PLAN_FACTS: Record<PlanTier, string[]> = {
  mobile: ["Phones & tablets only — no TV or casting", "720p · 1 stream", "1 profile"],
  plus: ["TV, cast, desktop & phones", "1080p · 3 streams", "4 profiles"],
};

function formatRenewalDate(value: string | null): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function PlanLifecycleNote({
  currentSession,
  selectedChange,
}: {
  currentSession: SubscriptionSession;
  selectedChange: PlanChange | null;
}) {
  return (
    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/4 px-4 py-3.5">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-purple" />
      <p className="text-xs leading-relaxed text-white/50">
        {selectedChange?.kind === "fixed-tier-upgrade" ? (
          <>
            Plus benefits activate immediately, and another full term is added after your current access.
          </>
        ) : selectedChange?.kind === "immediate-extension" ? (
          <>
            The selected benefits activate immediately after payment. The full selected term is added after your
            current access ends. It will not renew automatically.
          </>
        ) : selectedChange?.kind === "deferred" ? (
          <>
            Your current benefits stay active until{" "}
            <span className="font-semibold text-white/75">{formatRenewalDate(currentSession.paidThrough)}</span>. A
            shorter term or lower tier can be purchased after that date.
          </>
        ) : currentSession.billingMode === "prepaid" ? (
          <>
            Your access is active until{" "}
            <span className="font-semibold text-white/75">{formatRenewalDate(currentSession.paidThrough)}</span>. Your
            selection adds more time after that date.
          </>
        ) : selectedChange?.kind === "provider-downgrade" ? (
          <>
            Your current plan stays active until the next billing date. Stripe schedules the lower plan from then, with
            no new charge today.
          </>
        ) : selectedChange?.kind === "provider-upgrade" ? (
          <>
            Stripe applies the upgrade immediately and shows any prorated amount before you confirm. Future renewals
            use the new plan price.
          </>
        ) : (
          <>
            Your current plan renews automatically. To change plans, choose a different option above. Stripe will show
            the effective date and any prorated charge or credit before you confirm.
          </>
        )}
      </p>
    </div>
  );
}

function StepChoosePlan({
  region,
  tierId,
  setTierId,
  duration,
  setDuration,
  onNext,
  canContinue,
  renewalMode,
  manageMode,
  currentSession,
  selectedChange,
}: {
  region: PriceRegion;
  tierId: PlanTier;
  setTierId: (id: PlanTier) => void;
  duration: PlanDuration;
  setDuration: (d: PlanDuration) => void;
  onNext: () => void;
  canContinue: boolean;
  renewalMode: boolean;
  manageMode: boolean;
  currentSession: SubscriptionSession | null;
  selectedChange: PlanChange | null;
}) {
  const selectedRow = findSku(region, tierId, duration) ?? null;
  const selectedCurrentPlan = renewalMode && !!selectedRow && currentSession?.skuId === selectedRow.id;
  const selectedAmount = selectedRow
    ? selectedChange?.kind === "new"
      ? checkoutPriceForSku(selectedRow)
      : selectedChange?.amount ?? checkoutPriceForSku(selectedRow)
    : 0;

  return (
    <div className="mx-auto max-w-3xl px-5 pb-28 sm:px-6 md:pb-10">
      <header className="mb-6">
        <div className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/4 px-3 py-1 text-[11px] font-semibold text-white/50">
          {region === "nepal" ? "Billed in NPR" : "Billed in USD"}
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
          {manageMode ? "Change your plan" : renewalMode ? "Add time or upgrade" : "Choose your plan"}
        </h1>
        <p className="mt-2 text-sm text-white/50">
          {renewalMode && currentSession ? (
            <>
              Current:{" "}
              <span className="font-bold text-white/85">
                {TIER_META[currentSession.tier].name} · {DURATION_LABELS[currentSession.duration]}
              </span>
            </>
          ) : (
            <>
              Same catalogue. <span className="text-white/80">Mobile is phones only. Plus adds TV.</span>
            </>
          )}
        </p>
      </header>

      <div
        className="mb-6 grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-white/3 p-1"
        role="tablist"
        aria-label="Plan duration"
      >
        {DURATIONS.map((d) => {
          const active = duration === d;
          const sample = findSku(region, tierId, d);
          const save = savingsVsMonthly(region, tierId, d);
          const sports = sample?.liveSports ?? d !== "01M";
          return (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setDuration(d)}
              className={cn(
                "rounded-xl px-2 py-3 text-center transition-all sm:px-3",
                active
                  ? "bg-brand-gradient text-white shadow-lg shadow-brand-purple/25"
                  : "text-white/45 hover:bg-white/5 hover:text-white"
              )}
            >
              <span className="block text-sm font-black sm:text-base">{DURATION_LABELS[d]}</span>
              <span className={cn("mt-0.5 block text-[11px]", active ? "text-white/75" : "text-white/30")}>
                {sample ? formatMonthlyRate(sample) : "—"}
                {d === "12M" && save ? ` · −${save.percent}%` : ""}
              </span>
              <span
                className={cn(
                  "mt-1 block text-[10px] font-bold",
                  active ? (sports ? "text-white" : "text-white/70") : sports ? "text-white/45" : "text-white/25"
                )}
              >
                {sports ? "Live sports" : "No live sports"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 md:grid-cols-2 md:gap-4">
        {TIERS.map((id) => {
          const meta = TIER_META[id];
          const row = findSku(region, id, duration);
          const active = tierId === id;
          const currentPlan = renewalMode && !!row && currentSession?.skuId === row.id;
          const rowChange = resolvePlanChange(currentSession, row ?? null, renewalMode);
          const save =
            row && rowChange?.kind !== "fixed-tier-upgrade" && rowChange?.kind !== "deferred"
              ? savingsVsMonthly(region, id, duration)
              : null;
          const compareAt =
            save && row
              ? region === "row"
                ? findSku(region, id, "01M")?.price ?? 0
                : (findSku(region, id, "01M")?.price ?? 0) * durationMonths(duration)
              : 0;
          const displayAmount = row
            ? rowChange?.kind === "new"
              ? checkoutPriceForSku(row)
              : rowChange?.amount ?? checkoutPriceForSku(row)
            : 0;
          return (
            <div
              key={id}
              role="button"
              tabIndex={0}
              aria-pressed={active}
              onClick={() => setTierId(id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setTierId(id);
                }
              }}
              className={cn(
                "flex cursor-pointer flex-col rounded-3xl border p-5 text-left transition-all md:p-6",
                id === "plus" ? "order-1 md:order-2" : "order-2 md:order-1",
                active
                  ? "shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
                  : "border-white/8 bg-white/3 hover:border-white/18"
              )}
              style={
                active
                  ? {
                      borderColor: meta.border,
                      background: `linear-gradient(165deg, ${meta.accent}18, rgba(8,8,10,0.92) 42%)`,
                    }
                  : undefined
              }
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-white">{meta.name.replace("DGO ", "")}</p>
                  {currentPlan ? (
                    <span className="mt-1 inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-300">
                      Current plan
                    </span>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                    active ? "border-transparent" : "border-white/20"
                  )}
                  style={active ? { backgroundColor: meta.accent } : undefined}
                  aria-hidden
                >
                  {active ? <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} /> : null}
                </span>
              </div>

              <div className="flex flex-wrap items-end gap-x-2.5 gap-y-1">
                {save && compareAt > 0 && row ? (
                  <span className="pb-1 text-xl font-bold text-white/30 line-through decoration-white/30">
                    {formatMoney(compareAt, row.currency)}
                  </span>
                ) : null}
                <p className="text-4xl font-black tracking-tight text-white">
                  {row
                    ? formatMoney(displayAmount, row.currency)
                    : "—"}
                </p>
                {save ? (
                  <span className="mb-1.5 rounded-full bg-emerald-400/12 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                    −{save.percent}%
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-white/45">
                {rowChange?.kind === "fixed-tier-upgrade"
                  ? "One-time upgrade fee"
                  : rowChange?.kind === "deferred"
                    ? "Available after your current term"
                    : (
                      <>
                        {row ? `${formatMonthlyRate(row)} · ` : ""}
                        {billingCadenceLabel(duration, region)}
                      </>
                    )}
              </p>

              <ul className="mt-5 space-y-2 text-sm text-white/70">
                {PLAN_FACTS[id].map((fact) => (
                  <li key={fact} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 shrink-0" style={{ color: meta.accent }} strokeWidth={2.5} />
                    {fact}
                  </li>
                ))}
                <li className="flex items-center gap-2">
                  <Check
                    className={cn("h-3.5 w-3.5 shrink-0", !row?.liveSports && "opacity-35")}
                    style={{ color: meta.accent }}
                    strokeWidth={2.5}
                  />
                  <span className={cn(!row?.liveSports && "text-white/40")}>
                    {row?.liveSports ? "Live sports included" : "No live sports on 1-month plans"}
                  </span>
                </li>
              </ul>

              <div className="mt-auto hidden pt-6 md:block">
                {active ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (canContinue && rowChange?.allowed !== false) onNext();
                    }}
                    disabled={!canContinue || rowChange?.allowed === false}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-gradient px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-brand-purple/25 transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:cursor-default disabled:bg-none disabled:bg-white/8 disabled:text-white/40 disabled:shadow-none"
                  >
                    {planActionLabel(rowChange, currentPlan)}
                    {row && rowChange?.allowed !== false
                      ? ` · ${formatMoney(displayAmount, row.currency)}`
                      : ""}
                    {rowChange?.allowed !== false ? <ChevronRight className="h-4 w-4" /> : null}
                  </button>
                ) : (
                  <div className="rounded-2xl border border-white/10 py-3.5 text-center text-sm font-semibold text-white/35">
                    Select
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {renewalMode && currentSession ? (
        <PlanLifecycleNote currentSession={currentSession} selectedChange={selectedChange} />
      ) : null}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/90 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-white">
              {selectedRow ? TIER_META[selectedRow.tier].name : "Choose a plan"}
            </p>
            <p className="text-[11px] text-white/40">
              {selectedRow
                ? `${DURATION_LABELS[selectedRow.duration]} · ${formatMoney(selectedAmount, selectedRow.currency)}`
                : "Select a package"}
            </p>
          </div>
          <button
            type="button"
            onClick={onNext}
            disabled={!canContinue || selectedChange?.allowed === false}
            className="shrink-0 rounded-xl bg-brand-gradient px-5 py-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-none disabled:bg-white/8 disabled:text-white/35"
          >
            {planActionLabel(selectedChange, selectedCurrentPlan)}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepPvodOverview({
  amount,
  currency,
  onNext,
}: {
  amount: number;
  currency: "NPR" | "USD";
  onNext: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-10 sm:px-6">
      <div className="mb-6">
        <p className="text-[9px] font-black uppercase tracking-[0.45em] text-brand-pink/85 mb-2">Premium rental</p>
        <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">PVOD checkout</h2>
        <p className="text-white/45 text-sm md:text-base leading-relaxed">
          Unlock a single premium title. This path is separate from a DGO subscription.
        </p>
      </div>

      <div className="rounded-3xl border border-brand-pink/25 bg-linear-to-br from-brand-pink/12 to-white/[0.03] p-6 md:p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-black/30">
              <Film className="h-6 w-6 text-brand-pink" />
            </div>
            <div>
              <p className="font-black text-white text-lg">Selected premium title</p>
              <p className="text-white/40 text-sm mt-1">
                After payment, the title appears in My Library for the rental window (prototype).
              </p>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/35 mb-1">Due now</p>
            <p className="text-4xl font-black text-white">{formatMoney(amount, currency)}</p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-10">
        {[
          { icon: Tv, t: "Watch on supported devices", d: "Same playback stack as the main app." },
          { icon: Smartphone, t: "Instant unlock", d: "Continue on mobile after checkout." },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <Icon className="h-5 w-5 text-brand-purple mb-2" />
            <p className="font-bold text-white text-sm">{t}</p>
            <p className="text-white/35 text-xs mt-1">{d}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-brand-gradient text-white font-black uppercase tracking-[0.12em] text-sm rounded-2xl shadow-xl shadow-brand-purple/25 hover:scale-[1.02] active:scale-95 transition-all"
      >
        Continue to payment
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

type StripeMethod = "card" | "apple" | "google" | "link" | "klarna" | "amazon" | "paypal";

const STRIPE_METHOD_LABEL: Record<StripeMethod, string> = {
  card: "Card",
  apple: "Apple Pay",
  google: "Google Pay",
  link: "Link",
  klarna: "Klarna",
  amazon: "Amazon Pay",
  paypal: "PayPal",
};

function StripeMark() {
  return (
    <div className="inline-flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#635BFF] shadow-[0_0_16px_rgba(99,91,255,0.55)]">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor">
          <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" />
        </svg>
      </div>
      <span className="text-[16px] font-black tracking-tight text-white">stripe</span>
    </div>
  );
}

function BrandMark({
  src,
  alt,
  className,
  invert = false,
}: {
  src: string;
  alt: string;
  className?: string;
  invert?: boolean;
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn("h-5 w-auto max-w-none shrink-0 overflow-visible object-contain", invert && "brightness-0 invert", className)}
    />
  );
}

/** Apple Pay + Google Pay marks are sourced from Simple Icons (simpleicons.org),
 *  an open-source, verified SVG icon library — downloaded into /public/payments.
 *  We avoid hand-drawing wordmarks; that produced garbled/invisible glyphs earlier. */
/** Wide lockups cropped from official brand artwork — not 24×24 Simple Icons squares. */
function ApplePayLogo({ className = "h-4" }: { className?: string }) {
  return (
    <BrandMark
      src="/payments/apple-pay-mark.svg"
      alt="Apple Pay"
      className={cn("h-4 w-auto max-w-none shrink-0 overflow-visible", className)}
    />
  );
}

function GooglePayLogo({ className = "h-7" }: { className?: string }) {
  return <BrandMark src="/payments/google-pay-mark.svg" alt="Google Pay" className={className} />;
}

function LinkPayLogo({ className = "h-7" }: { className?: string }) {
  return <BrandMark src="/payments/link-mark.svg" alt="Link" className={className} />;
}

/** WooPayments design-library marks — same source as the working Link lockup. */
function WooMark({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn("h-8 w-auto shrink-0 object-contain drop-shadow-sm", className)}
    />
  );
}

function VisaBadge() {
  return <WooMark src="/payments/woo-visa.svg" alt="Visa" className="h-5" />;
}

function MastercardBadge() {
  return <WooMark src="/payments/woo-mastercard.svg" alt="Mastercard" className="h-5" />;
}

function AmexBadge() {
  return <WooMark src="/payments/woo-amex.svg" alt="American Express" className="h-5" />;
}

function DiscoverBadge() {
  return <WooMark src="/payments/woo-discover.svg" alt="Discover" className="h-5" />;
}

const STRIPE_FIELD =
  "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#635BFF]/70 focus:ring-1 focus:ring-[#635BFF]/40";

function EmbeddedStripeForm({
  dueAmount,
  currency,
  orderTitle,
  sku,
  form,
  setForm,
  busy,
  setBusy,
  onPaid,
}: {
  dueAmount: number;
  currency: "NPR" | "USD";
  orderTitle: string;
  sku: SubscriptionSku | null;
  form: StripeFormState;
  setForm: React.Dispatch<React.SetStateAction<StripeFormState>>;
  busy: boolean;
  setBusy: (v: boolean) => void;
  onPaid: () => void;
}) {
  const [method, setMethod] = useState<StripeMethod | null>(() => {
    if (typeof window === "undefined") return null;
    return window.matchMedia("(min-width: 768px)").matches ? "card" : null;
  });
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const fmtCard = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const fmtExp = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 4);
    return n.length >= 3 ? `${n.slice(0, 2)}/${n.slice(2)}` : n;
  };

  const pay = () => {
    if (busy) return;
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      if (method === "card" && form.number.replace(/\D/g, "") === "4000000000000002") {
        setPaymentError("This card was declined. Try another card or payment method.");
        return;
      }
      onPaid();
    }, 900);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    if (!method) {
      setPaymentError("Choose a payment method.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setPaymentError("Enter a valid email address.");
      return;
    }
    if (
      method === "card" &&
      (form.number.replace(/\D/g, "").length < 12 ||
        form.expiry.length < 5 ||
        form.cvc.length < 3 ||
        !form.name.trim() ||
        !form.zip.trim())
    ) {
      setPaymentError("Complete all card details before continuing.");
      return;
    }
    pay();
  };

  const price = formatMoney(dueAmount, currency);
  const cta = !method
    ? `Subscribe · ${price}`
    : method === "card"
      ? sku
        ? `Subscribe · ${price}`
        : `Pay ${price}`
      : `Continue with ${STRIPE_METHOD_LABEL[method]}`;

  const accordion: { id: StripeMethod; label: string; hint: string; mark: ReactNode }[] = [
    {
      id: "card",
      label: "Card",
      hint: "Visa, Mastercard, Amex, Discover",
      mark: <CreditCard className="h-5 w-5 text-white/45" strokeWidth={1.75} />,
    },
    {
      id: "paypal",
      label: "PayPal",
      hint: "Pay with your PayPal account",
      mark: <BrandMark src="/payments/paypal-mark.svg" alt="" className="h-5 w-5" />,
    },
    {
      id: "klarna",
      label: "Klarna",
      hint: "Pay in 4 or later",
      mark: <WooMark src="/payments/woo-klarna.svg" alt="Klarna" className="h-5" />,
    },
    {
      id: "amazon",
      label: "Amazon Pay",
      hint: "Pay with your Amazon account",
      mark: <WooMark src="/payments/woo-amazon-pay.svg" alt="Amazon Pay" className="h-5" />,
    },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="relative overflow-visible rounded-2xl border border-white/12 bg-[#08050f] shadow-[0_16px_48px_rgba(99,91,255,0.12)]"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 -top-20 h-40 w-40 rounded-full bg-[#635BFF]/25 blur-[80px]" />
        <div className="absolute right-0 top-8 h-32 w-32 rounded-full bg-brand-pink/15 blur-[70px]" />
      </div>

      <div className="relative grid md:grid-cols-[0.72fr_1.28fr]">
        <aside className="flex flex-col border-b border-white/8 p-5 md:border-b-0 md:border-r">
          <StripeMark />
          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Due today</p>
          <p className="mt-1 text-3xl font-black tracking-tight text-white">{price}</p>
          <p className="mt-1 text-sm font-bold text-white/80">{orderTitle}</p>
          <p className="mt-0.5 text-xs text-white/40">
            {sku ? billingCadenceLabel(sku.duration, sku.region) : "One-time payment"}
          </p>
          <p className="mt-auto pt-5 flex items-center gap-1.5 text-[11px] text-white/35">
            <Lock className="h-3 w-3 text-[#635BFF]" />
            Prototype — no live charge
          </p>
        </aside>

        <div className="space-y-2.5 p-5">
        <section>
          <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
            Express checkout
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setMethod("apple");
                setPaymentError(null);
              }}
              aria-label="Apple Pay"
              aria-pressed={method === "apple"}
              className={cn(
                "flex h-10 items-center justify-center overflow-visible rounded-lg bg-white px-3 shadow-sm transition-all hover:bg-neutral-100",
                method === "apple" && "ring-2 ring-[#635BFF] ring-offset-2 ring-offset-[#08050f]"
              )}
            >
              <ApplePayLogo className="h-[18px]" />
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod("google");
                setPaymentError(null);
              }}
              aria-label="Google Pay"
              aria-pressed={method === "google"}
              className={cn(
                "flex h-10 items-center justify-center overflow-visible rounded-lg bg-white px-3 shadow-sm transition-all hover:bg-neutral-100",
                method === "google" && "ring-2 ring-[#635BFF] ring-offset-2 ring-offset-[#08050f]"
              )}
            >
              <GooglePayLogo className="h-[18px] w-auto max-w-none shrink-0" />
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod("link");
                setPaymentError(null);
              }}
              aria-label="Link"
              aria-pressed={method === "link"}
              className={cn(
                "flex h-10 items-center justify-center overflow-visible rounded-lg bg-[#00D66F] px-3 shadow-sm transition-all hover:bg-[#00C566]",
                method === "link" && "ring-2 ring-[#635BFF] ring-offset-2 ring-offset-[#08050f]"
              )}
            >
              <LinkPayLogo className="h-[18px] w-auto max-w-none shrink-0" />
            </button>
          </div>
        </section>

        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">
          <span className="h-px flex-1 bg-white/10" />
          or pay another way
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <section>
          <label
            htmlFor="stripe-email"
            className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/40"
          >
            Email
          </label>
          <input
            id="stripe-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@email.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className={STRIPE_FIELD}
          />
        </section>

        <section className="overflow-hidden rounded-xl border border-white/10 bg-white/3">
          {accordion.map((row, i) => {
            const open = method === row.id;
            return (
              <div key={row.id} className={cn(i > 0 && "border-t border-white/8")}>
                <button
                  type="button"
                  onClick={() => {
                    setMethod(row.id);
                    setPaymentError(null);
                  }}
                  aria-expanded={open}
                  aria-controls={`stripe-method-${row.id}`}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors",
                    open ? "bg-[#635BFF]/12" : "hover:bg-white/4"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                      open ? "border-[#635BFF] bg-[#635BFF]" : "border-white/25"
                    )}
                  >
                    {open ? <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} /> : null}
                  </span>
                  <span className="flex h-6 w-10 shrink-0 items-center justify-center">{row.mark}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-white">{row.label}</span>
                    <span className="block truncate text-[11px] text-white/40">{row.hint}</span>
                  </span>
                  {row.id === "card" ? (
                    <span className="hidden shrink-0 items-center gap-1 lg:flex">
                      <VisaBadge />
                      <MastercardBadge />
                      <AmexBadge />
                      <DiscoverBadge />
                    </span>
                  ) : null}
                </button>

                {open && row.id === "card" ? (
                  <div id={`stripe-method-${row.id}`} className="space-y-2 px-3 pb-3">
                    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/35">
                      <div className="relative">
                        <input
                          type="text"
                          required={method === "card"}
                          inputMode="numeric"
                          autoComplete="cc-number"
                          aria-label="Card number"
                          placeholder="1234 1234 1234 1234"
                          value={form.number}
                          onChange={(e) => setForm((f) => ({ ...f, number: fmtCard(e.target.value) }))}
                          className="w-full border-0 bg-transparent py-2.5 pl-3.5 pr-10 font-mono text-sm text-white outline-none placeholder:text-white/25"
                        />
                        <CreditCard className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                      </div>
                      <div className="grid grid-cols-2 border-t border-white/10">
                        <input
                          type="text"
                          required={method === "card"}
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          aria-label="Expiration date"
                          placeholder="MM / YY"
                          value={form.expiry}
                          onChange={(e) => setForm((f) => ({ ...f, expiry: fmtExp(e.target.value) }))}
                          className="min-w-0 border-0 border-r border-white/10 bg-transparent px-3.5 py-2.5 font-mono text-sm text-white outline-none placeholder:text-white/25"
                        />
                        <input
                          type="text"
                          required={method === "card"}
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          aria-label="Security code"
                          placeholder="CVC"
                          value={form.cvc}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) }))
                          }
                          className="w-full border-0 bg-transparent px-3.5 py-2.5 font-mono text-sm text-white outline-none placeholder:text-white/25"
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      required={method === "card"}
                      autoComplete="cc-name"
                      placeholder="Name on card"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className={STRIPE_FIELD}
                    />
                    <div>
                      <select
                        aria-label="Billing country"
                        value={form.country}
                        onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                        className={cn(STRIPE_FIELD, "rounded-b-none")}
                      >
                        <option className="bg-black">United States</option>
                        <option className="bg-black">United Kingdom</option>
                        <option className="bg-black">Australia</option>
                        <option className="bg-black">Canada</option>
                        <option className="bg-black">India</option>
                        <option className="bg-black">United Arab Emirates</option>
                      </select>
                      <input
                        type="text"
                        required={method === "card"}
                        autoComplete="postal-code"
                        placeholder="ZIP / postal code"
                        value={form.zip}
                        onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value.slice(0, 12) }))}
                        className={cn(STRIPE_FIELD, "-mt-px rounded-t-none")}
                      />
                    </div>
                  </div>
                ) : null}

                {open && row.id !== "card" ? (
                  <p id={`stripe-method-${row.id}`} className="px-3 pb-3 text-[11px] leading-relaxed text-white/40">
                    Continues with {row.label}. Prototype — no live charge.
                  </p>
                ) : null}
              </div>
            );
          })}
        </section>

        {paymentError ? (
          <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/8 px-3 py-2 text-xs text-red-200">
            {paymentError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy || !method}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-brand-purple/25 transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Lock className="h-3.5 w-3.5" />
          {busy ? "Processing…" : cta}
        </button>

        <p className="text-center text-[10px] text-white/30">
          Stripe Checkout · prototype — no live charge
        </p>
        </div>
      </div>
    </form>
  );
}

function StripePlanChangeReview({
  currentSession,
  target,
  changeKind,
  onConfirm,
}: {
  currentSession: SubscriptionSession;
  target: SubscriptionSku;
  changeKind: "provider-upgrade" | "provider-downgrade";
  onConfirm: () => void;
}) {
  const downgrade = changeKind === "provider-downgrade";
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-[#08050f] p-5 shadow-[0_16px_48px_rgba(99,91,255,0.12)]">
      <div className="pointer-events-none absolute -left-16 -top-20 h-40 w-40 rounded-full bg-[#635BFF]/25 blur-[80px]" />
      <div className="relative">
        <StripeMark />
        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
          Review plan change
        </p>
        <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-white/3">
          <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
            <span className="text-xs text-white/40">Current</span>
            <span className="text-sm font-bold text-white/75">
              {TIER_META[currentSession.tier].name} · {DURATION_LABELS[currentSession.duration]}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-xs text-white/40">New</span>
            <span className="text-right text-sm font-bold text-white">
              {TIER_META[target.tier].name} · {DURATION_LABELS[target.duration]}
              <span className="mt-0.5 block text-xs font-medium text-white/40">
                {formatMoney(checkoutPriceForSku(target), target.currency)} ·{" "}
                {billingCadenceLabel(target.duration, target.region).toLowerCase()}
              </span>
            </span>
          </div>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-white/45">
          {downgrade
            ? `Your current plan remains active until ${formatRenewalDate(
                currentSession.nextBillingDate ?? currentSession.paidThrough
              )}. The new plan starts after that date.`
            : "The upgrade takes effect immediately. Stripe will calculate and show any prorated charge before final confirmation."}
        </p>
        <button
          type="button"
          onClick={onConfirm}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-3 text-sm font-black text-white"
        >
          Confirm plan change
          <ChevronRight className="h-4 w-4" />
        </button>
        <p className="mt-3 text-center text-[10px] text-white/30">Stripe billing portal · prototype</p>
      </div>
    </div>
  );
}

function StepPayment({
  region,
  orderTitle,
  amount,
  dueAmount,
  currency,
  sku,
  coupon,
  onApplyCoupon,
  onClearCoupon,
  paymentMethod,
  setPaymentMethod,
  mobileNumber,
  setMobileNumber,
  cardForm,
  setCardForm,
  stripeForm,
  setStripeForm,
  stripeBusy,
  setStripeBusy,
  currentSession,
  planChangeKind,
  onNext,
}: {
  region: PriceRegion;
  orderTitle: string;
  amount: number;
  dueAmount: number;
  currency: "NPR" | "USD";
  sku: SubscriptionSku | null;
  coupon: AppliedCoupon | null;
  onApplyCoupon: (code: string) => string | null;
  onClearCoupon: () => void;
  paymentMethod: NepalPsp;
  setPaymentMethod: (m: NepalPsp) => void;
  mobileNumber: string;
  setMobileNumber: (v: string) => void;
  cardForm: { number: string; name: string; expiry: string; cvc: string };
  setCardForm: React.Dispatch<React.SetStateAction<{ number: string; name: string; expiry: string; cvc: string }>>;
  stripeForm: StripeFormState;
  setStripeForm: React.Dispatch<React.SetStateAction<StripeFormState>>;
  stripeBusy: boolean;
  setStripeBusy: (v: boolean) => void;
  currentSession: SubscriptionSession | null;
  planChangeKind: PlanChangeKind;
  onNext: () => void;
}) {
  const fmtCard = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const fmtExp = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 4);
    return n.length >= 3 ? `${n.slice(0, 2)}/${n.slice(2)}` : n;
  };
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    if (!paymentMethod) {
      setPaymentError("Choose a payment method.");
      return;
    }
    if (paymentMethod === "getpay") {
      if (
        cardForm.number.replace(/\D/g, "").length < 12 ||
        cardForm.expiry.length < 5 ||
        cardForm.cvc.length < 3 ||
        !cardForm.name.trim()
      ) {
        setPaymentError("Complete all card details before continuing.");
        return;
      }
      if (cardForm.number.replace(/\D/g, "") === "4000000000000002") {
        setPaymentError("This card was declined. Try another card or payment method.");
        return;
      }
    } else if (mobileNumber.trim().length < 5) {
      setPaymentError(
        paymentMethod === "connectips" ? "Enter a valid account or customer ID." : "Enter a valid mobile number."
      );
      return;
    }
    onNext();
  };
  const selected = NEPAL_PSPS.find((m) => m.id === paymentMethod);
  const priceLabel = formatMoney(dueAmount, currency);
  const listPrice = formatMoney(amount, currency);

  return (
    <div className={cn("mx-auto px-5 pb-10 pt-2 sm:px-6", region === "row" ? "max-w-4xl" : "max-w-lg")}>
      {region === "row" ? (
        currentSession &&
        sku &&
        (planChangeKind === "provider-upgrade" || planChangeKind === "provider-downgrade") ? (
          <StripePlanChangeReview
            currentSession={currentSession}
            target={sku}
            changeKind={planChangeKind}
            onConfirm={onNext}
          />
        ) : (
          <EmbeddedStripeForm
            dueAmount={dueAmount}
            currency={currency}
            orderTitle={orderTitle}
            sku={sku}
            form={stripeForm}
            setForm={setStripeForm}
            busy={stripeBusy}
            setBusy={setStripeBusy}
            onPaid={onNext}
          />
        )
      ) : (
        <form
          onSubmit={handleSubmit}
          className="relative overflow-hidden rounded-2xl border border-white/12 bg-[#08050f] shadow-[0_16px_48px_rgba(99,91,255,0.12)]"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-16 -top-20 h-40 w-40 rounded-full bg-[#635BFF]/25 blur-[80px]" />
            <div className="absolute right-0 top-8 h-32 w-32 rounded-full bg-brand-pink/15 blur-[70px]" />
          </div>

          <div className="relative border-b border-white/8 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Due today</p>
            <p className="mt-1 flex items-baseline gap-2 text-3xl font-black tracking-tight text-white">
              {priceLabel}
              {coupon ? <span className="text-sm font-bold text-white/30 line-through">{listPrice}</span> : null}
            </p>
            <p className="mt-1 text-sm font-bold text-white/80">{orderTitle}</p>
            <p className="mt-0.5 text-xs text-white/40">
              Local wallets
              {sku ? ` · ${billingCadenceLabel(sku.duration, sku.region)}` : ""}
            </p>
            <div className="mt-5">
              <CouponField coupon={coupon} onApply={onApplyCoupon} onClear={onClearCoupon} compact />
            </div>
          </div>

          <div className="relative space-y-2.5 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Payment method</p>
            <section className="overflow-hidden rounded-xl border border-white/10 bg-white/3">
              {NEPAL_PSPS.map((method, i) => {
                const open = paymentMethod === method.id;
                return (
                  <div key={method.id} className={cn(i > 0 && "border-t border-white/8")}>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod(method.id);
                        setPaymentError(null);
                      }}
                      aria-expanded={open}
                      aria-controls={`nepal-method-${method.id}`}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors",
                        open ? "bg-[#635BFF]/12" : "hover:bg-white/4"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                          open ? "border-[#635BFF] bg-[#635BFF]" : "border-white/25"
                        )}
                      >
                        {open ? <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} /> : null}
                      </span>
                      <PaymentMethodIcon
                        src={method.iconSrc}
                        emoji={method.iconEmoji}
                        boxClass="h-6 w-10"
                        emojiClass="text-sm"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-white">{method.name}</span>
                        <span className="block truncate text-[11px] text-white/40">{method.tagline}</span>
                      </span>
                      {method.id === "getpay" ? (
                        <span className="flex shrink-0 items-center gap-1">
                          <VisaBadge />
                          <MastercardBadge />
                        </span>
                      ) : null}
                    </button>

                    {open && method.id !== "getpay" ? (
                      <div id={`nepal-method-${method.id}`} className="space-y-2 px-3 pb-3">
                        <input
                          type="text"
                          required
                          inputMode={method.id === "connectips" ? "text" : "numeric"}
                          aria-label={method.id === "connectips" ? "Account or customer ID" : `${method.name} mobile number`}
                          placeholder={method.id === "connectips" ? "Account / Customer ID" : "98XXXXXXXX"}
                          value={mobileNumber}
                          onChange={(e) => {
                            const value =
                              method.id === "connectips"
                                ? e.target.value.replace(/[^a-zA-Z0-9/_-]/g, "").slice(0, 24)
                                : e.target.value.replace(/\D/g, "").slice(0, 14);
                            setMobileNumber(value);
                            setPaymentError(null);
                          }}
                          className={STRIPE_FIELD}
                        />
                        <p className="text-[11px] leading-relaxed text-white/40">
                          Continues with {method.name}. Prototype — no live charge.
                        </p>
                      </div>
                    ) : null}

                    {open && method.id === "getpay" ? (
                      <div id={`nepal-method-${method.id}`} className="space-y-2 px-3 pb-3">
                        <div className="overflow-hidden rounded-xl border border-white/10 bg-black/35">
                          <div className="relative">
                            <input
                              type="text"
                              required
                              inputMode="numeric"
                              autoComplete="cc-number"
                              aria-label="Card number"
                              placeholder="1234 1234 1234 1234"
                              value={cardForm.number}
                              onChange={(e) => setCardForm((f) => ({ ...f, number: fmtCard(e.target.value) }))}
                              className="w-full border-0 bg-transparent py-2.5 pl-3.5 pr-10 font-mono text-sm text-white outline-none placeholder:text-white/25"
                            />
                            <CreditCard className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                          </div>
                          <div className="grid grid-cols-2 border-t border-white/10">
                            <input
                              type="text"
                              required
                              inputMode="numeric"
                              autoComplete="cc-exp"
                              aria-label="Expiration date"
                              placeholder="MM / YY"
                              value={cardForm.expiry}
                              onChange={(e) => setCardForm((f) => ({ ...f, expiry: fmtExp(e.target.value) }))}
                              className="min-w-0 border-0 border-r border-white/10 bg-transparent px-3.5 py-2.5 font-mono text-sm text-white outline-none placeholder:text-white/25"
                            />
                            <input
                              type="text"
                              required
                              inputMode="numeric"
                              autoComplete="cc-csc"
                              aria-label="Security code"
                              placeholder="CVC"
                              value={cardForm.cvc}
                              onChange={(e) =>
                                setCardForm((f) => ({ ...f, cvc: e.target.value.replace(/\D/g, "").slice(0, 3) }))
                              }
                              className="w-full border-0 bg-transparent px-3.5 py-2.5 font-mono text-sm text-white outline-none placeholder:text-white/25"
                            />
                          </div>
                        </div>
                        <input
                          type="text"
                          required
                          autoComplete="cc-name"
                          placeholder="Name on card"
                          value={cardForm.name}
                          onChange={(e) => setCardForm((f) => ({ ...f, name: e.target.value }))}
                          className={STRIPE_FIELD}
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </section>

            {paymentError ? (
              <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/8 px-3 py-2 text-xs text-red-200">
                {paymentError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={!paymentMethod}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-brand-purple/25 transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Lock className="h-3.5 w-3.5" />
              {paymentMethod
                ? `Pay ${priceLabel} via ${selected?.name ?? "GetPay"}`
                : `Pay ${priceLabel}`}
            </button>
            <p className="text-center text-[10px] text-white/30">Secure checkout · prototype — no live charge</p>
          </div>
        </form>
      )}
    </div>
  );
}

function addMonthsToDate(value: string, months: number): string {
  const date = new Date(value);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString();
}

function persistPurchase(
  kind: "subscription" | "pvod",
  sku: SubscriptionSku | null,
  currentSession: SubscriptionSession | null,
  planChangeKind: PlanChangeKind
) {
  if (kind === "subscription" && sku) {
    if (currentSession?.billingMode === "recurring" && planChangeKind === "provider-downgrade") {
      setSubscriptionSession({
        ...currentSession,
        pendingPlan: {
          skuId: sku.id,
          tier: sku.tier,
          duration: sku.duration,
          effectiveDate: currentSession.nextBillingDate ?? currentSession.paidThrough,
        },
      });
      return;
    }
    const next = sessionFromSku(sku);
    if (currentSession?.billingMode === "prepaid" && planChangeKind === "fixed-tier-upgrade") {
      next.paidThrough = addMonthsToDate(currentSession.paidThrough, durationMonths(sku.duration));
    }
    if (
      currentSession?.billingMode === "prepaid" &&
      (planChangeKind === "renewal" || planChangeKind === "immediate-extension")
    ) {
      next.paidThrough = addMonthsToDate(currentSession.paidThrough, durationMonths(sku.duration));
    }
    if (currentSession?.billingMode === "recurring" && planChangeKind === "provider-upgrade") {
      next.paidThrough = currentSession.paidThrough;
      next.nextBillingDate = currentSession.nextBillingDate;
    }
    setSubscriptionSession(next);
  }
  if (kind === "pvod" && typeof window !== "undefined") {
    window.sessionStorage.setItem(SESSION_PVOD, "1");
  }
}

function StepConfirmation({
  kind,
  sku,
  amount,
  currency,
  orderRef,
  router,
  returnPath,
  currentSession,
  planChangeKind,
  paymentLabel,
}: {
  kind: "subscription" | "pvod";
  sku: SubscriptionSku | null;
  amount: number;
  currency: "NPR" | "USD";
  orderRef: string;
  router: ReturnType<typeof useRouter>;
  returnPath: string | null;
  currentSession: SubscriptionSession | null;
  planChangeKind: PlanChangeKind;
  paymentLabel: string;
}) {
  const [secondsLeft, setSecondsLeft] = useState(10);
  const purchaseRef = useRef({ kind, sku, currentSession, planChangeKind });
  const finishAndGo = useCallback(() => {
    router.push("/");
  }, [router]);

  useEffect(() => {
    const purchase = purchaseRef.current;
    persistPurchase(purchase.kind, purchase.sku, purchase.currentSession, purchase.planChangeKind);
    const tick = window.setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    const go = window.setTimeout(finishAndGo, 10000);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(go);
    };
  }, [finishAndGo]);

  const title =
    kind === "subscription"
      ? planChangeKind === "provider-downgrade"
        ? "Plan change scheduled"
        : planChangeKind === "provider-upgrade"
          ? "Plan updated"
          : "You're in"
      : "Rental unlocked";
  const detail =
    kind === "subscription" && sku
      ? `${TIER_META[sku.tier].name} · ${DURATION_LABELS[sku.duration]}`
      : `Unlocked for ${formatMoney(amount, currency)}`;
  const providerChange =
    planChangeKind === "provider-upgrade" || planChangeKind === "provider-downgrade";
  const ring = 2 * Math.PI * 22;
  const ringOffset = ring - (secondsLeft / 10) * ring;

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-5 py-10 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[22rem] overflow-hidden rounded-3xl border border-white/10 bg-[#09060f] px-6 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
      >
        <div className="pointer-events-none absolute -left-10 -top-16 h-40 w-40 rounded-full bg-brand-purple/20 blur-[70px]" />
        <div className="pointer-events-none absolute -right-12 bottom-0 h-36 w-36 rounded-full bg-brand-pink/12 blur-[70px]" />

        <div className="relative mx-auto mb-6 flex h-[4.5rem] w-[4.5rem] items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56" aria-hidden>
            <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
            <circle
              cx="28"
              cy="28"
              r="22"
              fill="none"
              stroke="url(#confirm-ring)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={ring}
              strokeDashoffset={ringOffset}
              className="transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
            <defs>
              <linearGradient id="confirm-ring" x1="0" y1="0" x2="56" y2="56">
                <stop stopColor="#8a3ffc" />
                <stop offset="1" stopColor="#ff00bd" />
              </linearGradient>
            </defs>
          </svg>
          <motion.span
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.12, type: "spring", stiffness: 260, damping: 18 }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient"
          >
            <Check className="h-6 w-6 text-white" strokeWidth={3} />
          </motion.span>
        </div>

        <h2 className="relative text-3xl font-black tracking-tight text-white">{title}</h2>
        <p className="relative mt-2 text-sm text-white/50">{detail}</p>
        {planChangeKind === "provider-downgrade" && currentSession ? (
          <p className="relative mt-1 text-xs text-white/35">
            Starts {formatRenewalDate(currentSession.nextBillingDate ?? currentSession.paidThrough)}
          </p>
        ) : null}

        <div className="relative mt-6 overflow-hidden rounded-xl border border-white/8 bg-white/3 text-left">
          <div className="flex items-center justify-between gap-4 border-b border-white/8 px-4 py-3 text-xs">
            <span className="text-white/40">{providerChange ? "Billing" : "Paid today"}</span>
            <span className="font-bold text-white/80">
              {providerChange ? "Handled by Stripe" : formatMoney(amount, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-white/8 px-4 py-3 text-xs">
            <span className="text-white/40">Payment</span>
            <span className="font-bold text-white/80">{paymentLabel}</span>
          </div>
          {kind === "subscription" && sku ? (
            <div className="flex items-center justify-between gap-4 px-4 py-3 text-xs">
              <span className="text-white/40">{sku.region === "nepal" ? "Access" : "Schedule"}</span>
              <span className="text-right font-bold text-white/80">
                {sku.region === "nepal"
                  ? `${DURATION_LABELS[sku.duration]} added`
                  : billingCadenceLabel(sku.duration, sku.region)}
              </span>
            </div>
          ) : null}
        </div>

        <p className="relative mt-3 inline-flex rounded-full border border-white/8 bg-white/4 px-3 py-1 font-mono text-[11px] text-white/30">
          {orderRef}
        </p>

        <button
          type="button"
          onClick={finishAndGo}
          className="relative mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-gradient px-6 py-3 text-sm font-black text-white"
        >
          <Play className="h-4 w-4" fill="currentColor" />
          {returnPath ? "Continue to player" : "Go to home"}
        </button>
        <p className="relative mt-3 text-xs text-white/35">Home in {secondsLeft}s</p>
      </motion.div>
    </div>
  );
}
