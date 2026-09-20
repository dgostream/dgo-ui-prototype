export function publicUrl(path: string): string {
  if (!path) return path;
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  if (!base) return path.startsWith("/") ? path : `/${path}`;
  if (path === base || path.startsWith(`${base}/`)) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
