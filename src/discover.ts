import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { matchesAny, relativePosix } from "./glob.js";
import type { PromptSnapConfig, SourcePrompt } from "./types.js";

const ALWAYS_EXCLUDE = new Set([".git", "node_modules", "dist", "coverage"]);

function walk(root: string, dir: string, config: PromptSnapConfig, out: SourcePrompt[]): void {
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
    out.push({ absolutePath: absolute, relativePath: relative, raw: readFileSync(absolute, "utf8") });
  }
}

export function discoverSources(root: string, inputs: string[], config: PromptSnapConfig): SourcePrompt[] {
  const results: SourcePrompt[] = [];
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
        results.push({ absolutePath: target, relativePath: relative, raw: readFileSync(target, "utf8") });
      }
    }
  }
  return results.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}
