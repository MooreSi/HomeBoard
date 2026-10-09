# HomeBoard public release v0.2 validation

Verified on 9 October 2026. The public release version is 0.2.0; earlier files
retain their historical development-build labels.

- `npm run verify`: 37 JavaScript files checked; 69 tests passed, zero failures,
  skips or cancellations. Existing assertions were preserved.
- New update API, installation plan and ticker surface regressions failed before
  implementation. Updater tests use real temporary Git repositories and Node
  children: commit comparison, staged verification, restart, settings persistence,
  verification rejection, boot rollback including partially changed preferences,
  duplicate rejection, dirty checkout preservation, restart selection, retry and
  explicit base reinstall precedence.
- Negative control: inverted the direct-server updater enabled expectation from
  false to true; observed the expected assertion failure, restored it and reran
  all four update API tests green.
- The project-directory-with-spaces fixture now includes package.json, matching
  the real server's version lookup. No assertion was weakened.
- `bash -n scripts/install-lxc.sh scripts/install-node.sh`: passed.
- Production Docker build succeeded with Git and the managed launcher. The image
  suite passed all 69 tests and checked 37 JavaScript files.
- Production managed-container boot and update status API succeeded.
- Browser: compact weekly calendar and bottom BBC RSS ticker visible at 1280×720;
  pause/resume controls worked. Tide's three calendar weeks fit above the ticker.
  At 768×1024 the ticker remained at the bottom and body width matched the viewport.
  README screenshots contain isolated demo appointments and public BBC headlines.

The real GitHub download, controller restart, container-restart persistence and
final GitHub CI results are checked at publication time and reported in the release
notes. Provider request/response wiring, expiry, failure and persistence tests
use isolated fixtures; they do not establish live account consent.

Not verified here: a fresh Proxmox guest, physical Safari/iPad or Chrome/Android,
live Google/Microsoft OAuth consent, Apple library permissions or shared-album
availability, and a subscribed live OpenWeather account. Local Git setup planning
is tested; actual fresh-host package-manager/firewall installation is not performed
on this existing Mac. No coverage ratchet is configured or claimed.
