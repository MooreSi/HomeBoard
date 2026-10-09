# HomeBoard v0.3 validation — 9 October 2026

## Behaviour and red/green evidence

- Outlook ICS feed settings, iCloud album settings/local photo routes, favicon,
  additional theme choices and rolling three-week range failed before implementation.
- Microsoft registration mismatch test failed with a generic denial message,
  then passed with personal-account/public-client setup guidance.
- The RSS transport regression failed in Node 24 with the incompatible bundled
  fetch handler. Fetch and dispatcher now come from the same installed package.
  The initial mock harness recursed; that fixture was corrected before using
  the Node 24 handler-contract failure as regression evidence.
- A deliberate incorrect rolling-view endpoint assertion failed (16 November
  versus 17 November); the real exact expectation remains 16 November.
- The theme count assertion changed from exactly ten to exactly sixteen for the
  requested catalog expansion, with all ten original IDs additionally asserted.
  No original theme is removed; no assertions were weakened into permissive bounds.

## Checks

- Local Node: `npm run verify`, 29 JavaScript files checked, 55 passed, zero
  failed/skipped. No simultaneous full suites.
- Docker Node 24: production build and all 55 tests passed.
- Installer shell syntax and testing-rule documentation links passed.
- Live BBC feed: five fresh BBC News headlines received on the host and through
  the deployed server, including its LAN address. The settings-page Save & test
  feed button reported “5 headlines from BBC News”.
- Production health, dashboard, settings, favicon, styles, script and version
  0.3.0 verified at localhost and 192.168.0.53.
- Browser: 16 selectable themes; selecting Observatory saved via the UI and
  retained its three-week view. Tide rendered three rows over the gradient.
  Portrait at 768 × 1024 had document width equal to viewport width (768), with
  42 month cells. Preview data was isolated; user display preferences retained.
- Docker replacement and a subsequent restart preserved all public display
  preferences and the configured BBC feed. GitHub CI passed the full checks.

## Testing rules

Rules now live in `docs/testing/homeboard/`. Protocol, review and verification
requirements have been adapted to this repository's actual Node.js services,
fixtures, commands and device/account limits. Unrelated source-repository names,
commands and comments were removed from the active documentation. No other
repository was modified.

## Live limits

Microsoft direct sign-in remains disconnected. The exact reported application
ID matches Microsoft's Azure portal support case, suggesting portal access
blocked the registration setup step. A HomeBoard registration must support
personal Microsoft accounts and public client flows; alternatively a published
Outlook ICS link avoids Azure setup. No Microsoft client ID is currently saved. Automated
fixtures verify authenticated flows and ICS recurrence/exclusions/privacy;
no claim of live Microsoft account connection is made.

Apple public album requests, image proxying, read-only deletion rejection and
removal are tested with protocol-shaped fixtures. A user's live album URL has
not been supplied/tested. Apple does not document this protocol as a stable API;
server errors are surfaced with folder/upload alternatives available.

Real Proxmox deployment and physical iPad/Android checks remain unverified.
