import { NextResponse } from "next/server";

/** UI uses `np`; ISO 639-1 for APIs */
const TARGET_MAP: Record<string, string> = { np: "ne", en: "en" };

const MAX_STRINGS = 100;
const MAX_CHARS = 800;

function mapTarget(locale: string): string {
  return TARGET_MAP[locale] ?? locale;
}

async function translateMyMemory(text: string, source: string, target: string): Promise<string> {
  const pair = `${source}|${target}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(pair)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return text;
  const data = (await res.json()) as {
    responseStatus?: number;
    responseData?: { translatedText?: string };
  };
  if (data.responseStatus !== 200 || !data.responseData?.translatedText) return text;
  return data.responseData.translatedText;
}

async function translateGoogleBatch(
  texts: string[],
  source: string,
  target: string,
  apiKey: string
): Promise<string[]> {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: texts, source, target, format: "text" }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Translate: ${res.status} ${err.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    data?: { translations?: { translatedText: string }[] };
  };
  const list = json?.data?.translations;
  if (!Array.isArray(list) || list.length !== texts.length) {
    throw new Error("Google Translate: unexpected response shape");
  }
  return list.map((t) => t.translatedText);
}

export async function POST(req: Request) {
  let body: { texts?: unknown; sourceLang?: string; targetLang?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sourceLang = typeof body.sourceLang === "string" ? body.sourceLang : "en";
  const targetLang = typeof body.targetLang === "string" ? body.targetLang : "en";
  const textsIn = Array.isArray(body.texts) ? body.texts : null;

  if (!textsIn || textsIn.length === 0) {
    return NextResponse.json({ error: "texts required" }, { status: 400 });
  }
  if (textsIn.length > MAX_STRINGS) {
    return NextResponse.json({ error: `Max ${MAX_STRINGS} strings` }, { status: 400 });
  }

  const texts = textsIn.map((t) => String(t ?? "").slice(0, MAX_CHARS));
  if (texts.some((t) => t.length === 0)) {
    return NextResponse.json({ error: "Empty string in texts" }, { status: 400 });
  }

  const target = mapTarget(targetLang);
  if (targetLang === "en" || target === sourceLang) {
    return NextResponse.json({ translations: texts, engine: "noop" });
  }

  const googleKey = process.env.GOOGLE_TRANSLATE_API_KEY;

  try {
    if (googleKey) {
      const out = await translateGoogleBatch(texts, sourceLang, target, googleKey);
      return NextResponse.json({ translations: out, engine: "google" });
    }

    const out: string[] = [];
    for (let i = 0; i < texts.length; i++) {
      if (i > 0) await new Promise((r) => setTimeout(r, 120));
      out.push(await translateMyMemory(texts[i], sourceLang, target));
    }
    return NextResponse.json({ translations: out, engine: "mymemory" });
  } catch (e) {
    console.error("[translate]", e);
    return NextResponse.json({ translations: texts, engine: "fallback", error: "Translation failed" });
  }
}
