# v0.1.2 Maintenance Plan

## Problem

The repository had new high-severity transitive dependency findings and did not
yet provide a reusable workflow for source-linked issue triage, security
remediation, pull request review, and release gating.

## Smallest meaningful change

1. Remediate the current npm audit findings without changing runtime APIs.
2. Add an `oss-maintainer-workflow` skill.
3. Add two read-only MCP tools:
   - `plan_oss_maintenance_cycle`
   - `review_oss_release_readiness`
4. Dogfood the workflow with this public maintenance record.
5. Update README, manifest, tests, and changelog for v0.1.2.

## Acceptance

- Existing MCP tools remain available.
- New planner prioritizes unresolved critical/high findings.
- Release gate blocks missing tests, security audit, docs, changelog, PR, or
  review evidence.
- Complete evidence passes the release gate.
- Plugin validation passes.
- All automated tests pass.
- Fresh npm audit reports zero known vulnerabilities.
- Pull request diff contains only the scoped maintenance release.

## Failure and rollback

- If dependency updates break tests, retain the previous lockfile and do not
  release.
- If plugin validation fails, correct the manifest or skill structure before
  publishing.
- If the pull request has unresolved blocking review findings, do not tag
  v0.1.2.
