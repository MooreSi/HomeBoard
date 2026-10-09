# News, Calendar Link and weather validation — 9 October 2026

- `npm run verify`: 45 JavaScript files checked; 87 tests passed, zero failures,
  skips or cancellations. Existing assertions were preserved.
- New tests ran red for the missing news preset endpoint/dropdown, sign-in-free
  Calendar Link controls, autocomplete surface, five-day subscription fallback,
  postcode endpoint, cancellation titles/recurring overrides, METHOD:CANCEL and
  webcal normalisation. Focused tests subsequently passed.
- Negative control: temporarily restored the old provider cancellation filter
  and final event emission; the Microsoft cancellation regression failed (two
  events rather than one). Production code was restored and the regression passed.
  The sign-in-control detector also contains a positive seeded-control assertion.
- The existing Calendar connections heading remains unchanged to preserve its
  surface contract; the requested change renames its Calendar Link subsection.
- The Microsoft provider fixture now models isCancelled and preserves the
  requested projection/path in pagination links. A strict request check caught
  the previous incomplete pagination fixture. No assertion was weakened.
- Browser on isolated data: typing Lond produced selectable suggestions without
  pressing the search button; selecting London, GB saved the location and
  returned five forecast days through an external subscription-denial fixture.
  Choosing CNBC and Save changes persisted the exact preset URL. Settings saved
  successfully with the Microsoft/Google controls removed.
- Production Docker build succeeded; all 87 tests and 45 JavaScript syntax checks
  passed inside the image. Installer shell syntax and diff whitespace checks passed.

## Separate authorised live investigation

The saved weather key authenticated successfully for location search. One Call
4.0 returned HTTP 401 with a subscription-required response; the standard
forecast returned HTTP 200 and 40 three-hour intervals. The updated Weather
implementation then returned five aggregated days in Automatic mode using that
key in a private disposable diagnostic directory. The user's configured location
and other preferences were not changed by the diagnostic. A location must be
selected through the new suggestions to display their local forecast.

The existing calendar source contained a whole-word cancelled title marker with
STATUS:CONFIRMED. Only aggregate flags/counts were inspected; no personal calendar
records, photos, subscription URLs or keys were placed in tests, docs or Git.
Cancellation filtering now occurs before title masking and recurrence emission,
and cache keys invalidate pre-fix records.

All nine news presets returned current feed items using HomeBoard's real public
HTTP transport and RSS parser. CNN's legacy HTTPS feeds reset connections; its
HTTP latest feed was stale (August 2024). The CNN preset therefore explicitly
uses recent CNN stories through Google News. See docs/NEWS-SOURCES.md.

Deployment, restarted data retention and GitHub CI are checked when delivering
this change. Physical tablet browsers, a new Proxmox guest and live OAuth consent
remain unverified. Legacy authenticated APIs/tests are retained for existing
installations; the settings page now uses Calendar Link only. No coverage ratchet
is configured or claimed.
