import type { RedactionRule } from "./types.js";

function compileRule(rule: RedactionRule): RegExp {
  let pattern = rule.pattern;
  let flags = "g";
  const inline = pattern.match(/^\(\?([gimsuy]+)\)(.*)$/s);
  if (inline) {
    flags = Array.from(new Set(`${inline[1]}g`.split(""))).join("");
    pattern = inline[2] ?? "";
  }
  return new RegExp(pattern, flags);
}

export function redactText(input: string, rules: RedactionRule[]): string {
  let text = input;
  for (const rule of rules) {
    text = text.replace(compileRule(rule), rule.replacement ?? "[REDACTED]");
  }
  text = text.replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, "[REDACTED PRIVATE KEY]");
  return text;
}
