# Release notes

## Unreleased · Creative designer · 10 October 2026

- Added direct layer controls with stable front/back and one-step forward/backward ordering, plus a toolbar panel selector for covered panels.
- Added reversible panel cropping with draggable trim handles and direct Hide/Show heading actions.
- Added durable pre-compact restoration that preserves later colour/font choices.
- Added drag/resize and show/hide controls for time, analog clock, date, timezone/location and seconds inside the date/time panel; normal composition can be restored.
- Added schema 5 persistence for crops, compact restoration and clock composition while retaining schema 1–4 support.

- Added independent heading, body and secondary font families, sizes, weights, italic styles, decorations, colours and alignment in right-click menus.
- Added panel-specific padding, item spacing, line/letter spacing, surface gradients/opacity, borders, corners, shadows, vertical alignment, heading visibility and overflow controls, plus a compact preset for small widgets.
- Added editable copies of all seventeen built-in themes. Copies preserve their palettes and adapt their compositions to the editable grid; default themes are never overwritten.
- Added copy/paste panel styles, position locks, copy-to-other-orientation and an interactive preview without editing handles. Layout commands live in a submenu to keep the main context menu manageable.
- Introduced validated design schema 4 while retaining older designs, portable files and reusable blocks.

## v0.3 · 9 October 2026

- Rebuilt Custom Design around a live dashboard canvas: left-button drag, eight resize handles, grid snapping, keyboard alternatives and one undo step per gesture.
- Added right-click menus for panel position, size, visibility, layers, font, colours and alignment, plus screen palettes, backgrounds, typography and spacing. Toolbar buttons expose the same controls on touch devices.
- Added four finished compositions, five coordinated palettes, configurable gradients, slideshow backgrounds and a visual persistent design library with edit/update/delete. Library designs also support existing schedules, playlists and pinned links.
- Isolated dashboard themes from management pages. Settings, login and the family organiser share Light, Dark or Auto appearance.
- Renumbered all twelve settings sections, removed organiser navigation from dashboard widgets, and made admin protection explicitly optional, with removal available to unlocked browsers.
- Replaced the timezone datalist with a searchable worldwide selector, including UTC, current selections, usual regions and the browser's supported IANA zones.
- Fixed theme styling leaking into custom calendar controls, disappearing empty family panels, portrait tablets using landscape layouts, mobile landscape previews using portrait coordinates, and context menus closing when scrolled.
- Preserved version 1/2 designs and portable imports. Version 3 stores validated gradient/background options. Refreshed the offline cache for the new assets.
- Added API/geometry/persistence regressions and real-browser interaction/layout checks. See the release validation record for results and remaining live-device checks.

## v0.22 · 9 October 2026

- Added multiple ICS feeds, family colours and calendar/person filters while retaining simple read-only calendar setup.
- Added a local family organiser for profiles, shared lists, notices, assigned recurring chores, completion points, visual routines, weekly meals, ingredients-to-shopping, bin schedules with exceptions, and annual countdowns.
- Added scheduled named screens, ordered playlists and pinned screen links.
- Extended Custom Design with seven family widgets, independent portrait placement, panel-specific fonts/colours/alignment, alignment tools, reusable panel templates and a Family organiser starter.
- Added admin editing protection, rate-limited login, phone-friendly management, app icons and a PWA manifest.
- Added connection diagnostics, encrypted backup/restore with pre-restore rollback copies and offline display caching with an explicit offline indicator.
- Added regression tests, a demo screenshot and setup/operation documentation.

## v0.21 · 9 October 2026

- Calendar scrolling continues beyond the original date window in Upcoming, Day, Week, Month and 3 weeks; date pages load on demand. Month grids now fetch appointments in their leading/trailing days too.
- New Custom Design settings: draggable grid placement, exact size/position, layers, visibility, keyboard resizing, undo/redo and layout starters.
- Body and heading fonts, sizes, weight/spacing; custom palettes, backgrounds, opacity, borders, rounded corners and shadows; contrast guidance and live preview.
- Named theme files can be exported and imported between HomeBoard users. Imports validate their schema and preview before saving; files exclude personal data and credentials.
- Responsive custom layouts, durable saved designs, and additional calendar/theme regression tests.

## v0.2

Separate settings, calendar links, photos and iCloud shared albums, OpenWeather forecasts, RSS ticker, sixteen themes, local/Docker/LXC installers, managed GitHub updates with automatic restart, screenshots and MIT licensing. Later main-branch fixes simplified ICS setup, improved cancellation filtering, added news source presets, location autocomplete and standard forecast fallback.
