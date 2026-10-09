# v0.2 validation — 9 October 2026

Host: macOS, Node 26.0.0, Docker Engine 29.5.3 / Compose 5.1.4.
Production image: Node 24 Alpine, non-root user, healthcheck.

## Automated checks

- `npm run verify`: 23 JavaScript files syntax checked; **38 tests passed,
  0 failed, 0 skipped**.
- Full suite repeated in the built production image: **38 passed, 0 failed,
  0 skipped**. The original ZIP API assertions were not weakened.
- `bash -n scripts/install-lxc.sh scripts/install-node.sh`: passed.
- Local/Docker setup plans, port validation and LXC container-ID/bridge/DHCP plan
  tested without mutating a Proxmox host.
- `npm audit --omit=dev`: 0 vulnerabilities reported at validation time.

Coverage includes preference persistence/validation, credential redaction and
file permissions, static assets in a directory containing spaces, independent
settings page and absence of dashboard upload controls, 10 unique themes,
read-only photo folders and symlink rejection, Microsoft/Google OAuth contracts,
Google session/state rejection, token refresh after restart, consent denial,
calendar selection, merged recurring/paginated events, private-title masking,
stale-calendar fallback, OpenWeather geocoding/seven-day response mapping,
RSS/Atom parsing and unsafe links/entities/private destination rejection,
timezone midnight boundaries, 23/25-hour DST days, all-day dates, and fade sequencing.

External HTTP and DNS are faked at the boundary in provider tests. The server,
local HTTP requests, persistence and public API are real. Unknown external
requests fail closed. No personal calendar, Apple library, provider key or broker
was used in automated tests.

## Red/green and negative controls

Before implementation, settings/integration suites failed for missing routes and
preferences (404/405 and absent behaviour). Timezone and installer skeleton tests
failed because the requested behaviour was unimplemented.

A LXC plan test found `--id` did not assign the container ID; it failed, then passed
after fixing option mapping. A LAN-URL test failed before installer-supplied host
addresses were supported, then passed with the fix.

Browser upload/slideshow testing found fade mode displayed the incoming layer
at opacity 1 while the previous layer was still fading. After the fix, the next
layer stayed at opacity 0 during fade-out. A focused sequencing test pins this.
Deliberately reintroducing the early-visible layer made that regression fail;
the source was restored and the full suite passed again.

The folder enumerator has a negative control: a symlink yields no exposed image,
then adding a real image yields one, proving enumeration is not silently empty.
The existing static-path fixture now includes the real `lib` dependencies and
node_modules, matching the deployed application. Its assertions are unchanged.

## Build, installation and runtime

- Production Docker build passed. The Mac's Docker credentials helper initially
  waited on keychain access; a temporary configuration for anonymous public-image
  pulls resolved it. The shared Docker credential configuration was not modified.
- The actual Docker installer ran, updated the existing container, kept its named
  data volume, printed LAN URLs and passed readiness. Container reports healthy.
- `http://192.168.0.53:8080/api/system` responded with v0.2.0 and correct host LAN
  addresses; the Docker-internal address is not presented as the host address.
- A separate disposable container/volume verified theme, clock, timer and uploaded
  bytes survive restart; deletion survived a second restart. Both were removed.

## Browser QA

On isolated servers, using only generated image fixtures and fake provider data:

- Selected/saved Midnight, America/New_York, analog + digital; the dashboard
  applied all three. No browser errors/warnings were reported.
- Uploaded two PNG files through settings. Browser conversion produced server
  JPEG uploads; management and slideshow showed both images.
- Reproduced and fixed fade sequencing; next/previous and photo count worked.
- Weather location search/selection and test buttons returned seven forecast
  days; the dashboard displayed symbols, temperature trend, highs/lows/rain/wind.
- RSS test returned headlines; an unsafe link was rendered as non-clickable text.
- Microsoft device-code UI completed against the fake provider and showed the
  selected-calendar controls and normalised events.
- Portrait 768×1024, landscape 1024×768 and settings at 390×844 had no horizontal
  page overflow. Calendar scrolling remains internal by design. Viewport reset.
- The deployed `/settings` page loaded. Screenshot saved locally to
  `artifacts/settings-v02.jpg`, excluded from Git.

## Not yet live-verified

Live Microsoft/Google consent, organisational policy, approved Google remote
redirect domains, actual Apple Photos library/cloud download permissions,
OpenWeather account/subscription/billing, real feed availability, physical
Safari/iPad or Chrome/Android touch behaviour, Linux service/firewall installation,
and creation of a real Proxmox guest were not exercised. The local Node server
and Docker installer were exercised; local/Linux/LXC installer plans and shell
syntax are checked, not represented as live host installations.

There is no coverage ratchet yet. Forex-specific Python architecture/coverage
commands do not apply to this Node application and were not claimed to have run.
