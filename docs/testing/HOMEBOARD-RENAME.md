# HomeBoard rename validation — 9 October 2026

The application, npm package, GitHub repository, local folder, installers,
Google OAuth session cookie, preference exports, default theme and Docker project
now use HomeBoard. Third-party research citations and the imported Forex protocol
retain their original attribution.

Three focused regression tests failed before implementation: dashboard/settings
titles, the Google browser-session cookie, and durable migration of a retired
theme identifier. All passed after implementation. Existing assertions remain
unchanged.

- `npm run verify`: 41 passed, 0 failed or skipped; 23 JavaScript files checked.
- Production Docker build succeeded; all 41 tests passed in the production image.
- Existing dashboard data was copied to `homeboard-data`, with file-content
  verification and ownership/permission preservation. The previous volume is
  retained for rollback. The first verification harness had a path error; the
  corrected check passed, permitting only the expected default-theme migration.
- The local folder is `/Users/simon/HomeBoard` and Git remote is
  `https://github.com/MooreSi/HomeBoard.git`.

Live Microsoft/Google account consent, subscribed OpenWeather access, physical
Apple Photos libraries, Proxmox deployment and tablet/device checks remain
unverified. Provider tests use isolated fixtures. The Codex desktop sidebar
project name/path cannot be edited through the available tools and requires a
manual update to the new folder.
