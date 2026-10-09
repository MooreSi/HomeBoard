# Research and inspiration — 9 October 2026

Google Images was searched for “dakboard screen themes” in the browser. Its
results included DAKboard's template gallery, community templates, monthly
calendars, photo-backed portrait screens, dark information hubs and seasonal
screens. We inspected the result thumbnails. This supplies visual inspiration,
not usage counts; no public top-ten popularity ranking was found.

The ten themes use original CSS, native fonts and CSS-generated previews.
HomeBoard/Minimal: light family planning; Midnight/Chalkboard: high-contrast displays;
Coastal/Lavender: soft accent planners; Forest/Sunset: photo backdrops;
Aurora: dark information dashboard; Gallery: photo-forward layout.

Primary project sources:

- [DAKboard overview](https://dakboard.com/site): modular calendars/photos/weather/news.
- [DAKboard community setups](https://blog.dakboard.com/think-outside-the-grid-customizing-your-dakboard/): monthly and agenda views, varied visual styles.
- [DAKboard calendar settings](https://dakboard.freshdesk.com/support/solutions/articles/35000099436): calendar colours, high contrast, display choices.
- [MagicMirror default modules](https://docs.magicmirror.builders/modules/introduction.html): separate weather, calendar and news modules.
- [MagicMirror calendar module](https://github.com/MagicMirrorOrg/MagicMirror-Documentation/blob/master/modules/calendar.md): multiple calendars and source selection.
- [magicmirror-home-dashcalendar](https://github.com/unnuslatif/magicmirror-home-dashcalendar): configurable themes, slideshow and guided installer.

Adopted useful ideas: shared remote settings, calendar selection, accessible
light/dark palettes, slideshow options, module toggles, scheduled dimming,
fullscreen, cached-data indicators and preference export/import. These are
original implementations; no project source code/assets were copied.

Integration references:

- [Microsoft OAuth device flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-device-code)
- [Microsoft calendarView](https://learn.microsoft.com/en-us/graph/api/calendar-list-calendarview?view=graph-rest-1.0)
- [Google OAuth web server flow](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google events list](https://developers.google.com/workspace/calendar/api/v3/reference/events/list)
- [Apple Photos export](https://support.apple.com/en-kg/guide/photos/pht6e157c5f/mac)
- [OpenWeather One Call 4.0](https://openweathermap.org/api/one-call-4)
- [OpenWeather One Call 3.0](https://openweathermap.org/api/one-call-3)
- [OpenWeather pricing](https://openweathermap.org/price)
- [Proxmox container documentation](https://pve.proxmox.com/pve-docs/pct.1.html)

Apple folder access deliberately uses local/mounted files rather than pretending
the app has a supported Apple-account OAuth integration. Google remote redirects
require approved HTTPS domains or a host-side localhost tunnel. OpenWeather weekly
forecasts need One Call access. These requirements are surfaced in settings and
README so configuration and live verification can be completed honestly.


## October v0.3 research

- [Microsoft tenant mismatch diagnosis](https://learn.microsoft.com/en-us/troubleshoot/entra/entra-id/app-integration/error-code-aadsts50020-user-account-identity-provider-does-not-exist): account audience must match app registration, not merely the local authority.
- [Outlook view-only calendar publishing](https://support.microsoft.com/en-us/outlook/sharing/share-an-outlook-calendar-as-view-only-with-others): publishing yields an ICS subscription link; access can be revoked in Outlook.
- [Apple Shared Albums](https://support.apple.com/en-gb/108314): enable Public Website to share with people without Apple devices.
- [Shared-album protocol observations](https://github.com/simonchatts/icloud-biff/blob/main/PROTOCOL.md) and [partition routing implementation](https://github.com/llun/blog/blob/master/libs/apple/webstream.ts): public stream metadata and image URL requests; HomeBoard restricts returned hosts and proxies verified image bytes.
- [node-ical](https://github.com/jens-maus/node-ical): recurrence expansion, exclusions, overrides and timezone handling.
- [DAKboard calendar layouts](https://dakboard.freshdesk.com/support/solutions/articles/35000099436-custom-screen-calendar-layouts-and-settings) and [MagicMirror calendar](https://docs.magicmirror.builders/modules/calendar.html): compact event typography and calendar-focused display composition.

The user's supplied examples informed Tide's large dates and gradient,
Observatory's left photo/weather rail and three-week planner, and Metro's compact
information layout. Glasshouse, Folio and Portrait extend these with transparent
panels, editorial paper typography and a vertical photo-first composition.
These are original CSS layouts; no third-party screenshots or proprietary
artwork are shipped as themes. The favicon combines a home and calendar.

The exact application ID in the reported Microsoft error matches the Azure
portal case discussed by Microsoft staff in [this support record](https://learn.microsoft.com/en-us/answers/questions/1346227/the-selected-user-account-does-not-exist-in-the-mi).
Combined with the absent HomeBoard client ID, this suggests the user was blocked
at the Azure/Entra registration step. The ICS option avoids that portal; the
personal-account audience guidance applies once a HomeBoard app is registered.
