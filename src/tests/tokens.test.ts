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
