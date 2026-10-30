# Release notes

## Unreleased

- Added automatic activity emoji to appointment titles (football, dentist, flights and more) and tidier birthdays: "Astrid's Birthday" shows as 🎂 Astrid, with an age when the title includes a birth year. Private appointments stay masked; switch it off under Calendar connections.
- Removed the duplicate calendar range and moved calendar/person filters into Settings, giving events more dashboard space.
- Added vertical, horizontal and upcoming-icon bin layouts, including icons in the top header, with adjustable icon size and immediate designer previews.
- Added Delete panel for both layout orientations with Undo/restoration, and made charging typography and spacing adapt to its panel with scrollable schedule details.

- Added visible Select text controls and double-click selection in Custom Design, with individual text fonts, sizes, colours, movement and box resizing saved independently of panels and bin cards.
- Added a Transparent panel background switch for every panel plus an accessible background opacity control; corrected a style override that prevented fully transparent surfaces.
- Added Weather panel presentation in the designer, with immediate compact, detailed card, graphical scene and temperature chart previews linked to the Weather settings preference.

- Added three labelled overlay controls to the family dashboard and its designer preview: Main Dashboard, Full Screen / Exit Full Screen, and Settings. The toolbar floats over the layout and keeps touch-sized controls at tablet and narrow-screen widths.

- Corrected the Family organiser designer preview to show the family dashboard widgets instead of management forms. The family dashboard inherits the main dashboard’s screen theme, colours and typography while preserving its own saved layout and content positions.
- Added dashboard navigation to the family display at `/?organiser`; management forms remain at `/family`. Theme changes are reflected in the preview immediately, and the public theme catalogue is cached for offline display.

## v0.3.1 · 17 October 2026

- Added Family Hub, an eighteenth theme inspired by the supplied navy family dashboard, with a coloured time-aligned week, shared lists, photos, weather and news.
- Added four weather presentations, including graphical scenes, and a toggle to show only the next bin collection, including bins collected together.
- Expanded the designer with Fire 10 (1920 × 1200), additional tablet and custom viewport previews, photo overlays, and movable/resizable text groups and bin cards. Dashboard and family organiser layouts now have separate drafts and histories.
- Added a family organiser shortcut immediately before fullscreen and a private-calendar provider selector: iCloud app-specific passwords, plus supported Microsoft 365/Outlook and Google secure sign-in flows. Microsoft and Google calendar APIs use OAuth rather than app passwords.
- Included the richer panel typography, cropping, layering, clock composition and direct Octopus smart charging introduced since v0.3.0, alongside Safari viewport, calendar density, stale-build refresh and Proxmox installation/update fixes.
- Validation: 182 automated tests locally and in Docker, 53 Chrome browser checks, and Docker boot/restart/persistence smoke checks passed. Live calendar account consent and physical Fire/iPad/Android checks remain unverified. See [validation details](docs/testing/VALIDATION-family-hub.md).

### Safari tablet sizing · 11 October 2026

- Dashboard sizing follows the usable visual viewport in CSS pixels, including browser controls, rotation and fullscreen changes, while preserving deliberate pinch zoom. Short tablet layouts compact the rail and share width between visible family cards.
- Tablet Month keeps all six rows visible, prioritises readable appointment names and uses a +N button for additional appointments. Fixed month-date clicks failing to open Day view; cells and count buttons now open full timings.
- Open dashboards detect updated builds on return to the page and periodically, preserving the selected calendar view, date, filters and URL. HTML/code assets have build identities and bypass stale HTTP caching; offline fallback remains available. Unstamped installations use a frontend content identity.

### Creative designer · 10 October 2026

- Weather sits to the right of the calendar below smart charging in the seventeen rail-based themes; Family Hub uses its reference-style header strip. Compact forecast cards wrap within the rail, keep all forecast days visible and preserve space for loaded photos. Empty family strips collapse so the calendar can use the space.
- Fixed stale charging slots retaining an active highlight and custom date/time compositions hiding digital time when the global preference was analog. Forecast chart accessibility labels now reflect five-day or seven-day data.

- Removed the redundant weather eyebrow and 3-week calendar choice. Old stored rolling preferences fall back to Week in the display and settings.
- Designer previews now render at selectable native device resolutions and scale the complete screen, with matching placement/crop/resize overlays.
- Added compact tablet Upcoming rows, a complete six-row Month grid, adaptive bin typography and ticker icons sized to their panel.
- Smart charging prioritises schedules without a next-charge countdown or explanatory footer; stale/error states and current-slot labels remain.

- Added responsive tablet dashboards, full-height custom canvases and calendar-toolbar settings/fullscreen controls. The dashboard family shortcut now sits immediately before fullscreen.
- Date/time text fits resized panels and individual slots; a right-click preset places date and time on one line without changing the portable design schema.
- Bin collections now have stripe padding, matching wheelie-bin icons and ordinal month dates. News tickers identify the selected publisher with locally bundled icons.
- Week/month grids fit all seven columns within tablet calendars; long card contents retain internal scrolling.

- Fixed Octopus authentication to use the required case-sensitive `APIKey` GraphQL input and accept signed planned-energy values as display magnitudes. Verified live authentication, device discovery and schedules without logging credentials.

- Added direct Octopus Energy smart charging with private account-ID/API-key settings, save/test, discovered vehicle/charger selection and connection removal.
- Added a Smart charging panel showing planned windows, countdown, planned energy, source labels and freshness, integrated with designer controls and saved libraries.
- Added shared caching, concurrent-request coalescing, retry backoff, token renewal and explicit stale/unsupported/unavailable states. Charging schedules are excluded from browser offline caching.
- Added schema 6 with migration of existing designs to include an optional thirteenth panel.

- Added direct layer controls with stable front/back and one-step forward/backward ordering, plus a toolbar panel selector for covered panels.
- Added reversible panel cropping with draggable trim handles and direct Hide/Show heading actions.
- Added durable pre-compact restoration that preserves later colour/font choices.
- Added drag/resize and show/hide controls for time, analog clock, date, timezone/location and seconds inside the date/time panel; normal composition can be restored.
- Added schema 5 persistence for crops, compact restoration and clock composition while retaining schema 1–4 support.

- Added independent heading, body and secondary font families, sizes, weights, italic styles, decorations, colours and alignment in right-click menus.
- Added panel-specific padding, item spacing, line/letter spacing, surface gradients/opacity, borders, corners, shadows, vertical alignment, heading visibility and overflow controls, plus a compact preset for small widgets.
- Added editable copies of all eighteen built-in themes. Copies preserve their palettes and adapt their compositions to the editable grid; default themes are never overwritten.
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
