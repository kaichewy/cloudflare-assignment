import { FetchResult } from "./types";

const PRIVATE_PATTERNS = [
  "localhost",
  "127.",
  "0.0.0.0",
  "::1",
  "[::1]",
  "10.",
  "192.168.",
  "169.254.",
];

const PRIVATE_172_RANGE = { min: 16, max: 31 };

function isPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (PRIVATE_PATTERNS.some((p) => lower.startsWith(p) || lower === p)) {
    return true;
  }
  if (lower.startsWith("172.")) {
    const second = parseInt(lower.split(".")[1], 10);
    if (second >= PRIVATE_172_RANGE.min && second <= PRIVATE_172_RANGE.max) {
      return true;
    }
  }
  return false;
}

function normalizeUrl(input: string): URL {
  let raw = input.trim();
  if (!/^https?:\/\//i.test(raw)) {
    raw = "https://" + raw;
  }
  return new URL(raw);
}

export async function fetchHeaders(input: string): Promise<FetchResult> {
  let parsed: URL;
  try {
    parsed = normalizeUrl(input);
  } catch {
    return {
      success: false,
      url: input,
      finalUrl: input,
      statusCode: 0,
      headers: {},
      error: "Invalid URL format. Please enter a valid domain or URL.",
    };
  }

  if (isPrivateHost(parsed.hostname)) {
    return {
      success: false,
      url: parsed.href,
      finalUrl: parsed.href,
      statusCode: 0,
      headers: {},
      error: "Cannot scan private or internal network addresses.",
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(parsed.href, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Cloudflare-Header-Auditor/1.0" },
    });

    clearTimeout(timeout);

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      success: true,
      url: parsed.href,
      finalUrl: response.url,
      statusCode: response.status,
      headers,
    };
  } catch (err: unknown) {
    const msg =
      err instanceof DOMException && err.name === "AbortError"
        ? "Request timed out after 10 seconds. The target server may be unreachable."
        : `Failed to fetch URL: ${err instanceof Error ? err.message : "Unknown error"}`;
    return {
      success: false,
      url: parsed.href,
      finalUrl: parsed.href,
      statusCode: 0,
      headers: {},
      error: msg,
    };
  }
}
