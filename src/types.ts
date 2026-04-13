export interface Env {
  AI: Ai;
  CACHE: KVNamespace;
}

export interface FetchResult {
  success: boolean;
  url: string;
  finalUrl: string;
  statusCode: number;
  headers: Record<string, string>;
  error?: string;
}

export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type HeaderStatus = "missing" | "misconfigured" | "present";

export interface SecurityIssue {
  header: string;
  severity: Severity;
  status: HeaderStatus;
  description: string;
  recommendation: string;
  cloudflareRemedy?: string;
}

export interface ScanResult {
  url: string;
  finalUrl: string;
  timestamp: string;
  statusCode: number;
  score: number;
  grade: string;
  isCloudflare: boolean;
  headers: {
    raw: Record<string, string>;
    security: {
      present: string[];
      missing: string[];
      misconfigured: string[];
    };
  };
  issues: SecurityIssue[];
  aiAnalysis: AIAnalysisResult;
  cached: boolean;
}

export interface AIAnalysisResult {
  summary: string;
  prioritizedActions: string[];
  overallAssessment: string;
}
