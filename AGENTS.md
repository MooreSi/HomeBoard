# Project instructions

Read DEVELOPMENT.md and the imported testing protocol and test-review rules in
`docs/testing/forex-gold/` before behaviour changes. Apply the Node-specific
mapping in DEVELOPMENT.md; upstream Python/trading commands apply to Forex only.
Use failing regression tests before fixes, never weaken existing assertions, and
run `npm run verify` before committing. Build and smoke-test Docker after server
or packaging changes. Report unverified live integrations and device checks.
Keep `.env`, runtime data, personal photos, tokens and source archives out of Git.
