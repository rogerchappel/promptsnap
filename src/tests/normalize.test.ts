import assert from "node:assert/strict";
import test from "node:test";
import { normalizeText } from "../normalize.js";

test("normalizes line endings and trailing whitespace", () => {
  assert.equal(
    normalizeText("hello  \r\n\r\n\r\nworld", ["line-endings", "trim-trailing-whitespace", "collapse-blank-lines", "final-newline"]),
    "hello\n\nworld\n"
  );
});

test("rejects unknown normalizers", () => {
  assert.throws(() => normalizeText("x", ["mystery"]), /Unknown normalizer/);
});

test("final newline normalization is idempotent for ordinary and empty text", () => {
  for (const input of ["ordinary text", "ordinary text\n", "ordinary text\n\n"]) {
    const normalized = normalizeText(input, ["final-newline"]);
    assert.equal(normalizeText(normalized, ["final-newline"]), normalized);
    assert.equal(normalized, "ordinary text\n");
  }

  const empty = normalizeText("", ["final-newline"]);
  assert.equal(empty, "\n");
  assert.equal(normalizeText(empty, ["final-newline"]), empty);
});
