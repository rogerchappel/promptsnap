import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { matchesAny, relativePosix } from "./glob.js";
import type { PromptSnapConfig, SourcePrompt } from "./types.js";

const ALWAYS_EXCLUDE = new Set([".git", "node_modules", "dist", "coverage"]);

function addSource(root: string, absolute: string, out: Map<string, SourcePrompt>): void {
  const canonical = realpathSync(absolute);
  if (out.has(canonical)) return;
  out.set(canonical, { absolutePath: canonical, relativePath: relativePosix(root, canonical), raw: readFileSync(canonical, "utf8") });
}

function walk(root: string, dir: string, config: PromptSnapConfig, out: Map<string, SourcePrompt>): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (ALWAYS_EXCLUDE.has(entry.name)) continue;
    const absolute = join(dir, entry.name);
    const relative = relativePosix(root, absolute);
    if (matchesAny(relative, config.exclude)) continue;
    if (entry.isDirectory()) {
      walk(root, absolute, config, out);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!matchesAny(relative, config.include)) continue;
    addSource(root, absolute, out);
  }
}

export function discoverSources(root: string, inputs: string[], config: PromptSnapConfig): SourcePrompt[] {
  const results = new Map<string, SourcePrompt>();
  const targets = inputs.length > 0 ? inputs : [root];
  for (const input of targets) {
    const target = resolve(root, input);
    if (!existsSync(target)) throw new Error(`Input not found: ${input}`);
    const stats = statSync(target);
    if (stats.isDirectory()) {
      walk(root, target, config, results);
    } else if (stats.isFile()) {
      const relative = relativePosix(root, target);
      if (!matchesAny(relative, config.exclude)) {
        addSource(root, target, results);
      }
    }
  }
  return [...results.values()].sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}
