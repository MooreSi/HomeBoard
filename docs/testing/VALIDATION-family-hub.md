# Family Hub, designer composition and calendar provider validation

Validated on 17 October 2026.

## Expected behaviour

- Family Hub adds an eighteenth theme without changing the original seventeen
  catalogue entries or their order. Its six-panel layout follows the supplied
  reference: clock, weather, a time-aligned coloured week, shared lists, photo and
  news. Appointment timing remains available in each card's tooltip.
- Weather offers compact, detailed cards, graphical SVG scenes and a temperature
  chart. Explicitly disabled weather/news remain hidden.
- Preview presets include Fire 10 at 1920 × 1200 and additional tablet ratios,
  independent portrait layouts and configurable usable viewport dimensions.
- Dashboard and organiser designs have independent drafts and histories. The
  organiser's profiles remain accessible below its six configurable sections.
- Overlay on photo raises a panel above the photo and gives it a translucent
  surface. Content editing stores bounded percentage positions and text sizes;
  bin cards use stable schedule IDs rather than their changing display order.
- Next-bin mode includes every bin collected on the earliest scheduled day.
- A family organiser link immediately precedes the fullscreen control.
- The private-calendar selector offers iCloud, Microsoft and Google. iCloud uses
  app-specific passwords; Microsoft and Google use their documented OAuth flows.
  Microsoft supports common, consumer and organisation account authorities.

## Regression evidence and deliberate contract changes

The initial new tests failed on the missing reference theme, next-bin filtering,
independent organiser preference and content-layout schema. The timeline test
failed against an empty renderer before implementation. An inverted visible-panel
assertion was deliberately run red, then restored. Focused tests subsequently
passed. Layout and content keys reject unsafe identifiers and out-of-bounds data.
Settings are checked after server restart; browser tests exercise the actual
settings form, previews, content movement, provider selection and server APIs.

The requested eighteenth theme replaces exact catalogue counts of seventeen
with eighteen. The requested organiser shortcut replaces the exact expectation
that the dashboard has no organiser link with one link directly before fullscreen.
The Calendar Link card still has no sign-in controls; account controls now live
in the separate private-provider card, with explicit presence assertions.

The original seventeen themes retain every existing rail, five-card, month-text
and bounds assertion. Family Hub intentionally uses a different six-panel
composition, so it has separate desktop, portrait and reduced-height tablet
checks. Generic bounds checks cover all eighteen themes. A pre-existing resize
check now waits for viewport handling before reading geometry, as required by
DEVELOPMENT.md; its geometry assertions and tolerances are unchanged.

The Microsoft HTTP fixture now accepts exactly the common, consumers and
organizations OAuth devicecode/token endpoints. It still checks read-only scope
and bearer credentials. This models the newly selectable account authorities;
no calendar parsing, persistence or local API is mocked.

## Checks

- `npm run verify`: 97 JavaScript files syntax checked; **182 passed, 0 failed,
  0 skipped**.
- `bash -n scripts/install-lxc.sh scripts/install-node.sh`: passed.
- Chrome browser suite (`release-03.mjs`, `icloud-calendar.mjs`, `home-hub.mjs`):
  **53 passed, 0 failed, 0 skipped**.
- The eight new browser scenarios were rerun after the final reference-theme
  title-fit adjustment. A preceding focused run hit a temporary fixture-port
  collision; no assertion or production behaviour was changed to bypass it.
- `npm run build`: production Docker image built successfully.
- `npm run verify` inside the production image, mounting only test sources:
  **182 passed, 0 failed, 0 skipped**; syntax passed. This uses an isolated
  `docker run` rather than loading the user's Compose environment or data volume.
- Disposable container smoke: boot, health, dashboard/settings/organiser pages,
  six new/changed assets, status/display APIs, settings mutation and restart
  persistence passed. The temporary container and data volume were removed.
- Visual inspection: 1920 × 1200 reference composition with synthetic household
  data and a generated demo JPEG; timeline titles, graphical weather and photo
  placement inspected. No personal photos or credentials were used.
- `git diff --check`: passed.

## Limits

These results do not establish live Apple, Microsoft or Google account consent,
work-tenant policies, real OpenWeather subscriptions, news availability or
physical Fire/iPad/Android behaviour. Chrome emulation covered page dimensions
and rotation; live devices and WebKit were not verified in this change. No
coverage ratchet is configured or claimed. No production container or account
was modified.

Provider references:

- https://developers.google.com/workspace/calendar/caldav/v2/guide
- https://learn.microsoft.com/en-us/exchange/client-developer/exchange-web-services/authentication-and-ews-in-exchange
