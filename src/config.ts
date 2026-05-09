import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
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
  const parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<PromptSnapConfig>;
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

export function writeDefaultConfig(root: string, force = false): "created" | "exists" {
  const path = configPath(root);
  if (existsSync(path) && !force) return "exists";
  writeFileSync(path, `${JSON.stringify(defaultConfig, null, 2)}\n`, "utf8");
  return "created";
}
