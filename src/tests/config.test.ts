import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { defaultConfig, loadConfig } from "../config.js";

function withConfig(value: string | unknown): { root: string; path: string } {
  const root = mkdtempSync(join(tmpdir(), "promptsnap-config-"));
  const path = join(root, "promptsnap.config.json");
  writeFileSync(path, typeof value === "string" ? value : JSON.stringify(value), "utf8");
  return { root, path };
}

function rejects(value: string | unknown, field: string): void {
  const { root, path } = withConfig(value);
  assert.throws(() => loadConfig(root), (error: unknown) => {
    assert.ok(error instanceof Error);
    assert.match(error.message, new RegExp(`^Invalid configuration ${escapeRegex(path)}: ${field}`));
    return true;
  });
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("reports invalid JSON with the config path", () => rejects("{", "\\$ must contain valid JSON"));

test("validates include and exclude arrays", () => {
  rejects({ include: "prompts/**/*.md" }, "include must be an array of strings");
  rejects({ exclude: [false] }, "exclude\\[0\\] must be a non-empty string");
});

test("validates normalizer names", () => rejects({ normalizers: ["unknown"] }, "normalizers\\[0\\] must be one of"));

test("validates redaction fields and patterns", () => {
  rejects({ redactions: [{ name: "secret" }] }, "redactions\\[0\\]\\.pattern must be a non-empty string");
  rejects({ redactions: [{ name: "secret", pattern: "[" }] }, "redactions\\[0\\]\\.pattern must be a valid regular expression");
});

test("validates token budget values", () => {
  rejects({ tokenBudget: "large" }, "tokenBudget must be an object");
  rejects({ tokenBudget: { maxTokens: -1 } }, "tokenBudget\\.maxTokens must be a non-negative integer");
});

test("merges valid partial configuration with defaults", () => {
  const { root } = withConfig({ include: ["custom/**/*.md"], tokenBudget: { warnTokens: 42 } });
  assert.deepEqual(loadConfig(root), {
    ...defaultConfig,
    include: ["custom/**/*.md"],
    tokenBudget: { ...defaultConfig.tokenBudget, warnTokens: 42 }
  });
});
