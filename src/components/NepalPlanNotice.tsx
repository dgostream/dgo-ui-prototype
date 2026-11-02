"use client";

import { useEffect, useRef } from "react";

export const NEPAL_ACTIVE_PLAN_MESSAGE = "You already have an active subscription. Another plan cannot be purchased until your current plan ends. For upgrade-related queries, please contact customer support by email or through our official social channels.";

export function NepalPlanNotice() {
  return <div className="space-y-3 text-xs leading-relaxed text-white/65">
    <p>{NEPAL_ACTIVE_PLAN_MESSAGE}</p>
    <a href="mailto:support@watchdgo.com" className="inline-block font-bold text-purple-300 underline underline-offset-4 hover:text-white">Contact support</a>
  </div>;
}

export function NepalPlanDialog({ open, onDismiss }: { open: boolean; onDismiss: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open && !ref.current?.open) ref.current?.showModal();
    else if (!open && ref.current?.open) ref.current.close();
  }, [open]);
  return <dialog ref={ref} onCancel={onDismiss} onClose={onDismiss} aria-labelledby="nepal-plan-title"
    className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-md rounded-2xl border border-white/15 bg-[#100b18] p-6 text-white shadow-2xl backdrop:bg-black/75">
    <h2 id="nepal-plan-title" className="mb-4 text-xl font-black">Active subscription</h2>
    <NepalPlanNotice />
    <button type="button" autoFocus onClick={onDismiss} className="mt-6 w-full rounded-xl bg-brand-gradient px-4 py-3 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Keep browsing</button>
  </dialog>;
}
