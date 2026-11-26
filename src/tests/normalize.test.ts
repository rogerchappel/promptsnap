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

test("final newline normalization is idempotent for ordinary, empty, and newline-only text", () => {
  for (const input of ["ordinary text", "ordinary text\n", "ordinary text\n\n"]) {
    const normalized = normalizeText(input, ["final-newline"]);
    assert.equal(normalizeText(normalized, ["final-newline"]), normalized);
    assert.equal(normalized, "ordinary text\n");
  }

  const empty = normalizeText("", ["final-newline"]);
  assert.equal(empty, "\n");
  assert.equal(normalizeText(empty, ["final-newline"]), empty);

  for (const input of ["\n", "\n\n", "\n\n\n"]) {
    const normalized = normalizeText(input, ["final-newline"]);
    assert.equal(normalized, "\n");
    assert.equal(normalizeText(normalized, ["final-newline"]), normalized);
  }
});

test("final newline alone preserves CR and CRLF content without canonicalizing it", () => {
  for (const input of ["a\r", "a\r\n", "\r\n\r\n"]) {
    const normalized = normalizeText(input, ["final-newline"]);
    assert.equal(normalizeText(normalized, ["final-newline"]), normalized);
  }
  assert.equal(normalizeText("a\r", ["final-newline"]), "a\r\n");
  assert.equal(normalizeText("a\r\n", ["final-newline"]), "a\r\n");
  assert.equal(normalizeText("\r\n\r\n", ["final-newline"]), "\r\n\r\n");
});
