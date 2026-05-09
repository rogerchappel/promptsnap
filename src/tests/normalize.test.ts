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
