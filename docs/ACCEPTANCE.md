# Settings/dashboard acceptance

- `/settings` is a separate page; `/` has no upload picker or management dialog.
- Shared preferences survive restart, apply to every dashboard and validate timezones,
  themes, date/clock formats, slideshow intervals/transitions and module toggles.
- Microsoft 365 (work/school and personal) and Google Calendar connect with read-only
  OAuth, renew tokens, expand recurring events, page results and combine selected calendars.
  Secrets are server-side; denied/expired consent and cached failures remain visible.
- Photos upload/delete through settings only; slideshow supports sequential/shuffle,
  crossfade/fade/slide/zoom/cut, interval and transition duration. Read-only folders
  include exported Apple Photos and mounted network folders, with no source deletion.
- OpenWeather location search, units and seven daily forecasts use a server-side API key.
- RSS/Atom toggle and feed URL produce safe text headlines with links and caching.
- Date/clock uses chosen timezone including calendar boundaries and all-day dates.
- Ten original, research-inspired themes have selectable previews. No unsupported
  claim of a measurable top-ten ranking, and no copied third-party theme assets.
- Local, Docker and unprivileged Proxmox LXC installers bind to LAN interfaces,
  report actual addresses, configure scoped firewall rules where supported and
  check readiness. LXC uses a selected existing bridge with DHCP; host networking
  is never silently rewritten. Public exposure/port-forwarding is not configured.
- Useful additions: calendar selection, configurable starting view, fullscreen,
  display night dimming, stale-data indicators and settings export/import without secrets.
- Live accounts, provider billing and actual Proxmox/tablets require the user's setup;
  automated fakes verify integration contracts, never claim live consent was tested.
