import { SecurityIssue, Severity } from "./types";

interface HeaderCheck {
  header: string;
  severity: Severity;
  description: string;
  recommendation: string;
  cloudflareRemedy: string;
  validate?: (value: string) => { valid: boolean; message?: string };
}

const SECURITY_HEADERS: HeaderCheck[] = [
  {
    header: "Strict-Transport-Security",
    severity: "critical",
    description:
      "HSTS forces browsers to use HTTPS for all future requests, preventing SSL-stripping and downgrade attacks.",
    recommendation:
      "Add Strict-Transport-Security with max-age of at least 31536000 (1 year) and includeSubDomains.",
    cloudflareRemedy:
      "Enable in Cloudflare dashboard: SSL/TLS → Edge Certificates → HTTP Strict Transport Security (HSTS). Set max-age to 12 months with includeSubDomains.",
    validate: (value) => {
      const match = value.match(/max-age=(\d+)/i);
      if (!match)
        return { valid: false, message: "Missing max-age directive." };
      const age = parseInt(match[1], 10);
      if (age < 31536000)
        return {
          valid: false,
          message: `max-age is ${age}s — should be at least 31536000s (1 year) per industry best practice.`,
        };
      return { valid: true };
    },
  },
  {
    header: "Content-Security-Policy",
    severity: "high",
    description:
      "CSP mitigates XSS and data-injection attacks by whitelisting trusted content sources.",
    recommendation:
      "Define a Content-Security-Policy restricting script-src, style-src, and default-src to trusted origins.",
    cloudflareRemedy:
      "Inject via a Transform Rule (HTTP Response Header Modification) in the Cloudflare dashboard, or use Cloudflare Zaraz for third-party script management.",
    validate: (value) => {
      const problems: string[] = [];
      if (value.includes("'unsafe-inline'") && !value.includes("'nonce-")) {
        problems.push(
          "uses 'unsafe-inline' without a nonce, weakening XSS protection",
        );
      }
      if (value.includes("'unsafe-eval'")) {
        problems.push("uses 'unsafe-eval', allowing eval() execution");
      }
      if (value.includes("*") && !value.includes("*.")) {
        problems.push("contains a wildcard (*) source, which is overly permissive");
      }
      if (problems.length > 0) {
        return {
          valid: false,
          message: `CSP is present but ${problems.join("; ")}.`,
        };
      }
      return { valid: true };
    },
  },
  {
    header: "X-Content-Type-Options",
    severity: "medium",
    description:
      "Prevents browsers from MIME-sniffing the Content-Type, blocking attacks that exploit type confusion.",
    recommendation: 'Set X-Content-Type-Options to "nosniff".',
    cloudflareRemedy:
      "Add via a Transform Rule (HTTP Response Header Modification) in the Cloudflare dashboard.",
    validate: (value) => {
      if (value.toLowerCase() !== "nosniff") {
        return {
          valid: false,
          message: `Should be "nosniff", got "${value}".`,
        };
      }
      return { valid: true };
    },
  },
  {
    header: "X-Frame-Options",
    severity: "medium",
    description:
      "Prevents clickjacking by controlling whether the page can be embedded in iframes.",
    recommendation: 'Set X-Frame-Options to "DENY" or "SAMEORIGIN".',
    cloudflareRemedy:
      "Add via a Transform Rule, or migrate to the CSP frame-ancestors directive for more granular control.",
    validate: (value) => {
      const upper = value.toUpperCase();
      if (upper !== "DENY" && upper !== "SAMEORIGIN") {
        return {
          valid: false,
          message: `Should be "DENY" or "SAMEORIGIN", got "${value}".`,
        };
      }
      return { valid: true };
    },
  },
  {
    header: "Referrer-Policy",
    severity: "medium",
    description:
      "Controls how much referrer information is sent with requests, protecting user privacy and preventing URL leakage.",
    recommendation:
      'Set to "strict-origin-when-cross-origin" or "no-referrer" for maximum privacy.',
    cloudflareRemedy:
      "Add via a Transform Rule (HTTP Response Header Modification) in the Cloudflare dashboard.",
    validate: (value) => {
      const safe = [
        "no-referrer",
        "no-referrer-when-downgrade",
        "origin",
        "origin-when-cross-origin",
        "same-origin",
        "strict-origin",
        "strict-origin-when-cross-origin",
      ];
      if (!safe.includes(value.toLowerCase())) {
        return {
          valid: false,
          message: `"${value}" may leak full URLs cross-origin. Use "strict-origin-when-cross-origin".`,
        };
      }
      return { valid: true };
    },
  },
  {
    header: "Permissions-Policy",
    severity: "low",
    description:
      "Restricts which browser features (camera, microphone, geolocation) the page can access.",
    recommendation:
      "Set a Permissions-Policy disabling unused features like camera, microphone, and geolocation.",
    cloudflareRemedy:
      "Add via a Transform Rule (HTTP Response Header Modification) in the Cloudflare dashboard.",
  },
  {
    header: "Cross-Origin-Opener-Policy",
    severity: "low",
    description:
      "Isolates the browsing context to prevent cross-origin attacks such as Spectre side-channel reads.",
    recommendation:
      'Set Cross-Origin-Opener-Policy to "same-origin" for full process isolation.',
    cloudflareRemedy:
      "Add via a Transform Rule (HTTP Response Header Modification) in the Cloudflare dashboard.",
  },
  {
    header: "Cross-Origin-Resource-Policy",
    severity: "low",
    description:
      "Controls which origins can embed or load this resource, preventing unauthorized hotlinking.",
    recommendation:
      'Set Cross-Origin-Resource-Policy to "same-origin" or "same-site".',
    cloudflareRemedy:
      "Add via a Transform Rule (HTTP Response Header Modification) in the Cloudflare dashboard.",
  },
];

