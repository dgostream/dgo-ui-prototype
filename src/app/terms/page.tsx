"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import terms from "@/data/terms.json";
import { publicUrl } from "@/utils/asset";
import { getDevRegion } from "@/utils/paywall";

export default function TermsPage() {
  const [region, setRegion] = useState<"nepal" | "international">("nepal");
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("region");
    setRegion(requested === "international" || requested !== "nepal" && getDevRegion() !== "nepal" ? "international" : "nepal");
  }, []);
  const document = terms[region];
  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white sm:px-8 md:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-6">
          <Link href="/" className="flex items-center gap-2 text-sm text-white/65 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to DGO</Link>
          <img src={publicUrl("/dgo-logo-new.png")} alt="DGO" className="h-8 w-auto" />
        </header>
        <div className="py-10">
          <FileText className="mb-4 h-8 w-8 text-purple-400" />
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Terms & Conditions</h1>
          <p className="mt-3 text-sm text-white/60">Select the terms that apply to your subscription.</p>
          <nav aria-label="Terms region" className="mt-6 flex gap-2">
            {(["nepal", "international"] as const).map((value) => (
              <a key={value} href={`?region=${value}`} aria-current={region === value ? "page" : undefined}
                onClick={(e) => { e.preventDefault(); setRegion(value); window.history.replaceState(null, "", `?region=${value}`); }}
                className={`rounded-full border px-5 py-2.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${region === value ? "border-purple-400/50 bg-purple-500/20 text-white" : "border-white/15 text-white/60 hover:text-white"}`}>
                {value === "nepal" ? "Nepal" : "International"}
              </a>
            ))}
          </nav>
        </div>
        <article className="rounded-2xl border border-white/10 bg-white/3 p-5 sm:p-8">
          <h2 className="text-xl font-bold">{document.title}</h2>
          <p className="mt-3 text-sm text-purple-300">Effective date: November 2026</p>
          <p className="mt-2 text-sm leading-relaxed text-white/60">Applies to: {document.scope}</p>
          <p className="mt-8 text-sm leading-7 text-white/80">{document.preamble}</p>
          {document.sections.map((section) => (
            <section key={section.title} className="mt-8 border-t border-white/10 pt-6">
              <h3 className="text-base font-bold leading-relaxed">{section.title}</h3>
              <div className="mt-3 space-y-3 text-sm leading-7 text-white/75">
                {section.body.split(/\s+(?=\d+\.\d+\s|•\s)/).map((paragraph, i) => <p key={i}>{paragraph}</p>)}
              </div>
            </section>
          ))}
        </article>
        <p className="py-8 text-sm text-white/60">Questions about your subscription? <a href="mailto:support@watchdgo.com" className="text-purple-300 underline underline-offset-4">Contact DGO Support</a></p>
      </div>
    </main>
  );
}
