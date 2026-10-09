# HomeBoard

A self-hosted family dashboard with a separate settings page, Microsoft 365 and
Google calendars, ten themes, a photo slideshow, OpenWeather forecasts and RSS news.
Open `/` for the display and `/settings` to configure it. Settings are shared
across displays and persist on the server. The dashboard has no upload controls.

## Installation

Clone this repository and open a terminal in its folder. Node 22+ is needed for
the setup CLI; Docker Desktop/Engine is needed for the Docker option. Folder
names containing spaces are supported. No npm compilation step is needed.

### Local Node (macOS / Linux)

```bash
npm run setup -- local
# Choose another port or an Apple Photos export folder:
npm run setup -- local --port 8090 --photos "/Users/you/Pictures/HomeBoard Photos"
```

The installer runs `npm ci`, creates a private `.env`, binds to `0.0.0.0`, checks
readiness and prints host LAN URLs. Keep the terminal open. On macOS, an enabled
application firewall can require `sudo` to allow the Node executable. On Linux,
active UFW/firewalld gets a rule limited to connected local IPv4 subnets. The
installer does not disable a firewall or configure router port forwarding.

For a Linux boot service, put the checkout at a service-readable location such
as `/opt/homeboard` and run:

```bash
sudo node scripts/setup.mjs local --service
journalctl -u homeboard-dashboard
```

This creates the unprivileged `homeboard` service account and enables a systemd
service. macOS foreground mode is supported; for automatic startup use Docker's
restart policy and enable Docker Desktop at login. `--dry-run` prints a setup
plan without changing files, firewall rules or starting services.

### Docker

```bash
npm run setup -- docker
# With a host folder mounted read-only for photos:
npm run setup -- docker --photos "/Users/you/Pictures/HomeBoard Photos"
```

In photo settings choose `/apple-photos` and the Folder or combined source.
The installer sets the host port and LAN URLs, builds and starts the container,
and checks readiness. Photo uploads, credentials, caches and preferences persist
in the `dashboard-data` named volume. Folder originals are mounted read-only.
The image runs as the `node` user and includes a healthcheck.

If Node is not installed on the Docker host, Docker Compose works directly:

```bash
cp .env.example .env
mkdir -p data/apple-photos
docker compose up --build -d
docker compose ps
```

Set `DASHBOARD_PORT`, `APPLE_PHOTOS_DIR` and optional `LAN_URLS` (comma-separated
host URLs) in `.env`. Compose publishes the port on LAN interfaces. Find the
host's IP using your OS network settings; container IPs are not host LAN IPs.
`docker compose down` preserves data; **`docker compose down -v` deletes it**.
Use volume backups and reserve the host's IP on your router.

### Proxmox LXC

Run the installer **on the Proxmox host**, from a checkout of this repository.
Download a Debian or Ubuntu container template first through Proxmox. With no
arguments the script asks for a new container ID and a downloaded template.

```bash
bash scripts/install-lxc.sh
# Or specify every option:
bash scripts/install-lxc.sh \
  --id 120 \
  --template local:vztmpl/debian-13-standard_VERSION_amd64.tar.zst \
  --storage local-lvm --bridge vmbr0 --port 8080
# Inspect the plan first:
bash scripts/install-lxc.sh --id 120 \
  --template local:vztmpl/debian-13-standard_VERSION_amd64.tar.zst --dry-run
```

Replace `VERSION` with an actual downloaded template name. The script refuses
an existing container ID, validates the bridge, creates an unprivileged LXC,
attaches `eth0` to the chosen existing bridge with DHCP and creates a firewall
file for this new guest. Dashboard traffic is allowed from RFC1918 private LANs;
DHCP is enabled. It copies app source without credentials/data, installs verified
official Node binaries, creates the systemd service and prints the assigned URLs.
It does not rewrite the Proxmox host bridge or host firewall policy. It needs
working DHCP, DNS and outbound HTTPS. Custom VLANs, non-RFC1918 networks, or an
upstream firewall can need administrator-specific rules. Reserve the guest's
DHCP address on your router.

