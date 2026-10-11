# HomeBoard v0.3 validation · 9 October 2026

## Safari browser controls and stale-page refinement · 11 October 2026

- Final verification: 81 JavaScript files checked; 151/151 API/unit tests passed locally and in the production image. Chrome and WebKit each passed all 43 browser scenarios without failures or skips. Shell syntax, Docker build and disposable-container boot/assets/persistence/admin checks passed across two restarts. Synthetic screenshots were reviewed at 1024×620 and 800×600.

- The supplied iPad image still contains the removed 3-week choice and weather eyebrow. Read-only checks confirmed localhost and the LAN endpoint served the same current build, so the image shows an older document rather than the latest markup. Open dashboards now detect a build change on `pageshow`, visibility changes and periodic checks. A fresh navigation is still needed once to replace a document running code from before this update.
- Layout uses the visible viewport height in CSS pixels, never physical screen pixels or a multiplication by devicePixelRatio. Resize, rotation, fullscreen and returning to Safari update the height. Pinch zoom retains the underlying page layout. Browser viewport guidance: [WebKit dynamic viewport units](https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/) and [VisualViewport API](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport).
- Touch/mobile emulation at DPR 2 covers 1024×620 and 1180×650 usable landscape areas and 768×880 portrait, across all 17 themes, with Month, a long weather place name, five visible family cards, three bins, a synthetic JPEG and news. An 800×600 boundary also includes seven forecast days and charging. Every month has 42 visible cells with readable rows and a visible first appointment name. Card and month detectors include deliberately displaced elements.
- Browser API boundary tests simulate Safari's visible height shrinking while the layout viewport remains larger, and ensure deliberate pinch zoom does not halve the page layout. A real fixture-server restart with a new build verifies automatic page replacement while preserving the selected month/date, calendar filter and screen query.
- Red/green regressions cover stale asset retrieval, absent build identity, live-page updates, measured viewport height, off-screen family cards, a clipped narrow charging/weather rail and clipped appointment titles. Month-date tapping also exposed an assignment to a shadowed constant; clicking a date or the +N summary now opens Day with full timings. Existing geometry assertions retain their tolerances and wait for the new asynchronous viewport update before measurement.
- No production accounts or personal photos are used in browser automation. Physical iPad/Safari and Android device checks remain unverified; browser emulation is explicitly separate from physical testing.


## Weather rail and populated dashboard refinement · 10 October 2026

- Final verification: 77 JavaScript files checked; 137/137 API/unit tests passed locally and in the production image. Chrome and WebKit each passed all 39 browser scenarios, with zero failures or skips. Shell syntax, Docker build and disposable-container boot/static-asset/persistence/admin checks passed across two restarts.

- Weather is a permanent child of the built-in right-hand rail, immediately after smart charging. Custom designs retain their independent panel placement and restore the rail on return to a built-in layout.
- The new populated-dashboard scenario exercises all 17 themes at 1920×1080, 1024×768, 768×1024 and 600×960 with seven forecast days, an uploaded synthetic JPEG, three bin collections, charging and news fixtures. It checks forecast labels/card bounds against both the panel and its rail, a visible first charging slot, at least 80 pixels of photo space, readable time/date fonts and every bin row fitting its card.
- Empty family strips collapse when weather is disabled and return when a collection is populated; this previously reserved unused tablet space.
- Analog and combined clock modes are checked with the populated tablet layout. Five-day weather, disabled charging, custom/default restoration and forecast chart accessibility labels are also covered. Deliberately displaced forecast and bin rows prove the clipping detectors reject overflow.
- Regressions were observed failing before fixes: weather outside the right rail, stale charging retaining its active highlight, analog preferences hiding explicitly composed digital time, photos collapsing, clipped charging content and unreadable clock text. Three-row bin checks also exposed the Metro strip's extra padding at desktop sizes.
- Screenshots use demo fixtures across HomeBoard, Metro and Observatory at iPad portrait/landscape, Android landscape and desktop sizes. No personal photos, weather credentials or energy account data are used. Physical tablets and new live provider checks remain unverified.


## Device preview and tablet density refinement · 10 October 2026

- 77 JavaScript files checked; 136/136 tests passed locally and in the image.
- Full Chrome and WebKit runs each passed 35/35 browser scenarios. The final
  inline-time refinement also passed its strengthened five-visible-day check in
  both engines using a pinned 5 October 2026 demo calendar.
- Checks cover the removed weather wording and 3-week choices, legacy rolling
  preferences displaying Week, all 42 Month cells inside the initial viewport,
  three bin collections with oversized saved typography fitting a tablet card,
  ticker icons staying inside their panels, and native iPad preview dimensions
  swapping correctly with orientation. The visible-day detector was checked
  with deliberately displaced headings.
- Preview layout now renders at native device dimensions, then projects into
  the canvas. The existing overlay alignment test therefore projects the native
  bounds through the iframe scale, preserving its exact one-pixel tolerance.
  Dragging, keyboard resize, cropping, layering, typography and restored clock
  composition remain covered by the original assertions.
- Docker build and disposable-container static assets/API/boot checks passed,
  including two restarts with saved designs, settings and credential persistence.
- Visual review used synthetic data in iPad portrait/landscape, Android portrait,
  desktop, Month and native-resolution designer previews. Physical iPad and
  Android hardware remains unverified.

## Earlier tablet and panel refinement · 10 October 2026

