import test from "node:test";
import assert from "node:assert/strict";
import { canTransition, validateByStatus } from "../lib/observation-rules";

test("canTransition allows only defined transitions", () => {
  assert.equal(canTransition("Draft", "Active"), true);
  assert.equal(canTransition("Active", "Archived"), true);
  assert.equal(canTransition("Archived", "Active"), true);
  assert.equal(canTransition("Draft", "Archived"), false);
  assert.equal(canTransition("Archived", "Draft"), false);
});

test("validateByStatus enforces required fields for Active/Archived", () => {
  const draftErrors = validateByStatus({ status: "Draft" });
  assert.deepEqual(draftErrors, []);

  const activeErrors = validateByStatus({
    status: "Active",
    title: "",
    observation: "Observed",
    context: [],
    interpretation: "",
    nextAction: ""
  });

  assert.deepEqual(activeErrors.sort(), ["context", "interpretation", "nextAction", "title"].sort());
});
