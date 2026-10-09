# HomeBoard testing protocol

This contract applies to HomeBoard's Node server, browser dashboard, providers,
filesystem persistence and installation scripts. Read the [review rules](test-rules.md)
when writing or reviewing a test.

## Red, green, then commit

1. Write expected behaviour from the user's requirement, product documentation
   or a deliberate characterization of existing behaviour.
2. Write the smallest regression test before the production change.
3. Run it and watch it fail for the expected reason. Import errors, typos and
   broken fixtures do not establish a regression. Correct those and rerun.
4. Implement the smallest change that passes; run the focused test green.
5. Refactor only while green, then run `npm run verify` before committing.

A test that has never been red has not proved it can detect the missing behaviour.
For each batch, deliberately break an assertion or plant a violation, observe the
failure, then restore it. Do not run two full suites at once.

## Detectors require negative controls

Every zero-offender assertion must have a companion that proves the detector can
see an offender. Missing directories, unreadable baselines, absent reports,
missing entrypoints and scanners with no input must fail instead of reporting
success. Plant the violation, observe red, remove it and observe green.

## Test types and layout

| Type | Purpose |
|---|---|
| Characterization | Pin existing behaviour before code moves |
| Surface | Call the service directly in its new home |
| Wiring | Prove the real caller reaches the service with the correct bindings |
| Structural | Prove forbidden dependencies or code shapes do not return |

Tests live under `tests/`, named for their subject: `news.test.mjs`,
`display.test.mjs`, `settings.test.mjs`. Shared fixtures live in `tests/helpers/`.
The original archive API regression remains in `test.mjs` with its assertions
intact. Do not introduce duplicate fixtures, obsolete directories or undiscovered
test files. If a module moves, verify both its callers and its new imports/constants.
A verbatim function-body move alone does not prove those dependencies moved.

Keep characterization contracts intact. Delete a characterization test only
when an equivalent surface test exists and has run green; record the replacement.
Relocating a mock target must preserve the function, signature and assertions,
and be identified in the commit. For an explicitly changed product contract,
record the requirement and replace exact expectations with equally specific
expectations for the new contract; never loosen them to accommodate a bug.

## Never weaken tests

Do not delete a failing test, skip it, swallow its exception, comment out its
assertion, widen a tolerance, replace equality with a permissive bound, or lower a
baseline to get green. A failure is evidence that the change or its assumptions
need investigation. Read the failure before editing anything.

## Isolation and realistic fixtures

Use `tests/helpers/app.mjs` for a fresh data directory, isolated server port,
real filesystem and real local HTTP per API test. Always stop child processes,
close sockets and release handles before deleting temporary files. Test both
responses and durable writes, deletions and restart behaviour.

Mock only external boundaries: Microsoft/Google/Apple/OpenWeather HTTP, public
feed transport, DNS, OS/firewall commands or credential stores. Keep parsing,
validation, local HTTP, recurrence expansion and temporary-file operations real.
Provider fakes must reject unexpected requests and record meaningful payloads.
Fixtures must match actual initialization and provider response shapes. Make a
fixture more faithful when dependencies change; do not change assertions to hide
a missing field. Use realistic recurrence, all-day events, dates, images and feeds.

Automated tests must never use personal account consent, credentials, calendars,
photos, or production data. They must not publish albums/calendars, modify remote
accounts, install a real firewall rule, or deploy to a real host. Live checks are
separate, authorized operations and must be reported as live or unverified.

## Determinism and asynchronous work

Pin dates, timezones and DST boundaries; control randomness where used. Never
capture a wall-clock timestamp at module import or depend on sleeps, timing or
execution speed. Isolate provider caches and verify a credential/source change
cannot serve stale data from the previous source.

Await every asynchronous operation and assert rejections with `assert.rejects`.
Changing a synchronous function to async requires inspecting every bare call
site; dropped Promises can silently discard work. Mock awaitable boundaries with
faithful async fakes and check their arguments. After module moves, run syntax
checks and exercise paths that use moved imports/constants.

## Verification and coverage

Run focused `node --test tests/<subject>.test.mjs`, then `npm run verify`.
After server or packaging changes, build Docker, test the production image,
and smoke-test boot, assets and APIs. Installer shell syntax must pass.

There is no coverage ratchet configured yet. Do not claim it exists. If added,
record a per-source-area baseline and enforce it without lowering it. Coverage
means executed lines, not verified behaviour; use uncovered code to find missing
assertions. Moving tests must not reset the baseline. All new gates must prove
their failure path before being trusted.
