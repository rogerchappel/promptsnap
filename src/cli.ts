#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { writeDefaultConfig } from "./config.js";
import { formatSummary } from "./report.js";
import { runSnapshots } from "./run.js";
import type { OutputFormat, RunSummary } from "./types.js";

const VERSION = "0.1.0";

type Parsed = { command?: string; inputs: string[]; format: OutputFormat; force: boolean; help: boolean; version: boolean };

function usage(): string {
  return `promptsnap ${VERSION}\n\nUsage:\n  promptsnap init [--force]\n  promptsnap check [paths...] [--format text|json|markdown]\n  promptsnap update [paths...] [--format text|json|markdown]\n  promptsnap diff [paths...] [--format text|json|markdown]\n\nLocal-first prompt snapshot testing. No network calls are made.\n`;
}

function parse(argv: string[]): Parsed {
  const parsed: Parsed = { inputs: [], format: "text", force: false, help: false, version: false };
  const args = [...argv];
  parsed.command = args.shift();
  while (args.length > 0) {
    const arg = args.shift() ?? "";
    if (arg === "--help" || arg === "-h") parsed.help = true;
    else if (arg === "--version" || arg === "-v") parsed.version = true;
    else if (arg === "--force") parsed.force = true;
    else if (arg === "--format") parsed.format = readFormat(args.shift());
    else if (arg.startsWith("--format=")) parsed.format = readFormat(arg.slice("--format=".length));
    else if (arg === "--accept") continue;
    else parsed.inputs.push(arg);
  }
  return parsed;
}

function readFormat(value: string | undefined): OutputFormat {
  if (value === "text" || value === "json" || value === "markdown") return value;
  throw new Error(`Invalid --format: ${value ?? "<missing>"}`);
}

function init(root: string, force: boolean): void {
  const state = writeDefaultConfig(root, force);
  mkdirSync(join(root, "prompts"), { recursive: true });
  const sample = join(root, "prompts", "example.prompt.md");
  if (force || state === "created") {
    writeFileSync(sample, "# Example prompt\n\nYou are a concise local-first assistant.\n", "utf8");
  }
  process.stdout.write(state === "created" ? "Created promptsnap.config.json\n" : "promptsnap.config.json already exists\n");
}

export function main(argv = process.argv.slice(2), root = process.cwd()): number {
  try {
    const parsed = parse(argv);
    if (parsed.version) {
      process.stdout.write(`${VERSION}\n`);
      return 0;
    }
    if (parsed.help || !parsed.command) {
      process.stdout.write(usage());
      return parsed.command ? 0 : 1;
    }
    if (parsed.command === "init") {
      init(resolve(root), parsed.force);
      return 0;
    }
    if (["check", "update", "diff"].includes(parsed.command)) {
      const summary = runSnapshots(resolve(root), parsed.command as RunSummary["command"], parsed.inputs);
      process.stdout.write(formatSummary(summary, parsed.format));
      return summary.ok ? 0 : 1;
    }
    throw new Error(`Unknown command: ${parsed.command}`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = main();
}
