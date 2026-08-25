import assert from "node:assert/strict";
import test from "node:test";
import { unifiedDiff } from "../diff.js";

function diff(before: string, after: string): string {
  return unifiedDiff("prompt.md", before, after);
}

const header = "--- prompt.md snapshot\n+++ prompt.md current\n";

test("aligns a middle insertion with following context", () => {
  assert.equal(diff("alpha\nbeta\ngamma\n", "alpha\ninserted\nbeta\ngamma\n"), `${header} alpha\n+inserted\n beta\n gamma\n \n`);
});

test("aligns middle deletions and replacements", () => {
  assert.equal(diff("alpha\nremoved\nbeta\n", "alpha\nbeta\n"), `${header} alpha\n-removed\n beta\n \n`);
  assert.equal(diff("alpha\nold\nomega\n", "alpha\nnew\nomega\n"), `${header} alpha\n-old\n+new\n omega\n \n`);
});

test("resolves repeated-line ambiguity deterministically", () => {
  assert.equal(diff("repeat\nold\nrepeat\n", "repeat\nrepeat\nnew\n"), `${header} repeat\n-old\n repeat\n+new\n \n`);
});

test("aligns leading and trailing changes", () => {
  assert.equal(diff("middle\n", "first\nmiddle\nlast\n"), `${header}+first\n middle\n+last\n \n`);
});

test("represents final-newline changes without phantom replacements", () => {
  assert.equal(diff("alpha", "alpha\n"), `${header} alpha\n+\n`);
  assert.equal(diff("alpha\n", "alpha"), `${header} alpha\n-\n`);
});
