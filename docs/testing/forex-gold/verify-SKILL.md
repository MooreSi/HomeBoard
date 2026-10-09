---
name: verify
description: Run every check before committing — full test suite, all four structural gates, the coverage ratchet and the boot smoke test. Use before any commit, and whenever asked "is this ready", "is it green", "can I commit", or "run the checks".
---

# Verify

One command:

```bash
python -m tools.checks all
```

Takes about five minutes; most of that is the test suite. Faster variants:

```bash
python -m tools.checks gates      # structural gates only, ~10 seconds
python -m tools.checks suite      # just the tests
python -m tools.checks coverage   # just the coverage ratchet
```

## What must be true before you commit

- test suite: **0 failed**
- structure gates: OK
- import contracts: OK
- runtime facade: OK
- orphan detector: no orphans
- coverage ratchet: no regressions
- boot smoke: imports cleanly
- doc links: all resolve (`tools/check_doc_links.py`, part of `checks all`)

And two things no tool checks — answer them yourself before committing:

- **Did this change teach something non-obvious?** Then the relevant
  `docs/system/domains/<domain>/` file gets that fact in the same commit.
- **Did this change invalidate a number or claim a skill quotes?** Then that
  skill file gets corrected in the same commit.

## When something fails

**Do not** work around it. Specifically, never:

- delete, skip or `xfail` a failing test
- loosen an assertion so it passes
- lower a ratchet baseline to get green

Each of those converts a signal into silence, which is how this codebase
previously ended up with a guardrail that scanned a deleted directory and
reported success for months.

### A gate failed

Read what it says — each gate explains the rule it enforces. If a baseline
genuinely had to move (you legitimately added a file, or a tab needs four more
lines), say so **in the commit message**, then:

```bash
python -m tools.refactor_audit.structure_gates --update-baseline
```

If you cannot explain in one sentence why the number had to rise, it did not
have to rise.

### A test failed

Either the change is wrong, or the test encodes a rule you did not know
about. Read the test and its docstring — they usually name the incident that
caused them to exist.

The **only** legitimate edit to a characterization test is a mock-target
relocation: the function moved, so the patch target moves with it. Same
function, same signature, new home. Say so in the commit.

### Coverage regressed

Add the test. The floor is the record of what was once covered; lowering it
erases that.

## Reporting

State the real numbers:

```
Verified: suite 1989 passed, 6 skipped, 0 failed - structure gates OK -
import contracts OK - facade OK - orphans clean - coverage no regressions -
boot smoke OK.
```

If you skipped a check, say which and why. A verification summary that
overstates what ran is worse than no summary.
