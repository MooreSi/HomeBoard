# iCloud Calendar validation — 16 October 2026

Requirement: offer private iCloud Calendar access with an Apple Account email and
app-specific password alongside existing ICS Calendar Links. Discover calendars,
allow selection, read appointments, retain credentials privately across restarts,
and remove credentials and cached appointments on disconnect.

## Regression evidence

- Initial API tests failed on the absent connect endpoint (405 instead of 200/400).
- The browser test failed waiting for the absent Apple Account email control.
- An external redirect test failed because DNS lookup preceded the host guard;
  the guard now rejects unsupported hosts before DNS or authenticated transport.
- A valid empty CalDAV report failed with an invalid-response error; it now
  returns an empty event list without provider errors.
- Inverting the password non-disclosure assertion caused the focused test to
  fail; the original assertion was restored before final verification.

The 12 provider tests exercise real local HTTP, XML and ICS parsing, recurrence,
all-day appointments, privacy masking, disk persistence/restart, disconnect,
rejected credentials/replacement, protected calendar listing, unsafe discovery,
selection and redirects, outages/stale cache, malformed XML and empty calendars.
Apple HTTP/DNS alone are synthetic boundaries. Fixtures contain demo credentials
and appointments; automated tests never use a personal account.

## Final checks

- `npm run verify`: syntax checked 91 JavaScript files; **177 passed, 0 failed,
  0 skipped** (host Node 26).
- `bash -n scripts/install-lxc.sh scripts/install-node.sh`: passed.
- `npm run build`: production Docker image built successfully (Node 24 Alpine).
- Production-image verification:
  `docker compose run --rm --no-deps -v "$PWD/test.mjs:/app/test.mjs:ro" -v "$PWD/tests:/app/tests:ro" dashboard npm run verify`:
  **177 passed, 0 failed, 0 skipped**, syntax passed.
- `node --test tests/browser/icloud-calendar.mjs` using external Playwright and
  installed Chrome: **2 passed, 0 failed, 0 skipped**. Mobile/touch emulation,
  DPR 2, usable viewports 1024×650 and 768×1024. Connect, field clearing,
  selection saving/reloading, disconnect, page errors and horizontal fit checked.
- Disposable production-container smoke: dashboard, settings, CSS and JS assets,
  health/status APIs, demo events, invalid iCloud credential rejection, saved
  settings across container restart and the healthcheck command all passed.
  The first smoke harness reused an ephemeral published port after restart;
  rereading Docker's newly assigned port corrected the harness and the smoke
  passed. The disposable container was removed.
- `git diff --check`: passed.

Live Apple authentication/calendar retrieval, Safari/iPad, Chrome/Android and
physical-device checks remain unverified. Provider fixtures establish protocol
wiring and failure handling, not live Apple service compatibility.
