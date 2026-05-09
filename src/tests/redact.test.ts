import assert from "node:assert/strict";
import test from "node:test";
import { redactText } from "../redact.js";

test("redacts configurable secrets", () => {
  const text = redactText("API_TOKEN=abc123456789secret\nBearer abcdefghijklmnopqrstuvwxyz", [
    { name: "env", pattern: "(?im)^([A-Z_]+TOKEN=).+$", replacement: "$1[REDACTED]" },
    { name: "bearer", pattern: "(?i)Bearer\\s+[A-Za-z0-9._~+/=-]{16,}", replacement: "Bearer [REDACTED]" }
  ]);
  assert.equal(text, "API_TOKEN=[REDACTED]\nBearer [REDACTED]");
});

test("redacts private key blocks", () => {
  const text = redactText("-----BEGIN PRIVATE KEY-----\nsecret\n-----END PRIVATE KEY-----", []);
  assert.equal(text, "[REDACTED PRIVATE KEY]");
});
