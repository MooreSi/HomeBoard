# Validation — 9 October 2026

Environment: macOS host, Node 26.0.0, Docker Engine 29.5.3, Docker Compose 5.1.4.
Production container uses Node 24 Alpine. No Microsoft client ID or personal data
was used in the tests.

## Red/green evidence

- Original ZIP API regression failed on this workspace: `GET /` returned 404
  rather than 200 because `new URL(import.meta.url).pathname` leaves spaces encoded.
- Before the fix, the focused directory-with-spaces regression independently
  failed with the same 404 versus 200 result.
- The fix converts the module URL using Node's `fileURLToPath`.
- `npm run verify`: syntax checks passed; 2 tests passed, 0 failed, 0 skipped.
- Negative control: deliberately expecting 201 for the dashboard made the new
  regression fail with 200 versus 201. The original assertion was restored;
  full verification passed again. Original API assertions were not weakened.

## Build and runtime

- `docker compose build`: production image built successfully.
- Both regressions passed in the built image: 2 passed, 0 failed, 0 skipped.
- `docker compose up -d`: dashboard running on port 8080 with its named data volume.
- Separate disposable Docker container/volume: uploaded bytes survived a restart;
  deletion survived a second restart. Test container and volume were removed.
  The first harness attempt reused a random host port after restart and timed out;
  rediscovering the port after restart corrected the harness, then all checks passed.
- In-app browser: initial week view displayed labelled demo events; day view
  showed today's agenda; month view navigated to November; Today and Week
  restored the current week. Full-page screenshot saved locally under
  `artifacts/dashboard.jpg` (excluded from Git).

## Limits

The two automated tests cover isolated API state, invalid input, cross-origin
rejection, uploads/deletion, path traversal and static assets, including folders
with spaces. This is a small scaffold suite, not complete product coverage.

Live Outlook consent/token refresh/Graph pagination, recurrence/all-day data,
DST boundaries, offline calendar caching, browser photo conversion/HEIC support,
privacy controls and physical Safari/iPad or Chrome/Android behaviour remain
unverified. No coverage baseline or Forex Python architecture gates ran here;
those need Dakboard-specific implementations before being claimed.
