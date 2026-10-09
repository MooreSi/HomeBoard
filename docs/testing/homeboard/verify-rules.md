# HomeBoard verification

Before committing:

```sh
npm run verify
bash -n scripts/install-lxc.sh scripts/install-node.sh
```

`npm run verify` performs JavaScript syntax checks and the isolated Node API/unit
suite. Require zero failures. Do not run simultaneous full suites.

After server, dependency or packaging changes:

```sh
npm run build
docker compose run --rm --no-deps \
  -v "$PWD/test.mjs:/app/test.mjs:ro" \
  -v "$PWD/tests:/app/tests:ro" dashboard npm run verify
```

Smoke-test the production container's health, dashboard/settings pages, assets,
API responses and restart persistence. Use disposable data for mutation checks.
Check browser layout at landscape and portrait sizes. GitHub CI repeats syntax,
tests, shell syntax, Docker build and tests inside the production image.

## Before committing

- Tests and syntax checks pass without hidden skips or weakened assertions.
- New detector/gate failure paths have a negative control and fail closed.
- Imports, callers, asset paths and dependency handler contracts remain valid.
- Changed behaviour is documented and stale counts/claims are corrected.
- Documentation links resolve and required files exist.
- Runtime data, secrets, personal photos and archives remain excluded from Git.
- Relevant build, boot and persistence checks passed; identify anything unverified.

If a check fails, investigate. Do not remove tests, skip them, loosen assertions,
raise tolerances or lower baselines. A legitimate baseline/contract change needs
a concrete requirement and an explanation in the commit. Preserve equally
specific assertions. A mock-target relocation preserves signature and semantics.

There is no coverage ratchet currently; do not report one. If introduced, enforce
its per-source-area floor, add missing tests after regressions, and never lower
it. A gate unable to read its inputs must fail.

## Reporting

Report actual pass/fail/skip counts, syntax results, Docker build/image tests and
live smoke checks. Identify omitted checks and the reason. Provider fixtures
prove wiring and failure handling; they do not establish live account consent,
Apple album availability, subscribed weather access, Proxmox installation or
physical tablet behaviour. State those limits explicitly. Correct documentation
in the same commit whenever a change invalidates an existing number or claim.
