import { AIAnalysisResult, SecurityIssue } from "./types";

function severityRank(severity: string): number {
  const order: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4,
  };
  return order[severity] ?? 5;
}

function buildPrompt(
  url: string,
  headers: Record<string, string>,
  issues: SecurityIssue[],
  isCloudflare: boolean,
): string {
  const missing = issues
    .filter((i) => i.status === "missing")
    .map((i) => `  - ${i.header} (${i.severity})`);
  const misconfigured = issues
    .filter((i) => i.status === "misconfigured")
    .map((i) => `  - ${i.header}: ${i.description}`);
  const present = issues
    .filter((i) => i.status === "present")
    .map((i) => `  - ${i.header}`);

  const cfContext = isCloudflare
    ? "This site IS served through Cloudflare's network. Tailor recommendations to Cloudflare dashboard settings and features."
    : "This site is NOT currently using Cloudflare. Include recommendations for how Cloudflare could improve their security posture.";

  return `You are a senior web security engineer conducting an HTTP security header audit for: ${url}

${cfContext}

SCAN RESULTS:

Properly configured headers:
${present.length > 0 ? present.join("\n") : "  (none)"}

Missing headers:
${missing.length > 0 ? missing.join("\n") : "  (none)"}

Misconfigured headers:
${misconfigured.length > 0 ? misconfigured.join("\n") : "  (none)"}

Raw response headers:
${Object.entries(headers)
  .map(([k, v]) => `  ${k}: ${v}`)
  .join("\n")}

Respond with ONLY valid JSON matching this exact schema — no markdown fences, no extra text:

{
  "summary": "2-3 sentence executive summary of the site's security header posture. Be specific about what's good and what's concerning.",
  "prioritizedActions": ["Action 1 — most impactful fix first", "Action 2", "Action 3 (up to 5 actions)"],
  "overallAssessment": "A single paragraph: what they're doing well, what needs immediate attention, and one insight a non-security engineer might miss."
}`;
}

function buildFallback(issues: SecurityIssue[]): AIAnalysisResult {
  const actionable = issues
    .filter((i) => i.status !== "present")
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
    .slice(0, 5);

  return {
    summary:
      "AI analysis unavailable — the programmatic scan results above are still accurate and actionable.",
    prioritizedActions: actionable.map(
      (i) => `[${i.severity.toUpperCase()}] ${i.header}: ${i.recommendation}`,
    ),
    overallAssessment:
      "Review the individual header findings above. Address critical and high severity items first.",
  };
}

export async function analyzeWithAI(
  ai: Ai,
  url: string,
  headers: Record<string, string>,
  issues: SecurityIssue[],
  isCloudflare: boolean,
): Promise<AIAnalysisResult> {
  try {
    const response = await ai.run("@cf/meta/llama-3.1-8b-instruct-fp8" as keyof AiModels, {
      messages: [
        {
          role: "system",
          content:
            "You are a concise, expert web security auditor. Always respond with valid JSON only. Never wrap in markdown code fences.",
        },
        {
          role: "user",
          content: buildPrompt(url, headers, issues, isCloudflare),
        },
      ],
      max_tokens: 1024,
      temperature: 0.3,
    });

    const text =
      typeof response === "string"
        ? response
        : (response as { response?: string }).response ?? "";

    const cleaned = text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");

    const parsed = JSON.parse(cleaned);

    return {
      summary: parsed.summary || buildFallback(issues).summary,
      prioritizedActions: Array.isArray(parsed.prioritizedActions)
        ? parsed.prioritizedActions
        : buildFallback(issues).prioritizedActions,
      overallAssessment:
        parsed.overallAssessment || buildFallback(issues).overallAssessment,
    };
  } catch {
    return buildFallback(issues);
  }
}
