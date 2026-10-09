# HomeBoard test authoring and review

Read the [protocol](40-testing.md) first. Expected behaviour comes from product
requirements, not a transcription of the implementation. No production behaviour
change without a regression that has failed for the expected reason.

## Authoring rules

1. Every test must be capable of failing. Invert an assertion or introduce a
   deliberate violation for at least one test in a batch, observe red and restore.
2. Every empty-result detector needs a positive detection control.
3. Use arrange → act → assert and one behaviour per test. Lifecycle tests may
   restart the application to prove a single persistence contract.
4. Call real production code and assert its output, not a mock's canned answer.
5. Name the subject, scenario and expected result. The assertions must match it.
6. Cover success, rejection and boundaries. Calendar/timezone errors, expired
   credentials, provider outages, malformed feeds and source removal matter.
7. Assert durable filesystem state after mutations and removals. For emitted
   HTTP/OS requests, assert the meaningful payload and call the path that emits it.
8. Use specific equality, deep equality, exact error codes and explicit rejection
   assertions. Truthiness is not a substitute for a known expected value.
9. Avoid conditional assertions, caught-and-ignored errors and branching test
   bodies. Separate success and failure scenarios so every assertion runs.
10. Assert errors with `assert.throws` or `await assert.rejects`; API failures need
    both status and error meaning. Never swallow an exception.
11. Use shared fixtures and fresh temporary data. No shared mutable state or
    local copies of the canonical application fixture.
12. Control clocks, timezones, randomness and cache age. No import-time “now”,
    sleep-based synchronization or assumptions about execution speed.
13. Await async collaborators and teardown. Verify all call sites after converting
    sync code to async; no abandoned Promises.
14. Patch at the actual dependency boundary. Fakes must enforce signatures and
    record arguments so renamed/missing fields fail. Restore every patch.
15. Understand a collaborator's real side effects before mocking it. Mock only
    external services, DNS and OS operations, not the parser, filesystem or service
    under test. A real temporary filesystem is more faithful than a mock.
16. Build complete initialized fixtures. If a newly used field is legitimate,
    update the fake to match reality and explain that change without weakening assertions.
17. Use realistic provider envelopes, pagination, expired tokens, recurrence,
    timezone/DST dates, image bytes, RSS/Atom/ICS and Apple shared-album responses.
18. Do not add production APIs, flags or methods solely for tests. Control tests
    through fixtures and public behaviour. Keep personal accounts and device state
    out of unattended runs.

## Anti-patterns

Reject tautological tests, assertions about fixture setup alone, mocking the
subject, missing assertions, pasted success assertions in failure cases,
return-only mutation checks, blind zero-offender detectors, excessive mocking,
order-dependent results, import-time timestamps, duplicate fixtures, incomplete
fakes, backfilled tests that merely mirror code, and any path to personal data or
unapproved account/OS changes.

Do not delete, skip, loosen, comment out or widen assertions to obtain green.
Do not lower a coverage/gate baseline. Keep characterization contracts and
mock-target relocations under the protocol's explicit rules.

## Review checklist

| Check | Reject when |
|---|---|
| Calls production code | Only mocks or fixtures are exercised |
| Tests production output | Only canned returns are asserted |
| Specific assertions | Known values use truthiness or permissive bounds |
| Detects a bug | An inverted result would still pass |
| Negative control | A zero-offender assertion stands alone |
| Unconditional assertions | Branches or catch blocks suppress verification |
| Controlled determinism | Depends on wall clock, randomness or timing |
| Explicit errors | Exceptions are swallowed |
| Durable state | Mutation checks stop at the return value |
| Emission payload | HTTP/OS requests are not verified |
| Accurate name | Name and assertions describe different contracts |
| Focused scope | Unrelated behaviours share a test |
| Shared isolation | Fixture duplication or shared mutable data |
| Safe boundaries | Personal accounts/data or real installation commands are reachable |
| Discoverable layout | Tests are outside the configured Node test paths |

## Mandatory workflow

State the requirement; write a focused test; run it red for the right reason;
implement; run it green; repeat for rejection and edge cases; verify a negative
control; run touched tests then the full suite; review names and assertions;
run the [verification checks](verify-rules.md) before committing.