- Local verification: 76 JavaScript files checked; 135/135 API/unit tests passed.
- Chrome and WebKit: 29/29 full browser scenarios plus the new touch-target
  scenario passed in each engine (30 distinct scenarios per engine).
- Nine custom-dashboard viewports: 768×1024, 1024×768, 820×1180, 1180×820,
  800×1280, 1280×800, 1366×1024, 1024×1366 and 600×960. All 17 built-in themes
  were checked at four tablet sizes, with a configured news feed.
- Regression checks cover bin stripe padding despite compact styling, ordinal
  dates and matching wheelie-bin colours, publisher icons in both preview and
  display, same-line date/time placement, oversized dates in short slots,
  seven calendar columns without horizontal scrolling, and 44px touch targets.
- The bounds detector was verified with a deliberately displaced calendar.
  Date clipping was observed again with the fitting observer disconnected,
  then passed when restored. Original bin/date, missing layout action, preview
  branding, week-width and touch-target regressions were observed red.
- Production image: 135/135 tests passed. Docker build, disposable-container
  boot/static-assets/API checks, two restarts and settings/library/private-key
  persistence checks passed. Installer syntax and Git whitespace checks passed.
- Visual review used synthetic household data at iPad portrait/landscape,
  Android portrait and desktop sizes. Physical iPad/Android hardware remains
  unverified; browser emulation does not establish device-specific behaviour.

Text fitting responds to rendered panel changes through
[ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver).
The dashboard uses the available dynamic viewport height and safe-area padding;
see [MDN viewport lengths](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length).
Custom designs retain separate saved portrait and landscape compositions and
remain schema 6 compatible. Long contents scroll within their cards.

## Original automated verification

Original v0.3 release results: **116/116** API/unit tests locally and in the production image; **12/12** Chrome and **12/12** WebKit browser scenarios; zero failures or skips. Docker build, restart/persistence smoke checks, installer syntax and Git whitespace checks passed.

The release uses Node 24.19.0 for local verification; the package requires Node 22.19.0 or later. At the original release, `npm run verify` checked 68 JavaScript files and ran 116 API/unit regressions. Existing assertions remain intact. Installer shell syntax and Git whitespace checks are included in the release checks.

New regressions cover independent management appearance and rejection of invalid choices, optional password removal and unauthorized rejection, durable settings/admin state across restart, eight-edge integer resize geometry and bounds, valid starter layouts without overlapping visible panels, version 3 gradient persistence/import validation, preserved legacy gradient endpoints, and worldwide timezone fallback/current aliases.

The separate browser suite uses isolated fixture servers and disposable household data. Its twelve scenarios cover:

- Visible starter thumbnails and empty selected family panel headings.
- Left drag/resize, right-click without movement, one-step undo/redo and preset sizing.
- Direct context-menu font, text size and placement dropdowns.
- Actual canvas typography changes and resize handles aligned to rendered edges with panel gaps.
- Independent management appearance, Auto device changes and worldwide timezone selection.
- Design-library save/load/undo/delete and restart persistence.
- Phone widths, calendar controls without overlaps, independent portrait layouts on tablets wider than 700px, and explicit landscape previews on narrow phones.
- Optional password setup/skip and authenticated removal.
- Calendar view buttons without incorrectly applying pressed state to the page body.

Chrome and WebKit runs use actual browser engines. WebKit testing found a missed initial preview message; the editor/display now exchange a ready message before rendering the latest draft. The fixture tests also caught thumbnail collapse, hidden empty panels, incorrect portrait selection, menus closing on their own scroll, fixed clock typography and selection edges ignoring gaps. Each of those regressions was observed failing before its fix.

Browser tests are intentionally separate from the production dependency installation and `npm run verify`. With Playwright installed externally, run:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/node_modules/playwright \
BROWSER_EXECUTABLE=/absolute/path/to/chrome \
node --test tests/browser/release-03.mjs

PLAYWRIGHT_MODULE=/absolute/path/to/node_modules/playwright \
BROWSER_ENGINE=webkit \
node --test tests/browser/release-03.mjs
```

The WebKit run requires the browser matching that Playwright installation. Omit `BROWSER_EXECUTABLE` when using Playwright's installed Chromium. Missing browser packages/binaries fail the tests; they are not silently skipped.

## Production packaging and visual review

The production Docker image is built from the final source. Image verification mounts only the test source and creates isolated temporary fixture data. The smoke container uses a disposable Docker volume and exercises boot, dashboard/settings/family/login pages, new static assets, version 0.3.0, appearance/design/library persistence, admin gating and optional protection across two restarts. Its container and volume are removed after checking.

Docker Desktop reassigns automatically allocated host ports on restart on this host; the smoke harness reads the current published port after each restart. An earlier smoke attempt used the old port while the container was running successfully. An earlier overlapping browser/API check also encountered a fixture-port collision; full API suites are run separately for final verification.

Screenshots use explicitly labelled demo household profiles and the app's labelled demo calendar, without personal connections or photos. Visual review covers the live designer, light/dark settings and organiser, a midnight dashboard, and phone/tablet portrait layouts.

## Limits

Automated provider fixtures cover calendar recurrence/all-day/DST/privacy, cache behaviour, consent failures, feed/weather transport, photo persistence, backup/restore and managed updates. New live Microsoft/Google/Apple subscriptions, real OpenWeather keys, a Proxmox host, physical Safari/iPad and Chrome/Android devices were not exercised for this release. WebKit desktop automation does not establish physical iPad gesture or home-screen installation support.

This validation applies to the local source and built image. GitHub publication and deployment to the user's running instance are separate operations.