For a NAS photo folder, mount the share inside the guest and enter that guest
path in photo settings. Apple Photos needs a Mac to download/export photos first;
LXC cannot run the Mac Photos app. Log access:

```bash
pct exec 120 -- journalctl -u homeboard-dashboard
```

The LXC script's syntax and plan are tested. Creating a real guest remains to be
verified on a Proxmox host; this Mac is not a Proxmox host.

## Settings

### Microsoft 365 / Office 365

Use Microsoft Entra app registration to obtain your application client ID. Enable
public client flows and delegated `Calendars.ReadBasic` permission. Select the
supported account types for work/school and personal accounts as needed. Enter
the ID and tenant choice in settings, then **Save & connect Microsoft**. Enter
the device code on Microsoft's verification page. Organisation policy may need
admin consent or a specific tenant. The default `common` tenant supports work,
school and personal accounts. Choose which calendars to display after consent.

The server keeps access/refresh tokens, refreshes them, pages calendarView results
and expands recurring occurrences for the displayed date range. Disconnect
clears local tokens/cache; revoke consent separately in your Microsoft account.
[Microsoft device-code flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-device-code),
[calendarView API](https://learn.microsoft.com/en-us/graph/api/calendar-list-calendarview?view=graph-rest-1.0).

### Google / Gmail Calendar

Enable Google Calendar API in Google Cloud. Configure the OAuth consent screen
and create a **Web application** OAuth client. Enter its ID and secret in
settings and register the exact authorised callback URL, by default:

```text
http://localhost:8080/api/calendar/google/callback
```

Connect from a browser on the host for localhost callbacks. A tablet cannot use
that localhost callback to reach the server. Google permits HTTP loopback for
local testing; a remote callback requires an approved HTTPS domain, not a bare
LAN-IP HTTP URL. For LXC, an SSH tunnel to the host can provide localhost access:
`ssh -L 8080:CONTAINER_IP:8080 USER@PROXMOX_HOST`, then open
`http://localhost:8080/settings` on that computer. Alternatively configure your
own authenticated HTTPS reverse proxy and its exact callback domain.

The app requests `calendar.readonly`, uses browser-bound state plus PKCE, stores
tokens server-side and renews access tokens. Google testing-mode clients can
have seven-day refresh-token expiry; add test users and reconnect or publish
your consent configuration as appropriate. Select calendars after connecting.
[Google OAuth server flow](https://developers.google.com/identity/protocols/oauth2/web-server),
[Google event expansion/pagination](https://developers.google.com/workspace/calendar/api/v3/reference/events/list).

Both providers can be connected at once. Events are combined. Private titles are
masked server-side; Hide all titles masks every title. Failed sync reports the
provider and shows cached data when available. Demo appointments are displayed
only when no calendar account is connected and are labelled as demo.

### Themes

HomeBoard, Midnight, Chalkboard, Coastal, Forest, Sunset, Minimal, Lavender, Aurora,
and Gallery are original CSS themes with previews. They include light/dark,
calendar-led, photo-backdrop and gallery layouts. Google Images and DAKboard's
community gallery informed the styles; there is no publicly verifiable popularity
ranking, so these are **ten curated starting themes**, not a claimed statistical
"top ten". No third-party screen images or proprietary theme code are copied.
See [research and inspiration](docs/RESEARCH.md).

### Photos / Apple Photos

Upload photos from settings only. The browser resizes JPEG/PNG/WebP and supported
other images to at most 2560px and converts to JPEG. Uploads persist on the server.
Choose sequential/shuffle, crossfade/fade/slide/zoom/cut, interval (5–3600 seconds),
transition duration, and cover/contain framing. Reduced-motion browsers use cuts.
Folder photos are refreshed every minute; next/previous appears on hover/focus.

Apple connection is a **read-only local folder connection**, not Apple-account
OAuth or iCloud password collection. On a Mac, export an Apple Photos album as
JPEG to a folder and enter its absolute server path. A downloaded `.photoslibrary`
can supply its `originals` JPEG/PNG/WebP/GIF files, but edits, album membership,
cloud-only files and HEIC conversion need export through Photos. Folder originals
are never deleted by the app. The server skips symbolic links and scans up to
20,000 entries, 12 levels deep. macOS permissions may need to allow the hosting
process to read the folder. Docker/LXC need a mount visible inside their container.
[Apple's export instructions](https://support.apple.com/en-kg/guide/photos/pht6e157c5f/mac).

### Weather

Add your OpenWeather API key, search a city and choose a location. Enable weather
and select Celsius/m/s or Fahrenheit/mph. A seven-day forecast shows weather
symbols, highs/lows, precipitation probability, wind and a temperature trend.
One Call 4.0 is the default; 3.0 is available for existing accounts. These APIs
require the corresponding One Call subscription, **not just a basic free API key**.
Check your billing limits in OpenWeather. Keys are never returned to the browser.
Forecasts are cached for ten minutes and stale results are labelled.
[One Call 4.0](https://openweathermap.org/api/one-call-4),
[One Call 3.0](https://openweathermap.org/api/one-call-3),
[pricing](https://openweathermap.org/price).

### Date/time, news and display

Select an IANA timezone, long/DMY/MDY/ISO date, digital/analog/both clock and 12/24
hour time. Calendar day boundaries use that timezone, including DST; all-day
appointments retain their calendar dates.

Toggle RSS/Atom headlines, enter a public feed URL and choose a headline count.
Feeds are fetched on the server, cached, and rendered as safe text with HTTP(S)
links. Local/private-network destinations, unsafe redirects, XML entity/DOCTYPE
payloads and oversized feeds are rejected.

Extra features inspired by other dashboards: selected-calendar filtering,
starting view, fullscreen button, scheduled night dimming, stale-data indicators,
and display-preference import/export. Exports exclude credentials, tokens,
server paths and calendar connection details.

## Network and data

This app is for a trusted private home network. Anyone who can reach it can view
the calendar/photos and change settings; there is no per-user dashboard login.
Do not expose its port directly to the internet. HTTP LAN traffic is unencrypted;
use an authenticated HTTPS proxy for broader access. Secrets/tokens are stored
as restricted-permission plaintext files in the data directory, not an encrypted
vault. Protect and back up that directory or Docker volume. Browser privacy
masking is not an access-control mechanism.

The installer can configure the application's listener and supported host/guest
firewalls. It cannot resolve Wi-Fi guest isolation, VLAN routing or router policy
without details about that network. Settings lists available addresses. Test from
a second device and reserve addresses in DHCP to keep display URLs stable.
Environment values in `.env` take precedence on restart; when managing credentials
in settings, leave the corresponding environment variables empty. `npm start`
does not load `.env`; use the installer or `node --env-file=.env server.mjs`.

## Development and validation

```bash
npm ci
npm run verify
npm run build
```

Tests use temporary data and isolated ports, with fakes only at external provider
boundaries. The original ZIP regression assertions remain intact. The imported
Forex test protocol/review/verification documents are preserved unchanged under
[docs/testing/forex-gold](docs/testing/forex-gold/README.md).
[DEVELOPMENT.md](DEVELOPMENT.md) maps those rules to Node.
[Validation record](docs/testing/VALIDATION-v0.2.md) records actual checks and limits.
GitHub Actions installs dependencies, checks syntax, runs the entire suite,
checks installer shell syntax, builds Docker and repeats tests in the image.

Live provider consent, actual Apple library permissions, physical Safari/iPad or
Chrome/Android, and a real Proxmox installation need verification with the relevant
accounts/devices/host. Automated provider fixtures establish request/response
wiring and failure behaviour; they do not establish successful live authentication.
