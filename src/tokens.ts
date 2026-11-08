export function estimateTokens(text: string): number {
  const normalized = text.trim();
  if (!normalized) return 0;
  const wordEstimate = normalized.match(/[\p{L}\p{N}_'-]+|[^\s\p{L}\p{N}]/gu) ?? [];
  const nonBmpCount = (normalized.match(/[\u{10000}-\u{10FFFF}]/gu) ?? []).length;
  const charEstimate = Math.ceil([...normalized].length / 4);
  return Math.max(wordEstimate.length - nonBmpCount, charEstimate);
}

export function assertWithinBudget(tokens: number, maxTokens?: number): boolean {
  return maxTokens === undefined || tokens <= maxTokens;
}
