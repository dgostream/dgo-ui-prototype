"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Bell,
  ChevronRight,
  ChevronDown,
  MonitorPlay,
  Cast,
  Settings,
  Globe,
  Ticket,
  HelpCircle,
  Info,
  LogOut,
  CalendarClock,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { ProfileMenuPromoBanner } from "@/components/ProfileMenuPromoBanner";
import { useTranslated } from "@/components/Translate";
import { useSubscriptionSession } from "@/hooks/useSubscriptionSession";
import { DURATION_LABELS, TIER_META, findSku, formatMoney } from "@/utils/subscriptionCatalog";
import { cancelSubscriptionAtPeriodEnd, resumeSubscription } from "@/utils/paywall";

type AccountMenuPanelProps = {
  variant: "desktop" | "mobile";
  onDismiss: () => void;
  onSignOut: () => void;
};

function MenuGroup({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-white/10 bg-white/4 shadow-inner shadow-black/20",
        className
      )}
    >
      {children}
    </div>
  );
}

function RowButton({
  icon: Icon,
  label,
  onClick,
  right,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: React.ReactNode;
  onClick: () => void;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-3 text-left text-sm text-white/80 transition-colors hover:bg-white/6 hover:text-white md:py-2.5",
        className
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-brand-purple/70" />
      <span className="min-w-0 flex-1 font-medium">{label}</span>
      {right ?? <ChevronRight className="h-4 w-4 shrink-0 text-white/20" />}
    </button>
  );
}

function formatAccountDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function AccountMenuPanel({ variant, onDismiss, onSignOut }: AccountMenuPanelProps) {
  const router = useRouter();
  const [plansOpen, setPlansOpen] = useState(false);
  const [cancelStep, setCancelStep] = useState<0 | 1 | 2 | 3>(0);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelPhrase, setCancelPhrase] = useState("");
  const [confirmResume, setConfirmResume] = useState(false);
  const session = useSubscriptionSession();
  const hasSub = !!session;
  const activeSku = session ? findSku(session.region, session.tier, session.duration) : null;

  const profileName = useTranslated("Premium User");
  const demoEmail = useTranslated("user@dgo.global");
  const roleBadge = useTranslated("Active");
  const subscribeCta = useTranslated("Subscribe now");
  const myPlans = useTranslated("My Plans");
  const noActivePlans = useTranslated("No active plans on this account");
  const tvPairing = useTranslated("TV pairing code");
  const appSettings = useTranslated("App settings");
  const language = useTranslated("Language");
  const supportTickets = useTranslated("Support tickets");
  const help = useTranslated("Help");
  const about = useTranslated("About");
  const signOut = useTranslated("Sign out");
  const profilesLabel = useTranslated("Profiles");
  const notifLabel = useTranslated("Notifications");

  const profileHeader =
    variant === "mobile" ? (
      <div className="flex flex-col items-center pb-4 text-center">
        <div className="relative mb-3 flex w-full items-center justify-center">
          <button
            type="button"
            className="absolute left-0 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-bold text-white/55"
          >
            <Users className="h-3.5 w-3.5 text-brand-purple/80" />
            <span>1</span>
          </button>
          <div className="h-18 w-18 shrink-0 overflow-hidden rounded-full border-2 border-brand-purple/35 ring-2 ring-brand-purple/15">
            <img
              src="https://ui-avatars.com/api/?name=User&background=8a3ffc&color=fff"
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
          <button
            type="button"
            className="absolute right-0 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-bold text-white/55"
          >
            <span className="relative">
              <Bell className="h-3.5 w-3.5 text-brand-purple/80" />
              <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-brand-primary shadow-[0_0_6px_rgba(218,33,40,0.8)]" />
            </span>
            <span>2</span>
          </button>
        </div>
        <p className="text-base font-black tracking-tight text-white">{profileName}</p>
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded border border-brand-primary/40 bg-brand-primary/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-brand-primary">
            {roleBadge}
          </span>
        </div>
        <p className="mt-2 max-w-[16rem] truncate text-xs text-white/40">{demoEmail}</p>
        <span className="sr-only">
          {profilesLabel} · {notifLabel}
        </span>
      </div>
    ) : (
      <div className="flex flex-col items-center border-b border-white/8 pb-4 text-center">
        <div className="relative mb-3 flex w-full items-center justify-center">
          <button
            type="button"
            className="absolute left-0 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-bold text-white/50"
          >
            <Users className="h-3 w-3 text-brand-purple/80" />
            1
          </button>
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-brand-purple/35 ring-2 ring-brand-purple/15">
            <img
              src="https://ui-avatars.com/api/?name=User&background=8a3ffc&color=fff"
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
          <button
            type="button"
            className="absolute right-0 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-bold text-white/50"
          >
            <span className="relative">
              <Bell className="h-3 w-3 text-brand-purple/80" />
              <span className="absolute -right-0.5 -top-0.5 h-1 w-1 rounded-full bg-brand-primary" />
            </span>
            2
          </button>
        </div>
        <p className="text-sm font-black text-white">{profileName}</p>
        <div className="mt-1.5 flex items-center justify-center gap-2">
          <span className="rounded border border-brand-primary/40 bg-brand-primary/15 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-brand-primary">
            {roleBadge}
          </span>
        </div>
        <p className="mt-1.5 max-w-full truncate px-2 text-[11px] text-white/40">{demoEmail}</p>
      </div>
    );

  return (
    <div className={cn(variant === "mobile" && "-mx-1")}>
      <div className={cn(variant === "mobile" ? "px-1" : "px-2 pt-1")}>{profileHeader}</div>

      <div className="space-y-2 px-2 pb-3">
        {hasSub ? (
          <div className="rounded-xl border border-white/10 bg-white/4 px-3 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Active plan</p>
            <p className="mt-1 text-sm font-black text-white">
              {session ? `${TIER_META[session.tier].name} · ${DURATION_LABELS[session.duration]}` : "DGO"}
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              onDismiss();
              router.push("/join");
            }}
            className="flex w-full items-center justify-center rounded-xl bg-brand-gradient py-3.5 text-xs font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-brand-purple/25 transition-transform hover:brightness-110 active:scale-[0.99]"
          >
            {subscribeCta}
          </button>
        )}
      </div>

      <div className="space-y-3 px-2 pb-3">
        <MenuGroup>
          <div className="divide-y divide-white/8">
            <div>
              <button
                type="button"
                onClick={() => setPlansOpen((o) => !o)}
                className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm text-white/80 transition-colors hover:bg-white/6 hover:text-white md:py-2.5"
              >
                <MonitorPlay className="h-4 w-4 shrink-0 text-brand-purple/70" />
                <span className="min-w-0 flex-1 font-medium">{myPlans}</span>
                <ChevronDown
                  className={cn("h-4 w-4 shrink-0 text-white/25 transition-transform", plansOpen && "rotate-180")}
                />
              </button>
              {plansOpen ? (
                <div className="border-t border-white/8 bg-black/35">
                  {!session ? (
                    <p className="px-3 py-3 pl-6 text-left text-xs leading-relaxed text-white/40">{noActivePlans}</p>
                  ) : (
                    <div className="space-y-3 p-3">
                      <div className="rounded-xl border border-white/8 bg-white/3 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-white">
                              {TIER_META[session.tier].name} · {DURATION_LABELS[session.duration]}
                            </p>
                            {session.billingMode === "recurring" ? (
                              <p className="mt-1 text-[11px] text-white/40">
                                {session.status === "canceling" ? "Cancellation scheduled" : "Auto-renewal on"}
                              </p>
                            ) : null}
                          </div>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-wider",
                              session.status === "canceling"
                                ? "bg-amber-400/12 text-amber-300"
                                : "bg-emerald-400/12 text-emerald-300"
                            )}
                          >
                            {session.status === "canceling" ? "Ends soon" : "Active"}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center gap-2 border-t border-white/8 pt-3 text-[11px] text-white/50">
                          <CalendarClock className="h-3.5 w-3.5 text-brand-purple" />
                          {session.billingMode === "prepaid"
                            ? `Access until ${formatAccountDate(session.paidThrough)}`
                            : session.status === "canceling"
                              ? `Access until ${formatAccountDate(session.nextBillingDate ?? session.paidThrough)}`
                              : `Next bill ${formatAccountDate(session.nextBillingDate)}`}
                        </div>
                        {session.pendingPlan ? (
                          <div className="mt-2 rounded-lg border border-brand-purple/20 bg-brand-purple/8 px-3 py-2 text-[11px] text-white/55">
                            Changes to{" "}
                            <span className="font-bold text-white/75">
                              {TIER_META[session.pendingPlan.tier].name} ·{" "}
                              {DURATION_LABELS[session.pendingPlan.duration]}
                            </span>{" "}
                            on {formatAccountDate(session.pendingPlan.effectiveDate)}
                          </div>
                        ) : null}
                      </div>

                      {session.billingMode === "prepaid" ? (
                        <button
                          type="button"
                          onClick={() => {
                            onDismiss();
                            router.push("/join?mode=renew");
                          }}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient py-2.5 text-xs font-black text-white"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Add time or upgrade
                        </button>
                      ) : session.status === "canceling" ? (
                        confirmResume ? (
                          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/6 p-3">
                            <p className="text-sm font-black text-white">Resume auto-renewal?</p>
                            <p className="mt-1.5 text-[11px] leading-relaxed text-white/50">
                              Your plan will remain active and{" "}
                              {activeSku ? (
                                <>
                                  <span className="font-bold text-white/75">
                                    {formatMoney(activeSku.price, activeSku.currency)}
                                  </span>{" "}
                                  will be charged
                                </>
                              ) : (
                                "your next payment will be charged"
                              )}{" "}
                              on {formatAccountDate(session.nextBillingDate ?? session.paidThrough)}.
                            </p>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setConfirmResume(false)}
                                className="rounded-lg border border-white/10 py-2 text-xs font-bold text-white/60"
                              >
                                Not now
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  resumeSubscription();
                                  setConfirmResume(false);
                                  setCancelStep(0);
                                }}
                                className="rounded-lg bg-emerald-500/85 py-2 text-xs font-black text-white"
                              >
                                Resume renewal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmResume(true)}
                            className="w-full rounded-xl border border-emerald-400/25 bg-emerald-400/8 py-2.5 text-xs font-black text-emerald-200"
                          >
                            Resume auto-renewal
                          </button>
                        )
                      ) : cancelStep > 0 ? (
                        <div className="rounded-xl border border-red-400/20 bg-red-400/6 p-3">
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-red-200/80">
                              Cancel renewal
                            </p>
                            <span className="text-[10px] text-white/30">Step {cancelStep} of 3</span>
                          </div>

                          {cancelStep === 1 ? (
                            <>
                              <p className="text-sm font-black text-white">Before you cancel</p>
                              <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-white/55">
                                <li>• No further recurring payments will be taken.</li>
                                <li>• Access continues until {formatAccountDate(session.nextBillingDate)}.</li>
                                <li>• You can resume renewal before that date.</li>
                              </ul>
                            </>
                          ) : cancelStep === 2 ? (
                            <>
                              <p className="text-sm font-black text-white">Why are you leaving?</p>
                              <div className="mt-2 grid gap-1.5">
                                {["Too expensive", "Not enough to watch", "Technical issues", "Only needed it temporarily", "Other"].map(
                                  (reason) => (
                                    <button
                                      key={reason}
                                      type="button"
                                      onClick={() => setCancelReason(reason)}
                                      className={cn(
                                        "rounded-lg border px-3 py-2 text-left text-[11px] font-semibold",
                                        cancelReason === reason
                                          ? "border-brand-purple/50 bg-brand-purple/15 text-white"
                                          : "border-white/8 bg-black/15 text-white/50 hover:border-white/15"
                                      )}
                                    >
                                      {reason}
                                    </button>
                                  )
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-black text-white">Final confirmation</p>
                              <p className="mt-1 text-[11px] leading-relaxed text-white/50">
                                Type <span className="font-black text-white">CANCEL</span> to turn off renewal.
                              </p>
                              <input
                                value={cancelPhrase}
                                onChange={(event) => setCancelPhrase(event.target.value)}
                                placeholder="Type CANCEL"
                                autoComplete="off"
                                className="mt-3 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-xs font-bold uppercase text-white outline-none placeholder:normal-case placeholder:text-white/25 focus:border-red-400/40"
                              />
                            </>
                          )}

                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (cancelStep === 1) {
                                  setCancelStep(0);
                                  setCancelReason("");
                                  setCancelPhrase("");
                                } else {
                                  setCancelStep((cancelStep - 1) as 1 | 2);
                                }
                              }}
                              className="rounded-lg border border-white/10 py-2 text-xs font-bold text-white/60"
                            >
                              {cancelStep === 1 ? "Keep plan" : "Back"}
                            </button>
                            {cancelStep < 3 ? (
                              <button
                                type="button"
                                onClick={() => setCancelStep((cancelStep + 1) as 2 | 3)}
                                disabled={cancelStep === 2 && !cancelReason}
                                className="rounded-lg bg-white/10 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-35"
                              >
                                Continue
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={cancelPhrase.trim().toUpperCase() !== "CANCEL"}
                                onClick={() => {
                                  cancelSubscriptionAtPeriodEnd();
                                  setCancelStep(0);
                                  setCancelReason("");
                                  setCancelPhrase("");
                                }}
                                className="rounded-lg bg-red-500/85 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-35"
                              >
                                Turn off renewal
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onDismiss();
                              router.push("/join?mode=manage");
                            }}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/4 py-2.5 text-[11px] font-bold text-white/65"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            Manage plan
                          </button>
                          <button
                            type="button"
                            onClick={() => setCancelStep(1)}
                            className="rounded-xl border border-white/10 py-2.5 text-[11px] font-bold text-white/45 hover:border-red-400/25 hover:text-red-300"
                          >
                            Cancel renewal
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            <RowButton icon={Cast} label={tvPairing} onClick={() => onDismiss()} />
            <RowButton icon={Settings} label={appSettings} onClick={() => onDismiss()} />
            <RowButton icon={Globe} label={language} onClick={() => onDismiss()} />
          </div>
        </MenuGroup>

        <MenuGroup>
          <div className="divide-y divide-white/8">
            <RowButton icon={Ticket} label={supportTickets} onClick={() => onDismiss()} />
            <RowButton icon={HelpCircle} label={help} onClick={() => onDismiss()} />
            <RowButton icon={Info} label={about} onClick={() => onDismiss()} />
          </div>
        </MenuGroup>
      </div>

      <div className="space-y-2 border-t border-white/8 px-2 pb-2 pt-3">
        <ProfileMenuPromoBanner onBeforeNavigate={onDismiss} />
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/4 py-3 text-xs font-bold uppercase tracking-wider text-white/55 transition-colors hover:border-white/15 hover:bg-white/8 hover:text-white/90"
        >
          <LogOut className="h-3.5 w-3.5" />
          {signOut}
        </button>
      </div>
    </div>
  );
}
