# Browser Smoke Workflow Baseline

## Summary

GitHub Actions browser smoke provisions Postgres, enables pg_trgm, runs smoke:browser:ci, and then executes dashboard/page/management probes as the cloud browser truth source.

## Source Reference

- [Canonical source](../../../.github/workflows/browser-smoke.yml)

## Notes

- This source anchors the cloud verification workflow, job split, and startup-loop semantics for browser probes.

## Related Wiki Pages

- [CI Browser Smoke](../../wiki/operations/ci-browser-smoke.md)
- [Browser Verification](../../wiki/testing/browser-verification.md)

## Captured At

- 2026-04-06
