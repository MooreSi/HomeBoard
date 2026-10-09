# Family organiser, screens and reliability

Open `/family` on the display or a phone on your home network. Use Settings → Family & screens for saved screen schedules, playlists and pinned links. Existing connections, uploaded photos and v0.21 themes remain supported.

## Calendars and people

Add additional Calendar Links in Settings → Calendars. Each is an HTTPS ICS subscription, fetched read-only; no Microsoft/Google account login is needed. Names, colour and family assignment appear on the dashboard. Assigning a person adopts their profile colour, which you can override. URLs stay in the private secrets file and are never returned to the browser. An empty replacement field keeps a saved URL. Removing a source requires Save additional calendars.

The original Calendar Link remains separate for compatibility. To move it to a named source, add it there and remove the original to avoid duplicates. Calendar and person filters apply to all loaded date pages. Cancellation filtering, privacy masking and recurring/all-day handling apply to each feed. For council-provided bin calendars, add the council ICS link as another calendar.

## Local household tools

- Profiles have names, colours and completion-point totals.
- Shared lists support add/edit/remove items and check-off; the noticeboard has optional expiry dates.
- Chores and routines repeat daily, on selected weekdays or once. Assign anyone or a person, set a first/due date and optional completion points. Routine steps have separate daily checks. Complete the whole task to award points; unchecking removes that completion's points. New dates begin unchecked. Editing routine steps resets their old step checks; completed-task point history remains.
- Meal planning has week navigation, breakfast/lunch/dinner/snack entries, recipe links and ingredients. Add ingredients to Shopping without duplicating unfinished items. This is a native planner; automatic recipe extraction and Mealie connectivity are future options.
- Bin schedules use a first date and repeat interval in days. Holiday exceptions replace an occurrence or skip it. Reminders appear from the chosen number of days beforehand. Automatic council-specific scraping is not included.
- Countdown cards show whole calendar days; annual birthdays/anniversaries advance to their next occurrence. February 29 anniversaries use March 1 in non-leap years.

Built-in dashboards show populated family widgets below the main display. Custom Design lets you place them on the screen or hide them. Dashboard cards link to the organiser for editing. All family writes are validated and use a revision check to prevent one phone overwriting another's changes. A conflict asks you to reload/retry. Screens poll for changes every 10 seconds; the organiser refreshes every 15 seconds while you are not editing.

## Protected editing and phones

Visit `/login` and choose an admin password of at least ten characters. There is no default password. Before setup, editing remains open for compatibility; the organiser shows a setup prompt. After setup, all write APIs and private management reads require a signed-in browser. Viewing the display and household content remains available on the LAN.

Passwords are salted and hashed with scrypt. Sessions use random HttpOnly SameSite=Strict cookies, expire after eight hours and end at server restart. Five failed login attempts block that client address for 15 minutes. Lock ends the browser session. An HTTPS reverse proxy should replace the X-Forwarded-Proto header appropriately. For away-from-home use, access through a VPN or an authenticated HTTPS deployment; do not expose the unprotected display directly to the internet.

If the password is lost, stop HomeBoard, privately preserve `data/admin.json`, remove that file on the host and restart to set a new password. Store that preserved file securely. Restoring a household backup deliberately retains the current admin password.

On supporting browsers, add HomeBoard to the home screen through the browser's install/share menu. The manifest opens the phone-friendly organiser. HTTPS or localhost is required for service workers/offline installation; plain HTTP LAN addresses still work online. Physical iOS/Android installation support should be checked on the target device.

## Saved screens

Save the current draft design as a named screen. New schedules start disabled. Choose active weekdays and start/end times; equal times mean all day, and an overnight schedule belongs to its starting weekday. Schedules use the configured timezone. Enable screens and select them in a playlist; up/down arrows control rotation order. The interval is 15–3600 seconds. When no schedule matches, the normal selected design/theme returns.

A pinned `/?screen=<id>` link displays that screen independently of schedules. Screen assignments do not introduce per-device accounts; each browser can open its chosen pinned link. Replacing a saved screen's design updates its viewers automatically. Phone portrait placement is edited separately from landscape.

## Backups and connection checks

Settings → Reliability runs real calendar/weather/news checks and reports source errors, disabled features, available photo count and saved rollback-copy count. A demo calendar is explicitly identified as unconnected.

Download encrypted backup captures settings, connection secrets, provider tokens, family records and uploaded JPEG photos. AES-256-GCM encrypts a compressed snapshot using a scrypt-derived key and a fresh salt/IV. The passphrase needs at least ten characters and is not saved. Keep it separately; lost passphrases cannot be recovered. Downloadable backups are limited to 100 MB of expanded JSON and approximately 70 MB of uploaded photos. Use host-volume backups for larger libraries.

Restore validates/decrypts before replacing data and keeps a private pre-restore rollback copy under `data/backups/`. It replaces uploaded photos and settings; it retains the current admin password and server environment overrides. External folder/iCloud originals, `.env`, server configuration and update checkouts are not included. Back up external photo libraries and deployment configuration separately. Rollback copies contain credentials, have private permissions, and can be recovered by the host administrator; they are not downloadable theme files.

## Offline display

Once installed on HTTPS/localhost, the service worker caches the display shell, last successful display API responses and up to 80 dynamic responses/photos. Cached data stays on that browser. A server/network outage keeps previously loaded dates/content visible with an offline label; it cannot fetch unseen calendar periods or new photos. Settings, credentials, backups, login responses and write requests are never cached. The organiser becomes read-only when it cannot check login state.

Clear this device's cached display in Reliability to remove this browser's saved content. Revisit the dashboard online to refill it. Keep host/container backups too: browser caching is not a backup of the server.