const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 25,
  high: 20,
  medium: 12,
  low: 6,
  info: 0,
};

function findHeader(
  headers: Record<string, string>,
  name: string,
): string | undefined {
  const key = Object.keys(headers).find(
    (k) => k.toLowerCase() === name.toLowerCase(),
  );
  return key ? headers[key] : undefined;
}

export interface ScanOutput {
  issues: SecurityIssue[];
  present: string[];
  missing: string[];
  misconfigured: string[];
}

export function scanHeaders(headers: Record<string, string>): ScanOutput {
  const issues: SecurityIssue[] = [];
  const present: string[] = [];
  const missing: string[] = [];
  const misconfigured: string[] = [];

  for (const check of SECURITY_HEADERS) {
    const value = findHeader(headers, check.header);

    if (!value) {
      missing.push(check.header);
      issues.push({
        header: check.header,
        severity: check.severity,
        status: "missing",
        description: check.description,
        recommendation: check.recommendation,
        cloudflareRemedy: check.cloudflareRemedy,
      });
    } else if (check.validate) {
      const result = check.validate(value);
      if (!result.valid) {
        misconfigured.push(check.header);
        issues.push({
          header: check.header,
          severity: check.severity,
          status: "misconfigured",
          description: result.message || check.description,
          recommendation: check.recommendation,
          cloudflareRemedy: check.cloudflareRemedy,
        });
      } else {
        present.push(check.header);
        issues.push({
          header: check.header,
          severity: "info",
          status: "present",
          description: `Correctly configured: ${value}`,
          recommendation: "No action needed.",
        });
      }
    } else {
      present.push(check.header);
      issues.push({
        header: check.header,
        severity: "info",
        status: "present",
        description: `Present: ${value}`,
        recommendation: "No action needed.",
      });
    }
  }

  auditCookies(headers, issues, misconfigured);

  return { issues, present, missing, misconfigured };
}

function auditCookies(
  headers: Record<string, string>,
  issues: SecurityIssue[],
  misconfigured: string[],
): void {
  const cookieValue = findHeader(headers, "set-cookie");
  if (!cookieValue) return;

  const lower = cookieValue.toLowerCase();
  if (!lower.includes("secure")) {
    misconfigured.push("Set-Cookie (Secure)");
    issues.push({
      header: "Set-Cookie",
      severity: "high",
      status: "misconfigured",
      description:
        "Cookies missing the Secure flag can be transmitted over unencrypted HTTP.",
      recommendation: "Add the Secure flag to all Set-Cookie headers.",
      cloudflareRemedy:
        'Ensure SSL mode is "Full (Strict)" in Cloudflare, then set the Secure flag on your origin.',
    });
  }
  if (!lower.includes("httponly")) {
    misconfigured.push("Set-Cookie (HttpOnly)");
    issues.push({
      header: "Set-Cookie",
      severity: "medium",
      status: "misconfigured",
      description:
        "Cookies missing HttpOnly are readable by JavaScript — vulnerable to XSS-based session theft.",
      recommendation: "Add the HttpOnly flag to all session cookies.",
    });
  }
}

export function calculateScore(scanOutput: ScanOutput): number {
  let score = 100;
  for (const issue of scanOutput.issues) {
    const weight = SEVERITY_WEIGHTS[issue.severity];
    if (issue.status === "missing") {
      score -= weight;
    } else if (issue.status === "misconfigured") {
      score -= Math.ceil(weight * 0.6);
    }
  }
  return Math.max(0, Math.min(100, score));
}

export function scoreToGrade(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 80) return "B+";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

export function detectCloudflare(headers: Record<string, string>): boolean {
  return (
    findHeader(headers, "cf-ray") !== undefined ||
    findHeader(headers, "cf-cache-status") !== undefined ||
    findHeader(headers, "server")?.toLowerCase() === "cloudflare"
  );
}
