function normalizeCount(value) {
  const count = Number(value ?? 0);
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
}

function normalizeBlockingIssues(value) {
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? Math.floor(count) : 1;
}

function hasOwn(record, key) {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function isHttpUrl(value) {
  try {
    const url = new URL(String(value ?? ""));
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function slugify(value) {
  const slug = String(value ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "next-release";
}

function releaseBlocker(code, reason, artifact, failureRoute = "maintenance-plan") {
  return {
    severity: "blocker",
    code,
    artifact,
    reason,
    requiredFix: reason,
    failureRoute
  };
}

export function planOssMaintenanceCycle(input = {}) {
  const repository = input.repository ?? "unknown/unknown";
  const cycle = slugify(input.cycle ?? input.version ?? "next-release");
  const outputRoot = input.outputRoot ?? `docs/oss-maintenance/${cycle}`;
  const signals = input.signals ?? {};
  const criticalVulnerabilities = normalizeCount(signals.criticalVulnerabilities);
  const highVulnerabilities = normalizeCount(signals.highVulnerabilities);
  const openIssues = normalizeCount(signals.openIssues);
  const openPullRequests = normalizeCount(signals.openPullRequests);
  const userFeedbackCount = normalizeCount(signals.userFeedbackCount);
  const externalListings = normalizeCount(signals.externalListings);
  const hasSecuritySignal =
    hasOwn(signals, "criticalVulnerabilities") &&
    hasOwn(signals, "highVulnerabilities");
  const priorities = [];

  if (criticalVulnerabilities + highVulnerabilities > 0) {
    priorities.push({
      id: "security",
      priority: 1,
      reason: `${criticalVulnerabilities} critical and ${highVulnerabilities} high vulnerabilities require remediation.`,
      evidence: "A fresh dependency or code security report with zero unresolved critical or high findings."
    });
  } else if (!hasSecuritySignal) {
    priorities.push({
      id: "security-verification",
      priority: 1,
      reason: "No current critical/high security counts were supplied.",
      evidence: "Run and link a fresh dependency or code security report before selecting a release change."
    });
  }

  if (openPullRequests > 0) {
    priorities.push({
      id: "pull-request-review",
      priority: priorities.length + 1,
      reason: `${openPullRequests} open pull request(s) require review or a documented disposition.`,
      evidence: "Review comments, resolved findings, and CI results linked from the maintenance record."
    });
  }

  if (openIssues > 0) {
    priorities.push({
      id: "issue-triage",
      priority: priorities.length + 1,
      reason: `${openIssues} open issue(s) require reproduction, labels, or a documented next step.`,
      evidence: "Issue links with reproduction status, scope decision, and owner or follow-up."
    });
  }

  if (userFeedbackCount === 0) {
    priorities.push({
      id: "real-user-feedback",
      priority: priorities.length + 1,
      reason: "No real user feedback is recorded for this cycle.",
      evidence: "A public issue or discussion from a real user; fabricated activity does not count."
    });
  }

  if (externalListings > 0) {
    priorities.push({
      id: "ecosystem-evidence",
      priority: priorities.length + 1,
      reason: `${externalListings} external ecosystem listing(s) can be linked as verifiable adoption evidence.`,
      evidence: "Stable public links to accepted directory entries, integrations, or downstream references."
    });
  }

  if (priorities.length === 0) {
    priorities.push({
      id: "release-hygiene",
      priority: 1,
      reason: "No urgent queue or security signal was supplied; preserve release and verification hygiene.",
      evidence: "A scoped change, passing CI, clean security audit, review record, changelog, and release."
    });
  }

  return {
    status: "planned",
    repository,
    cycle,
    goal: input.goal ?? "Complete one evidence-backed open-source maintenance cycle.",
    outputRoot,
    priorities,
    artifacts: [
      {
        path: `${outputRoot}/01-intake-and-signals.md`,
        purpose: "Record source-linked issues, pull requests, security findings, releases, and adoption signals."
      },
      {
        path: `${outputRoot}/02-maintenance-plan.md`,
        purpose: "Select the smallest meaningful change and define acceptance and rollback conditions."
      },
      {
        path: `${outputRoot}/03-change-and-review-evidence.md`,
        purpose: "Link the implementation diff, tests, CI, security audit, and review findings."
      },
      {
        path: `${outputRoot}/04-release-readiness.md`,
        purpose: "Capture the release gate result and every blocker before tagging."
      },
      {
        path: `${outputRoot}/05-adoption-follow-up.md`,
        purpose: "Record only verifiable feedback, listings, users, and downstream references."
      }
    ],
    integrityRules: [
      "Use public links or reproducible command output for every maintenance claim.",
      "Do not fabricate stars, downloads, users, issues, pull requests, or contributor roles.",
      "Do not create empty activity solely to inflate repository history.",
      "Prefer one small user-relevant fix with complete evidence over a large unverified feature."
    ],
    nextActions: priorities.map((item) => item.reason)
  };
}

export function reviewOssReleaseReadiness(input = {}) {
  const blockers = [];
  const evidence = input.evidence ?? {};
  const securityAudit = evidence.securityAudit ?? {};
  const criticalVulnerabilities = normalizeCount(securityAudit.critical);
  const highVulnerabilities = normalizeCount(securityAudit.high);
  const review = evidence.review ?? {};
  const blockingReviewIssues = normalizeBlockingIssues(review.blockingIssues);
  const pullRequest = evidence.pullRequest ?? {};
  const change = input.change ?? {};

  if (!input.version) {
    blockers.push(releaseBlocker("missing-version", "Set the intended semantic version.", "CHANGELOG.md"));
  }

  if (input.repository?.public !== true) {
    blockers.push(
      releaseBlocker("repository-not-public", "Verify that the release repository is public.", "repository-settings")
    );
  }

  if (!input.repository?.license) {
    blockers.push(releaseBlocker("missing-license", "Record the repository's open-source license.", "LICENSE"));
  }

  if (!String(change.summary ?? "").trim()) {
    blockers.push(releaseBlocker("missing-change-summary", "Document the user or maintainer impact.", "maintenance-plan"));
  }

  if (change.issueUrl && !isHttpUrl(change.issueUrl)) {
    blockers.push(
      releaseBlocker(
        "invalid-issue-url",
        "Use a valid public HTTP(S) issue URL or remove it and document the rationale.",
        "01-intake-and-signals.md"
      )
    );
  }

  if (!isHttpUrl(change.issueUrl) && !String(change.rationale ?? "").trim()) {
    blockers.push(
      releaseBlocker(
        "missing-change-rationale",
        "Link a real issue or document why the maintenance change is needed.",
        "01-intake-and-signals.md"
      )
    );
  }

  if (evidence.tests?.passed !== true) {
    blockers.push(releaseBlocker("tests-not-passing", "Attach fresh passing test evidence.", "test-report"));
  }

  if (
    securityAudit.passed !== true ||
    criticalVulnerabilities > 0 ||
    highVulnerabilities > 0
  ) {
    blockers.push(
      releaseBlocker(
        "security-audit-not-clean",
        "Attach a fresh security audit with zero unresolved critical or high findings.",
        "security-audit"
      )
    );
  }

  if (evidence.docs?.updated !== true) {
    blockers.push(releaseBlocker("docs-not-updated", "Update user-facing documentation for the change.", "README.md"));
  }

  if (evidence.changelog?.updated !== true) {
    blockers.push(releaseBlocker("changelog-not-updated", "Add the release entry to the changelog.", "CHANGELOG.md"));
  }

  if (!isHttpUrl(pullRequest.url) || pullRequest.reviewed !== true) {
    blockers.push(
      releaseBlocker(
        "missing-pr-review",
        "Link the release pull request and record a completed review.",
        "pull-request"
      )
    );
  }

  if (blockingReviewIssues > 0) {
    blockers.push(
      releaseBlocker(
        "blocking-review-findings",
        "Resolve every blocking review finding before release.",
        "code-review"
      )
    );
  }

  return {
    status: blockers.length > 0 ? "blocked" : "pass",
    version: input.version ?? null,
    repository: input.repository?.name ?? "unknown/unknown",
    blockers,
    nextAllowedAction: blockers.length > 0 ? "resolve-release-blockers" : "merge-tag-and-publish",
    evidenceSummary: {
      testsPassed: evidence.tests?.passed === true,
      securityAuditPassed:
        securityAudit.passed === true &&
        criticalVulnerabilities === 0 &&
        highVulnerabilities === 0,
      docsUpdated: evidence.docs?.updated === true,
      changelogUpdated: evidence.changelog?.updated === true,
      pullRequestReviewed: isHttpUrl(pullRequest.url) && pullRequest.reviewed === true,
      blockingReviewIssues
    }
  };
}
