export function withCacheBust(
  url: string | null | undefined,
  version: string | number | null | undefined
) {
  const safeUrl = String(url || "").trim();
  if (!safeUrl) return "";

  const v = version === null || version === undefined ? "" : String(version);
  if (!v) return safeUrl;

  const joiner = safeUrl.includes("?") ? "&" : "?";
  return `${safeUrl}${joiner}v=${encodeURIComponent(v)}`;
}
