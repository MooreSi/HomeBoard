# Development and testing rules

Read the [HomeBoard testing protocol and review rules](docs/testing/homeboard/README.md) before changing behaviour. These rules apply to this repository's Node.js server, browser application and installers.

1. State expected behaviour from the requirement first. For behaviour changes,
   write the smallest regression test, run it red for the expected reason,
   implement the smallest fix, and run it green. Run the full suite before commit.
2. Test observable behaviour with specific assertions. Cover success, rejection
   and boundaries. Verify filesystem persistence for writes and deletions. Give
   scanners negative controls and prove gates fail when their inputs are absent.
3. Do not delete, skip, weaken or widen failing assertions to make a change pass.
   Characterization tests preserve their contract when code moves.
4. Keep each new test focused on a single behaviour. Use arrange/act/assert,
   await asynchronous calls, assert errors explicitly, and avoid conditional
   assertions. Use faithful fixtures and mock only external boundaries.
5. Give each test fresh temporary data and an isolated local server port. Never
   use personal calendars, credentials, photos in automation.
   Pin calendar dates; do not depend on execution speed or import-time timestamps.
6. Keep synthetic calendar appointments clearly labelled as demo data. Keep
   secrets and cached personal data out of source control and browser responses.
7. Keep tests under `tests/` named for their subject (`server.test.mjs`); the
   ZIP's original API regression remains in `test.mjs` without weakened assertions.
   Never run simultaneous full suites. No test-only production APIs.
8. Run `npm run verify` (syntax plus full isolated API suite) before committing.
   Run `npm run build` for the Docker image and smoke-test boot/static assets/API
   after server or packaging changes. CI repeats syntax, tests and Docker build.
9. Record checks and real results. HomeBoard has no coverage ratchet yet; do not
   claim unconfigured coverage/architecture gates ran here. If one is introduced,
   record and enforce its baseline without lowering it to bypass a failure.
10. Before a release, verify day/week/month navigation, all-day/recurring events,
    timezone/DST edges, cache behaviour, privacy masking, Microsoft consent
    denial/expiry, portrait/landscape scrolling, photo upload/delete/restart
    persistence and Docker restart. Safari/iPad, Chrome/Android and live Outlook
    require explicit device/account verification; report anything unverified.

## Commands

- `npm start`: run locally on port 8080; set `PORT` and `DATA_DIR` if needed.
- `npm run verify`: JavaScript syntax checks and all automated tests (Node 22+).
- `npm run build`: build the production container with Docker Compose.
- `docker compose up -d`: run the built dashboard on port 8080.

Run `npm ci` after cloning. Runtime dependencies are the XML feed parser and
Undici for DNS-validated outbound feed requests. No compilation step is needed.
Docker produces the runnable build. `npm start` launches the managed update supervisor. `npm start` does not load `.env`; Docker Compose reads it. For direct Node
execution set environment variables explicitly or use `node --env-file=.env scripts/runner.mjs`.

## Visual designer browser regressions

The optional browser suite is `tests/browser/release-03.mjs`. It uses the same
isolated server fixture as the API suite and requires an external Playwright
installation. Set `PLAYWRIGHT_MODULE` to that package's absolute path; use
`BROWSER_ENGINE=webkit` for WebKit or `BROWSER_EXECUTABLE` for an installed Chrome.
Run `node --test tests/browser/release-03.mjs` separately from full API suites to
avoid competing fixture port probes. Missing browser dependencies fail the run.
See [v0.3 validation](docs/testing/VALIDATION-v0.3-designer.md) for commands and coverage.
