"use client";

import terms from "@/data/terms.json";

export function TermsConsent({ international = false, checked, onChange }: {
  international?: boolean;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const region = international ? "international" : "nepal";
  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-white/3 p-3">
      <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-white/70">
        <input type="checkbox" required checked={checked} onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#a855f7] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" />
        <span>{terms[region].acknowledgement}</span>
      </label>
      <a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/terms/?region=${region}`} target="_blank" rel="noopener noreferrer"
        className="ml-7 inline-block text-xs font-semibold text-purple-300 underline underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
        Read {international ? "International" : "Nepal"} Terms & Conditions (opens in a new tab)
      </a>
    </div>
  );
}
