import type { OutputFormat, RunSummary } from "./types.js";

export function formatSummary(summary: RunSummary, format: OutputFormat): string {
  if (format === "json") return `${JSON.stringify(summary, null, 2)}\n`;
  if (format === "markdown") return markdownSummary(summary);
  return textSummary(summary);
}

function textSummary(summary: RunSummary): string {
  const lines = [
    `promptsnap ${summary.command}: ${summary.ok ? "ok" : "failed"}`,
    `checked=${summary.checked} matched=${summary.matched} created=${summary.created} changed=${summary.changed} missing=${summary.missing} stale=${summary.stale} warnings=${summary.warnings} overBudget=${summary.overBudget}`
  ];
  for (const result of summary.results.filter((item) => item.status !== "matched" || item.warning)) {
    const details = [result.message, result.warningMessage].filter(Boolean).join("; ");
    lines.push(`${result.status}: ${result.source} -> ${result.snapshotPath}${details ? ` (${details})` : ""}`);
    if (summary.command === "diff" && result.diff) lines.push(result.diff.trimEnd());
  }
  return `${lines.join("\n")}\n`;
}

function markdownSummary(summary: RunSummary): string {
  const lines = [
    `# promptsnap ${summary.command} ${summary.ok ? "passed" : "failed"}`,
    "",
    `- Checked: ${summary.checked}`,
    `- Matched: ${summary.matched}`,
    `- Created: ${summary.created}`,
    `- Changed: ${summary.changed}`,
    `- Missing: ${summary.missing}`,
    `- Stale: ${summary.stale}`,
    `- Warnings: ${summary.warnings}`,
    `- Over budget: ${summary.overBudget}`,
    "",
    "| Status | Source | Snapshot | Tokens | Warning |",
    "| --- | --- | --- | ---: | --- |"
  ];
  for (const result of summary.results) {
    lines.push(`| ${result.status} | \`${result.source}\` | \`${result.snapshotPath}\` | ${result.tokens} | ${result.warningMessage ?? ""} |`);
  }
  const diffs = summary.results.filter((result) => result.diff);
  if (diffs.length > 0) {
    lines.push("", "## Diffs");
    for (const result of diffs) {
      lines.push("", `### ${result.source}`, "", "```diff", result.diff?.trimEnd() ?? "", "```");
    }
  }
  return `${lines.join("\n")}\n`;
}
