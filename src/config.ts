import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { knownNormalizers } from "./normalize.js";
import type { PromptSnapConfig } from "./types.js";

export const CONFIG_FILE = "promptsnap.config.json";

export const defaultConfig: PromptSnapConfig = {
  include: ["prompts/**/*.md", "skills/**/*.md", "agents/**/*.md", "*.prompt.md"],
  exclude: ["__snapshots__/**", "node_modules/**", ".git/**", "dist/**"],
  snapshotDir: "__snapshots__",
  normalizers: ["line-endings", "trim-trailing-whitespace", "final-newline"],
  redactions: [
    { name: "env-assignment-secret", pattern: "(?im)^([A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD)[A-Z0-9_]*=).+$", replacement: "$1[REDACTED]" },
    { name: "bearer-token", pattern: "(?i)Bearer\\s+[A-Za-z0-9._~+/=-]{16,}", replacement: "Bearer [REDACTED]" },
    { name: "user-home-path", pattern: "/Users/[^/\\s]+", replacement: "~" }
  ],
  tokenBudget: {
    maxTokens: 8000,
    warnTokens: 6000
  }
};

export function configPath(root: string): string {
  return join(root, CONFIG_FILE);
}

export function loadConfig(root: string): PromptSnapConfig {
  const path = configPath(root);
  if (!existsSync(path)) return structuredClone(defaultConfig);
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    const detail = error instanceof SyntaxError ? error.message : String(error);
    throw configError(path, "$", `must contain valid JSON (${detail})`);
  }
  validateConfig(path, parsed);
  return {
    ...structuredClone(defaultConfig),
    ...parsed,
    include: parsed.include ?? defaultConfig.include,
    exclude: parsed.exclude ?? defaultConfig.exclude,
    normalizers: parsed.normalizers ?? defaultConfig.normalizers,
    redactions: parsed.redactions ?? defaultConfig.redactions,
    tokenBudget: { ...defaultConfig.tokenBudget, ...(parsed.tokenBudget ?? {}) }
  };
}

function configError(path: string, field: string, detail: string): Error {
  return new Error(`Invalid configuration ${path}: ${field} ${detail}`);
}

function validateConfig(path: string, value: unknown): asserts value is Partial<PromptSnapConfig> {
  if (!isRecord(value)) throw configError(path, "$", "must be a JSON object");

  const allowed = new Set(["include", "exclude", "snapshotDir", "normalizers", "redactions", "tokenBudget"]);
  for (const field of Object.keys(value)) {
    if (!allowed.has(field)) throw configError(path, field, "is not a supported field");
  }
  for (const field of ["include", "exclude"] as const) {
    if (field in value) validateStringArray(path, field, value[field]);
  }
  if ("snapshotDir" in value && (typeof value.snapshotDir !== "string" || value.snapshotDir.length === 0)) {
    throw configError(path, "snapshotDir", "must be a non-empty string");
  }
  if ("normalizers" in value) {
    validateStringArray(path, "normalizers", value.normalizers);
    const supported = new Set(knownNormalizers());
    value.normalizers.forEach((normalizer, index) => {
      if (!supported.has(normalizer)) {
        throw configError(path, `normalizers[${index}]`, `must be one of: ${[...supported].join(", ")}`);
      }
    });
  }
  if ("redactions" in value) validateRedactions(path, value.redactions);
  if ("tokenBudget" in value) validateTokenBudget(path, value.tokenBudget);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateStringArray(path: string, field: string, value: unknown): asserts value is string[] {
  if (!Array.isArray(value)) throw configError(path, field, "must be an array of strings");
  value.forEach((entry, index) => {
    if (typeof entry !== "string" || entry.length === 0) {
      throw configError(path, `${field}[${index}]`, "must be a non-empty string");
    }
  });
}

function validateRedactions(path: string, value: unknown): asserts value is PromptSnapConfig["redactions"] {
  if (!Array.isArray(value)) throw configError(path, "redactions", "must be an array of objects");
  value.forEach((rule, index) => {
    const field = `redactions[${index}]`;
    if (!isRecord(rule)) throw configError(path, field, "must be an object");
    for (const key of Object.keys(rule)) {
      if (!["name", "pattern", "replacement"].includes(key)) throw configError(path, `${field}.${key}`, "is not a supported field");
    }
    for (const key of ["name", "pattern"] as const) {
      if (typeof rule[key] !== "string" || rule[key].length === 0) throw configError(path, `${field}.${key}`, "must be a non-empty string");
    }
    if (rule.replacement !== undefined && typeof rule.replacement !== "string") {
      throw configError(path, `${field}.replacement`, "must be a string");
    }
    try {
      const inline = (rule.pattern as string).match(/^\(\?([gimsuy]+)\)(.*)$/s);
      new RegExp(inline?.[2] ?? rule.pattern as string, inline?.[1]);
    } catch {
      throw configError(path, `${field}.pattern`, "must be a valid regular expression");
    }
  });
}

function validateTokenBudget(path: string, value: unknown): asserts value is PromptSnapConfig["tokenBudget"] {
  if (!isRecord(value)) throw configError(path, "tokenBudget", "must be an object");
  for (const field of Object.keys(value)) {
    if (!["maxTokens", "warnTokens"].includes(field)) throw configError(path, `tokenBudget.${field}`, "is not a supported field");
  }
  for (const field of ["maxTokens", "warnTokens"] as const) {
    const budget = value[field];
    if (budget !== undefined && (!Number.isSafeInteger(budget) || (budget as number) < 0)) {
      throw configError(path, `tokenBudget.${field}`, "must be a non-negative integer");
    }
  }
}

export function writeDefaultConfig(root: string, force = false): "created" | "exists" {
  const path = configPath(root);
  if (existsSync(path) && !force) return "exists";
  writeFileSync(path, `${JSON.stringify(defaultConfig, null, 2)}\n`, "utf8");
  return "created";
}
