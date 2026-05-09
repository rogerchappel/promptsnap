const NORMALIZERS = new Set([
  "line-endings",
  "trim-trailing-whitespace",
  "final-newline",
  "collapse-blank-lines"
]);

export function normalizeText(input: string, normalizers: string[]): string {
  let text = input;
  for (const normalizer of normalizers) {
    if (!NORMALIZERS.has(normalizer)) {
      throw new Error(`Unknown normalizer: ${normalizer}`);
    }
    if (normalizer === "line-endings") {
      text = text.replace(/\r\n?/g, "\n");
    }
    if (normalizer === "trim-trailing-whitespace") {
      text = text
        .split("\n")
        .map((line) => line.replace(/[ \t]+$/g, ""))
        .join("\n");
    }
    if (normalizer === "collapse-blank-lines") {
      text = text.replace(/\n{3,}/g, "\n\n");
    }
    if (normalizer === "final-newline") {
      text = `${text.replace(/\n*$/g, "")}\n`;
    }
  }
  return text;
}

export function knownNormalizers(): string[] {
  return [...NORMALIZERS].sort();
}
