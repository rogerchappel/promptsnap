export function estimateTokens(text: string): number {
  const normalized = text.trim();
  if (!normalized) return 0;
  const words = normalized.match(/[\p{L}\p{N}_'-]+|[^\s\p{L}\p{N}]/gu) ?? [];
  const charEstimate = Math.ceil(normalized.length / 4);
  return Math.max(words.length, charEstimate);
}

export function assertWithinBudget(tokens: number, maxTokens?: number): boolean {
  return maxTokens === undefined || tokens <= maxTokens;
}
