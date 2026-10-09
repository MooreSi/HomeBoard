# Project instructions

Read DEVELOPMENT.md and the HomeBoard testing protocol and test-review rules in
`docs/testing/homeboard/` before behaviour changes. Apply the Node.js commands and verification checks in DEVELOPMENT.md.
Use failing regression tests before fixes, never weaken existing assertions, and
run `npm run verify` before committing. Build and smoke-test Docker after server
or packaging changes. Report unverified live integrations and device checks.
Keep `.env`, runtime data, personal photos, tokens and source archives out of Git.
