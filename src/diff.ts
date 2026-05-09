export function unifiedDiff(label: string, expected: string, actual: string): string {
  if (expected === actual) return "";
  const before = expected.split("\n");
  const after = actual.split("\n");
  const lines = [`--- ${label} snapshot`, `+++ ${label} current`];
  const max = Math.max(before.length, after.length);
  for (let index = 0; index < max; index += 1) {
    const left = before[index];
    const right = after[index];
    if (left === right) {
      if (left !== undefined) lines.push(` ${left}`);
      continue;
    }
    if (left !== undefined) lines.push(`-${left}`);
    if (right !== undefined) lines.push(`+${right}`);
  }
  return `${lines.join("\n")}\n`;
}
