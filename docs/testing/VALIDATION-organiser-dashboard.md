# Family organiser dashboard preview correction

Validated on 17 October 2026.

## Corrected behaviour

Selecting **Family organiser** in Custom Design opens the real family dashboard
at `/?organiser&design-preview`. It uses the same dashboard renderer, family
widgets, fonts, colours, panel styling and content-positioning tools as the main
screen. It does not embed the `/family` management forms.

The family dashboard's screen appearance follows the main dashboard. Built-in
themes use their actual rendered colour/font tokens; enabled custom designs use
their saved appearance. The family layout, portrait placement, content positions
and deliberate panel overrides remain independent. New panel overrides start
with the shared appearance, including heading/body/secondary colours.

The main dashboard shortcut opens `/?organiser`. That screen has navigation back
to the dashboard, **Manage family** at `/family`, settings and fullscreen. The
management forms retain Light / Dark / Auto styling and remain available for
profiles and household edits. Default dashboard layouts include all seven family
widgets, including separate chores and routines. Existing saved family layouts
are preserved. The public theme catalogue is cached for offline dashboard use.

## Regression evidence

- New browser tests first failed because the family preview contained management
  forms and lacked the dashboard renderer; the standalone dashboard route was
  also missing. These tests now verify real bin content, no forms in the preview,
  shared custom fonts/colours, and the continued presence of all seven management
  forms on `/family` as a positive control for the form detector.
- The unsaved-theme test failed until theme selection explicitly refreshed the
  preview. It now checks the resulting Coastal colours.
- Panel-style tests failed with the former sage body/heading colours. Both now
  start with the main screen colours when a panel gets its own style.
- Pure design tests cover inherited appearance, independent geometry/content,
  validated output, default widget visibility and no source mutation. An
  inverted inherited-font assertion was deliberately run red and then restored.
- The offline theme-cache test failed before `/api/themes` was added to the
  worker's public display cache, then passed with the cached response offline.
- Browser checks cover saved positions after server restart and main colour
  changes propagating without moving the family cards.
- Touch/mobile emulation at DPR 2 checks all seven card bounds at 1920 × 1200,
  1200 × 1920, 1024 × 650 and 768 × 1024. Viewport handling is awaited before
  geometry measurements. The portrait layout was also visually inspected after
  a fresh navigation, with all seven distinct headings and one toolbar verified.

The older browser assertions for the family shortcut and saved organiser grid
now target `/?organiser` and dashboard widget selectors. Their exact link,
position and persistence expectations are retained for the corrected display.
The configuration forms themselves are still checked independently.

## Verification

- Full Chrome suite: **57 passed, 0 failed, 0 skipped**.
- Final focused organiser/Home Hub browser rerun after panel-style correction:
  **12 passed, 0 failed, 0 skipped**.
- `npm run verify`: 99 JavaScript files syntax checked; **185 passed, 0 failed,
  0 skipped**.
- Installer shell syntax and `git diff --check`: passed.
- Production Docker build: passed.
- Full verification inside the production image: **185 passed, 0 failed,
  0 skipped**; syntax passed.
- Disposable container smoke: boot, health, main/family display and both
  management pages, assets, APIs and settings/restart persistence passed. The
  container and temporary data volume were removed.

No live external accounts or physical Fire/iPad/Android devices were used.
WebKit/device rendering and live integrations remain unverified. No production
household data or credentials were accessed, and no coverage ratchet is claimed.
