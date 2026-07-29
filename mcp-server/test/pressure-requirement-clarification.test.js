import assert from "node:assert/strict";
import test from "node:test";

import { getPressureFixture, reviewClarificationPressure } from "../src/pressure-fixtures.js";

test("one-line admin request passes when agent drafts assumptions and asks at most three focused questions", () => {
  const fixture = getPressureFixture("rough-admin-one-line");
  const review = reviewClarificationPressure(fixture);

  assert.equal(review.status, "pass");
  assert.equal(review.questionCount, 3);
});

test("over-clarification blocks when agent asks more than three questions without draft", () => {
  const fixture = getPressureFixture("over-clarification");
  const review = reviewClarificationPressure(fixture);

  assert.equal(review.status, "blocked");
  assert.ok(review.blockers.some((blocker) => blocker.code === "too-many-questions-without-draft"));
});

test("vague requirement artifact blocks downstream handoff", () => {
  const fixture = getPressureFixture("vague-product-spec");
  const review = reviewClarificationPressure(fixture);

  assert.equal(review.status, "blocked");
  assert.ok(review.blockers.some((blocker) => blocker.code === "non-actionable-contract"));
});

test("downstream product scope can consume requirement discovery without chat context", () => {
  const fixture = getPressureFixture("rough-admin-one-line");
  const review = reviewClarificationPressure({
    ...fixture,
    downstreamHandoff: {
      artifact: "product-scope",
      produced: true,
      consumedWithoutChat: true,
      outputSummary: "MVP, P0/P1/P2, non-goals, and acceptance path are present."
    }
  });

  assert.equal(review.status, "pass");
  assert.equal(review.downstreamHandoff.status, "pass");
});

