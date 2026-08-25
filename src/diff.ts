export function unifiedDiff(label: string, expected: string, actual: string): string {
  if (expected === actual) return "";
  const before = expected.split("\n");
  const after = actual.split("\n");
  const lines = [`--- ${label} snapshot`, `+++ ${label} current`];

  const lengths = Array.from({ length: before.length + 1 }, () => new Uint32Array(after.length + 1));
  for (let left = before.length - 1; left >= 0; left -= 1) {
    for (let right = after.length - 1; right >= 0; right -= 1) {
      lengths[left][right] = before[left] === after[right]
        ? lengths[left + 1][right + 1] + 1
        : Math.max(lengths[left + 1][right], lengths[left][right + 1]);
    }
  }

  let left = 0;
  let right = 0;
  while (left < before.length || right < after.length) {
    if (left < before.length && right < after.length && before[left] === after[right]) {
      lines.push(` ${before[left]}`);
      left += 1;
      right += 1;
    } else if (right < after.length && (left === before.length || lengths[left][right + 1] > lengths[left + 1][right])) {
      lines.push(`+${after[right]}`);
      right += 1;
    } else {
      lines.push(`-${before[left]}`);
      left += 1;
    }
  }
  return `${lines.join("\n")}\n`;
}
