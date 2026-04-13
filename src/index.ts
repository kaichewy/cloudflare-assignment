import { Env, ScanResult } from "./types";
import { fetchHeaders } from "./fetcher";
import { scanHeaders, calculateScore, scoreToGrade, detectCloudflare } from "./scanner";
import { analyzeWithAI } from "./ai";
import { renderHTML } from "./ui";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const CACHE_TTL_SECONDS = 3600;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (url.pathname === "/" && request.method === "GET") {
      return new Response(renderHTML(), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (url.pathname === "/api/scan" && request.method === "POST") {
      return handleScan(request, env);
    }

    return Response.json(
      { error: "Not found" },
      { status: 404, headers: CORS_HEADERS },
    );
  },
} satisfies ExportedHandler<Env>;

async function handleScan(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json<{ url?: string }>();
    const targetUrl = body?.url?.trim();

    if (!targetUrl) {
      return jsonError("Please provide a URL to scan.", 400);
    }

    if (targetUrl.length > 2048) {
      return jsonError("URL is too long (max 2048 characters).", 400);
    }

    const cacheKey = `scan:${targetUrl.toLowerCase()}`;
    try {
      const cached = await env.CACHE.get(cacheKey, "json");
      if (cached) {
        return Response.json(
          { ...(cached as object), cached: true },
          { headers: CORS_HEADERS },
        );
      }
    } catch {
      // KV unavailable — continue without cache
    }

    const fetchResult = await fetchHeaders(targetUrl);
    if (!fetchResult.success) {
      return jsonError(fetchResult.error ?? "Failed to fetch URL.", 400);
    }

    const scanOutput = scanHeaders(fetchResult.headers);
    const score = calculateScore(scanOutput);
    const grade = scoreToGrade(score);
    const isCloudflare = detectCloudflare(fetchResult.headers);

    const aiAnalysis = await analyzeWithAI(
      env.AI,
      targetUrl,
      fetchResult.headers,
      scanOutput.issues,
      isCloudflare,
    );

    const result: ScanResult = {
      url: fetchResult.url,
      finalUrl: fetchResult.finalUrl,
      timestamp: new Date().toISOString(),
      statusCode: fetchResult.statusCode,
      score,
      grade,
      isCloudflare,
      headers: {
        raw: fetchResult.headers,
        security: {
          present: scanOutput.present,
          missing: scanOutput.missing,
          misconfigured: scanOutput.misconfigured,
        },
      },
      issues: scanOutput.issues,
      aiAnalysis,
      cached: false,
    };

    try {
      await env.CACHE.put(cacheKey, JSON.stringify(result), {
        expirationTtl: CACHE_TTL_SECONDS,
      });
    } catch {
      // KV unavailable — return results without caching
    }

    return Response.json(result, { headers: CORS_HEADERS });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    return jsonError(`Internal error: ${message}`, 500);
  }
}

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status, headers: CORS_HEADERS });
}
