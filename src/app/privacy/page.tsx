import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import privacy from "@/data/privacy.json";
import { publicUrl } from "@/utils/asset";

type Block =
  | { type: "p" | "h"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; head: string[]; rows: string[][] };

function PolicyBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "h":
      return <h4 className="pt-2 text-sm font-semibold text-white">{block.text}</h4>;
    case "list":
      return (
        <ul className="space-y-2 pl-1">
          {block.items.map((item) => (
            <li key={item} className="flex gap-3"><span aria-hidden className="text-purple-300">•</span><span>{item}</span></li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/60">
              <tr>{block.head.map((cell) => <th key={cell} scope="col" className="px-4 py-3 font-semibold">{cell}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {block.rows.map(([label, detail]) => (
                <tr key={label} className="align-top">
                  <th scope="row" className="w-2/5 px-4 py-3 font-medium text-white/85">{label}</th>
                  <td className="px-4 py-3">{detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return <p>{block.text}</p>;
  }
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white sm:px-8 md:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-6">
          <Link href="/" className="flex items-center gap-2 text-sm text-white/65 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to DGO</Link>
          <img src={publicUrl("/dgo-logo-new.png")} alt="DGO" className="h-8 w-auto" />
        </header>
        <div className="py-10">
          <ShieldCheck className="mb-4 h-8 w-8 text-purple-400" />
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{privacy.title}</h1>
          <p className="mt-3 text-sm text-purple-300">{privacy.effective}</p>
        </div>
        <article className="rounded-2xl border border-white/10 bg-white/3 p-5 sm:p-8">
          <p className="text-sm leading-7 text-white/80">{privacy.intro}</p>
          {privacy.sections.map((section) => (
            <section key={section.title} className="mt-8 border-t border-white/10 pt-6">
              <h2 className="text-base font-bold leading-relaxed">{section.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-white/75">
                {(section.blocks as Block[]).map((block, i) => <PolicyBlock key={i} block={block} />)}
              </div>
            </section>
          ))}
          <div className="mt-8 space-y-1 border-t border-white/10 pt-6 text-sm text-white/75">
            {privacy.contacts.map((line) => <p key={line}>{line}</p>)}
          </div>
        </article>
        <p className="py-8 text-sm text-white/60">
          Official version: <a href={privacy.url} target="_blank" rel="noopener noreferrer" className="text-purple-300 underline underline-offset-4">watchdgo.com privacy policy</a>
          {" · "}<Link href="/terms/" className="text-purple-300 underline underline-offset-4">Terms & Conditions</Link>
        </p>
      </div>
    </main>
  );
}
