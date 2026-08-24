import { rmSync } from "node:fs";
import { relative } from "node:path";
import { loadConfig } from "./config.js";
import { discoverSources } from "./discover.js";
import { unifiedDiff } from "./diff.js";
import { normalizeText } from "./normalize.js";
import { redactText } from "./redact.js";
import { createSnapshot, listSnapshots, readSnapshot, snapshotPath, writeSnapshot } from "./snapshot.js";
import { assertWithinBudget, estimateTokens } from "./tokens.js";
import type { ComparisonResult, PromptSnapConfig, RunSummary, SourcePrompt } from "./types.js";

export function prepareSource(source: SourcePrompt, config: PromptSnapConfig): { content: string; tokens: number } {
  const normalized = normalizeText(source.raw, config.normalizers);
  const redacted = redactText(normalized, config.redactions);
  return { content: redacted, tokens: estimateTokens(redacted) };
}

function emptySummary(command: RunSummary["command"], root: string): RunSummary {
  return { command, root, ok: true, checked: 0, created: 0, matched: 0, changed: 0, missing: 0, warnings: 0, overBudget: 0, stale: 0, results: [] };
}

function push(summary: RunSummary, result: ComparisonResult): void {
  summary.results.push(result);
  summary.checked += 1;
  if (result.status === "created") summary.created += 1;
  if (result.status === "matched") summary.matched += 1;
  if (result.status === "changed") summary.changed += 1;
  if (result.status === "missing") summary.missing += 1;
  if (result.warning) summary.warnings += 1;
  if (result.status === "over-budget") summary.overBudget += 1;
  if (result.status === "stale") summary.stale += 1;
}

function withWarning(result: ComparisonResult, warnTokens: number | undefined): ComparisonResult {
  if (warnTokens === undefined || result.tokens <= warnTokens) return result;
  return {
    ...result,
    warning: true,
    warnTokens,
    warningMessage: `Estimated ${result.tokens} tokens exceeds warning threshold ${warnTokens}`
  };
}

export function runSnapshots(root: string, command: RunSummary["command"], inputs: string[] = []): RunSummary {
  const config = loadConfig(root);
  const sources = discoverSources(root, inputs, config);
  const summary = emptySummary(command, root);
  for (const source of sources) {
    const prepared = prepareSource(source, config);
    const target = snapshotPath(root, config.snapshotDir, source.relativePath);
    const displayPath = relative(root, target);
    const record = createSnapshot(source.relativePath, prepared.content, prepared.tokens);
    const existing = readSnapshot(target);
    if (!assertWithinBudget(prepared.tokens, config.tokenBudget.maxTokens)) {
      push(summary, {
        source: source.relativePath,
        snapshotPath: displayPath,
        status: "over-budget",
        tokens: prepared.tokens,
        maxTokens: config.tokenBudget.maxTokens,
        message: `Estimated ${prepared.tokens} tokens exceeds max ${config.tokenBudget.maxTokens}`
      });
      continue;
    }
    if (command === "update") {
      writeSnapshot(target, record);
      const status = !existing ? "created" : existing.content === prepared.content && existing.sha256 === record.sha256 ? "matched" : "changed";
      push(summary, withWarning({ source: source.relativePath, snapshotPath: displayPath, status, tokens: prepared.tokens }, config.tokenBudget.warnTokens));
      continue;
    }
    if (!existing) {
      push(summary, withWarning({ source: source.relativePath, snapshotPath: displayPath, status: "missing", tokens: prepared.tokens, message: "Run promptsnap update to create this snapshot." }, config.tokenBudget.warnTokens));
      continue;
    }
    if (existing.content === prepared.content && existing.sha256 === record.sha256) {
      push(summary, withWarning({ source: source.relativePath, snapshotPath: displayPath, status: "matched", tokens: prepared.tokens }, config.tokenBudget.warnTokens));
    } else {
      push(summary, withWarning({ source: source.relativePath, snapshotPath: displayPath, status: "changed", tokens: prepared.tokens, diff: unifiedDiff(source.relativePath, existing.content, prepared.content) }, config.tokenBudget.warnTokens));
    }
  }
  if (inputs.length === 0) {
    const discovered = new Set(sources.map((source) => source.relativePath));
    for (const snapshot of listSnapshots(root, config.snapshotDir)) {
      if (discovered.has(snapshot.record.source)) continue;
      if (command === "update") rmSync(snapshot.path);
      push(summary, {
        source: snapshot.record.source,
        snapshotPath: relative(root, snapshot.path),
        status: "stale",
        tokens: snapshot.record.tokens,
        message: command === "update" ? "Removed snapshot for missing source." : "Run promptsnap update to remove this stale snapshot."
      });
    }
  }
  summary.ok = command === "update" ? summary.overBudget === 0 : summary.changed === 0 && summary.missing === 0 && summary.overBudget === 0 && summary.stale === 0;
  return summary;
}
