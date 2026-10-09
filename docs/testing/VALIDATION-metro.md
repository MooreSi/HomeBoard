# Metro wall-display validation — 9 October 2026

Inspected the user-supplied DAKboard predefined screen in the browser. Observed
HTML/CSS, jQuery 3.6, Moment/Moment Timezone, Roboto/Rubik, Font Awesome 5 and
custom app/layout scripts. Its appearance was reproduced using HomeBoard's
existing HTML/CSS/JavaScript frontend, original CSS and weather SVG glyphs.
Roboto is bundled locally with its OFL-1.1 licence. No personal reference-screen
URL, calendar records or photographs were added to Git.

- New regression tests ran red for the missing 14-day range, Metro's suggested
  agenda view, clock/view controls, empty agenda rendering and font media type.
  A further test detected finished appointments remaining in today's agenda.
- Seven focused tests then passed: month/DST boundary range, preference restart
  persistence, frontend controls, day grouping/time/location formatting,
  title/location privacy and HTML escaping, font serving and ongoing/all-day
  appointments retained while finished events are omitted.
- Negative control: changed the expected range end from 8 to 9 November; observed
  the intended assertion failure and restored the exact expectation.
- `npm run verify`: 40 JavaScript files checked, 76 tests passed, zero failures,
  skips or cancellations. Existing assertions were preserved.
- Installer shell syntax and `git diff --check`: passed.
- Production Docker build succeeded. Inside the image, all 76 tests passed and
  40 JavaScript files passed syntax checks.
- Disposable Docker smoke check: dashboard/settings, JS modules, stylesheet,
  local font, system and updater APIs returned HTTP 200 with correct media types.
  Metro/agenda preferences survived a container restart.
- Browser at 1280×720: left rail starts at (0,0), fills the viewport height and
  measures 38% of its width; loaded photo and local Roboto confirmed. The ticker
  sits below the right agenda. The old layout failed this same geometry check.
- Browser at 768×1024: photo rail stacks above the calendar; body width equals
  viewport width and ticker remains at the bottom. Agenda End-key scrolling and
  Upcoming/Week/Month navigation passed. Temporary viewport override reset.
- README screenshot uses labelled demo appointments, an original landscape
  illustration, a labelled synthetic cached forecast and public BBC headlines.
  It does not demonstrate subscribed live weather or personal photo access.

Live deployment and GitHub CI results are reported when the change is delivered.
Physical Safari/iPad, Chrome/Android, a fresh Proxmox host, OAuth consent and
live Apple/OpenWeather account checks remain unverified. No coverage ratchet
is configured or claimed.
