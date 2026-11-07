import assert from "node:assert/strict";
import test from "node:test";
import { estimateTokens } from "../tokens.js";

test("estimates tokens deterministically", () => {
  assert.equal(estimateTokens("You are helpful."), 4);
  assert.equal(estimateTokens(""), 0);
});

test("uses character floor for long packed strings", () => {
  assert.equal(estimateTokens("a".repeat(80)), 20);
});

test("counts non-BMP characters as one code point", () => {
  assert.equal(estimateTokens("😀".repeat(8)), 2);
  assert.equal(estimateTokens("a😀b"), 2);
});

test("does not subtract separated emoji from unrelated word tokens", () => {
  assert.equal(estimateTokens("alpha 😀 beta"), 3);
});
