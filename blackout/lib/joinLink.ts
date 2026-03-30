const JOIN_BASE_URL = "https://blackout.codes/join";

export function buildJoinLink(sessionId: string): string {
  const trimmed = sessionId.trim();
  if (!trimmed) return "";
  return `${JOIN_BASE_URL}/${encodeURIComponent(trimmed)}`;
}

export function extractSessionIdFromScan(scanned: string): string {
  const raw = scanned.trim();
  if (!raw) return "";

  // Backward compatibility: older QRs contain only the plain session id.
  if (!raw.includes("://")) {
    return raw;
  }

  try {
    const parsed = new URL(raw);
    const fromQuery = parsed.searchParams.get("sessionId");
    if (fromQuery) return fromQuery.trim();

    const segments = parsed.pathname.split("/").filter(Boolean);
    const maybeId = segments[segments.length - 1];
    return decodeURIComponent(maybeId ?? "").trim();
  } catch {
    return "";
  }
}
