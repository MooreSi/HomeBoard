# Dakboard clone — first revision

A locally hosted family calendar dashboard for iPad and Android browsers, inspired by the approved warm ivory/sage mock-up. No external JavaScript, fonts or photo services are loaded.

## Run on your Mac mini

1. Clone `https://github.com/MooreSi/Dakboard-Clone.git`, or use this already extracted workspace. Folder names containing spaces are supported.
2. Open Terminal in that folder. Install/start Docker Desktop if needed.
3. Copy `.env.example` to `.env`.
4. Run `docker compose up --build -d`.
5. Open `http://localhost:8080` on the Mac, or `http://YOUR_MAC_LOCAL_IP:8080` on the tablet on the same home network. Keep the Mac awake and permit the port through its firewall.

Without Microsoft configuration, the app shows **clearly labelled illustrative appointments**. These are not your actual calendar. Photos are initially empty; upload your own. The tablet displays the app; the Mac hosts it. Docker build/start has been verified on this Mac. Microsoft sign-in still requires your app registration.

## Connect personal Outlook

Register your own Microsoft application in Microsoft Entra App registrations (https://entra.microsoft.com). Choose an account type supporting personal Microsoft accounts, and enable **Allow public client flows** in Authentication. Add delegated Microsoft Graph **Calendars.ReadBasic** permission. Copy the application/client ID into `MICROSOFT_CLIENT_ID` in `.env`, then run `docker compose up -d --force-recreate`. No client secret is needed.

In dashboard settings choose Connect Outlook. Open the Microsoft verification page, enter the shown device code, sign in to your personal account and consent. The server polls for completion and stores tokens in the persistent Docker volume; tokens are never returned to the browser. Disconnect clears local tokens and cached calendar events, but does not revoke Microsoft's consent grant (manage that in your Microsoft account).

This revision reads the default personal Outlook calendar, including expanded recurring occurrences, in day/week/month ranges. Refreshes every five minutes and when navigating. Times use the tablet browser's timezone; set the tablet to Europe/London. Cached previously visited ranges remain available if Outlook fails while the local server remains reachable. It is not an offline tablet application.

Microsoft references:
- https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-device-code
- https://learn.microsoft.com/en-us/graph/api/user-list-calendarview?view=graph-rest-1.0

## Included

- Responsive portrait/landscape layouts, day agenda, week columns and six-row month grid.
- Scrollable calendar with sticky week headings and horizontal scrolling when columns exceed the screen. Month date buttons open the day's agenda.
- Today and previous/next navigation; privacy toggle; custom display name.
- Manual photo uploads from the native tablet picker, JPEG conversion/resizing in the browser, server-side storage, slideshow and deletion.
- Upload picker can select iCloud-backed photos on an Apple device when the OS makes them available; there is no automatic iCloud connection. Unsupported HEIC needs JPEG export.
- Clear demo/connected/stale/unavailable states.

## Security and deployment scope

This first revision is for a trusted private home network. **There is no dashboard login:** anyone with network access to the server can see events, upload/delete photos, or connect/disconnect the account. Do not expose port 8080 to the internet or use on shared/untrusted Wi-Fi. HTTP does not encrypt local traffic; add an authenticated HTTPS reverse proxy before broader use. Refresh/access tokens are stored as restricted-permission plaintext files in the Docker volume, not encrypted at rest. Back up and protect that volume. "Hide event titles" changes display only, not access to calendar data. Private events are masked in the UI.

Photos persist in the Docker named volume across restarts/rebuilds. `docker compose down -v` deletes photos and credentials. Keep regular volume backups. Browser-specific preferences live on each tablet.

## Development and validation

Node 22+; no npm packages required. `npm start` runs the server; `npm test` runs isolated API tests using a temporary directory and port. `npm run verify` checks JavaScript syntax and runs all automated tests. See [the validation record](docs/testing/VALIDATION.md) for results and limits.

### Imported Forex test rules

The authoritative testing protocol, test-review skill and verification skill
are preserved unchanged with their source commit and checksums in
[docs/testing/forex-gold](docs/testing/forex-gold/README.md).
[DEVELOPMENT.md](DEVELOPMENT.md) maps the rules to Node and Docker, and
[AGENTS.md](AGENTS.md) makes them project instructions for coding agents.
Run `npm run verify` for syntax checks and the full regression suite;
`npm run build` builds the production Docker image. GitHub Actions repeats these
checks and runs the API regressions against the production image.

### Known first-revision limits

Live Microsoft authentication and Graph synchronization need verification with your registered app. Docker build/start and API regressions have been verified on this Mac; physical iPad/Android visual/touch checks remain unverified. No multi-calendar selection, automatic iCloud sync, per-user dashboard access, encrypted token vault, fullscreen kiosk management or true disconnected tablet mode yet. Week events are time-labelled stacked cards, not a precise hourly positioning/overlap scheduler. Upload endpoint checks JPEG signature; browser performs conversion, but server-side full image decoding is not yet included.
