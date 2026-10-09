# HomeBoard v0.21 validation · 9 October 2026

## Calendar and custom design

The new calendar regressions failed because Upcoming omitted November entries and no next-page operation existed. The original fourteen-day initial window contract remains unchanged; successive windows provide continuing browsing. Design save/restart and invalid-design regressions failed because customDesign was unknown, then passed with strict validation and durable settings writes.

- `npm run verify`: 92 tests passed, 0 failed, 0 skipped; 49 JavaScript files syntax-checked. Existing assertions retained.
- Negative control: a deliberately wrong expected imported design failed with exit 1, then was restored. Invalid theme fields, executable font values, malformed colours and out-of-grid panels are explicit rejection controls.
- `bash -n scripts/install-lxc.sh scripts/install-node.sh`: passed.
- Docker production build and the same 92 tests inside the production image: passed.
- Disposable production container: boot, health, dashboard/settings, both design modules and local font returned HTTP 200. A saved custom design remained identical after Docker restart. Disposable container removed afterward.
- Isolated browser demo: Upcoming continued to October 23 and November 6; Month loaded November and scrolling loaded December; Week scrolling loaded its next page. Today reset to one page. Navigation and initial view remained usable.
- Browser design editor: exact clock position changed to column 2; keyboard movement and undo worked; valid theme import previewed and saved; an import containing a calendar connection field was rejected. Disabling Custom Design restored the built-in dashboard.
- Landscape and portrait browser viewport checks: custom grid at larger sizes; 390px layout stacked panels with body width equal to viewport. Documentation screenshot contains isolated demo settings only.

Provider, recurring/all-day, cancellation, DST, privacy, photo, weather, RSS and updater fixtures ran in the full suite. New changes do not alter provider credentials or consent. Live Microsoft/Google consent, a configured home weather location, physical Safari/iPad and Chrome/Android displays, and a real Proxmox install were not verified for this release. GitHub CI and the final installed commit are checked during publication.
