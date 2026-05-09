export type OutputFormat = "text" | "json" | "markdown";

export interface RedactionRule {
  name: string;
  pattern: string;
  replacement?: string;
}

export interface TokenBudgetConfig {
  maxTokens?: number;
  warnTokens?: number;
}

export interface PromptSnapConfig {
  include: string[];
  exclude: string[];
  snapshotDir: string;
  normalizers: string[];
  redactions: RedactionRule[];
  tokenBudget: TokenBudgetConfig;
}

export interface SourcePrompt {
  absolutePath: string;
  relativePath: string;
  raw: string;
}

export interface SnapshotRecord {
  source: string;
  tokens: number;
  sha256: string;
  generatedAt: string;
  content: string;
}

export interface ComparisonResult {
  source: string;
  snapshotPath: string;
  status: "created" | "matched" | "changed" | "missing" | "over-budget";
  tokens: number;
  maxTokens?: number;
  diff?: string;
  message?: string;
}

export interface RunSummary {
  command: "check" | "update" | "diff";
  root: string;
  ok: boolean;
  checked: number;
  created: number;
  matched: number;
  changed: number;
  missing: number;
  overBudget: number;
  results: ComparisonResult[];
}
