import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { sha256 } from "./hash.js";
import type { SnapshotRecord } from "./types.js";

export function snapshotFileName(relativePath: string): string {
  let encoded = "";
  for (const character of relativePath) {
    if (/[A-Za-z0-9.-]/.test(character)) {
      encoded += character;
    } else if (character === "/") {
      encoded += "__";
    } else {
      for (const byte of Buffer.from(character, "utf8")) {
        encoded += `_${byte.toString(16).padStart(2, "0")}`;
      }
    }
  }
  return `${encoded}.snap.md`;
}

export function snapshotPath(root: string, snapshotDir: string, relativePath: string): string {
  return join(root, snapshotDir, snapshotFileName(relativePath));
}

export function createSnapshot(source: string, content: string, tokens: number): SnapshotRecord {
  return {
    source,
    tokens,
    sha256: sha256(content),
    generatedAt: "deterministic",
    content
  };
}

export function serializeSnapshot(record: SnapshotRecord): string {
  return [
    "---",
    `source: ${record.source}`,
    `tokens: ${record.tokens}`,
    `sha256: ${record.sha256}`,
    "generatedAt: deterministic",
    "---",
    record.content
  ].join("\n");
}

export function parseSnapshot(text: string): SnapshotRecord {
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error("Invalid promptsnap snapshot format");
  const meta = new Map<string, string>();
  for (const line of (match[1] ?? "").split("\n")) {
    const separator = line.indexOf(":");
    if (separator > -1) meta.set(line.slice(0, separator), line.slice(separator + 1).trim());
  }
  const content = match[2] ?? "";
  return {
    source: meta.get("source") ?? "unknown",
    tokens: Number(meta.get("tokens") ?? 0),
    sha256: meta.get("sha256") ?? sha256(content),
    generatedAt: meta.get("generatedAt") ?? "deterministic",
    content
  };
}

export function readSnapshot(path: string): SnapshotRecord | undefined {
  if (!existsSync(path)) return undefined;
  return parseSnapshot(readFileSync(path, "utf8"));
}

export function listSnapshots(root: string, snapshotDir: string): Array<{ path: string; record: SnapshotRecord }> {
  const directory = join(root, snapshotDir);
  if (!existsSync(directory)) return [];
  const snapshots: Array<{ path: string; record: SnapshotRecord }> = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".snap.md")) continue;
    const path = join(directory, entry.name);
    try {
      snapshots.push({ path, record: parseSnapshot(readFileSync(path, "utf8")) });
    } catch {
      // Unrelated or malformed files are not confirmed snapshots and remain untouched.
    }
  }
  return snapshots;
}

export function writeSnapshot(path: string, record: SnapshotRecord): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, serializeSnapshot(record), "utf8");
}
