---
name: test
description: Write and review test cases. Use when creating new tests, reviewing existing tests for correctness, or improving coverage. Enforces rules that stop AI-generated tests from being written to pass rather than to verify. Read alongside docs/system/rules/40-testing.md.
---

# /test — Write & Review Test Cases

Use: `/test <target>` — a service module, file path, or description of the behaviour to cover.

**The #1 danger of AI-written tests:** when an AI reads implementation code and
generates tests, it mirrors the code's current behaviour back as assertions —
including the bugs. That is **transcription, not validation.** The test confirms
what the code *does*, not what it *should do*. Every rule below exists to stop
that.

This repo has already shipped a guardrail that scanned a deleted directory and
printed "all good" for months. Green output is not evidence.

---

## Before anything else

**No test may place, close or modify a real or demo MT5 order.** Not to check a
fix, not "just once". Bridges are fakes. Order-path collaborators are sentinels
that record calls. If a file could reach a real broker call, it says so in the
module docstring and *proves* it cannot:

```python
def test_no_test_in_this_file_can_spawn_a_process():
    """Guard rail, asserted rather than assumed."""
    import subprocess
    assert bp.subprocess.Popen is subprocess.Popen
```

If you cannot verify a behaviour without a broker connection, stop and say so.
Do not approximate it.

---

## TDD stance

Default to test-driven development for feature work, bug fixes, behaviour
changes and risky refactors.

```text
No production behaviour change without a failing test first.
```

Read the implementation to understand dependencies and blast radius. Do **not**
use it as the oracle for expected behaviour. Expected behaviour comes from
product rules, `docs/`, the bug report, or an explicit characterization of
legacy behaviour.

### Red → green → refactor

1. **Red:** write the smallest test that states the desired behaviour.
2. **Verify red:** run it. Confirm it fails *for the reason you expect* — not an
   import error, not a typo, not a fixture that never built.
3. **Green:** smallest production change that passes.
4. **Verify green:** run it again, clean output.
5. **Refactor** only while green.

If the test passes immediately it proved nothing. Tighten the assertion or pick
a behaviour that is genuinely missing.

If it fails on a typo, fixture error or import error, fix the test and rerun
until it fails because *the behaviour is missing*.

### Existing code and bug fixes

- Write expected-behaviour bullets before code.
- If current behaviour is unclear, add a **characterization** test first to pin
  the existing contract.
- Then add a failing test for the intended change.
- Never patch production code first and backfill tests from what the patch
  happens to do.

---

## Where tests live

The tree mirrors `backend/src/`. A test's directory is decided by the directory
of the module it covers — not by what kind of test it is.

```
tests/
├── conftest.py                 # fresh_db, make_engine, risk-cache isolation
├── services/
│   ├── ai/            analytics/     backtest/     breakout_signal/
│   ├── broker/        channels/      cluster/      dpm/
│   ├── health/        notifications/ positions/    reversal_engine/
│   ├── risk/          signals/       telegram/     test_signal/
│   └── trading/
├── controllers/                # one file per <name>_controller.py
├── db/                         # database, connection, adapter, retention
├── utils/                      # models, regime, news_calendar, os_utils
├── config/                     # paths, secrets, licence
├── runtime/                    # runtime.py + app.py lifecycle and shape
├── frontend/                   # pages import, app boots and serves
└── refactor/                   # structural gates — pins what may not grow back
```

Rules:

- **One test file per source module**, named `test_<module>.py`. A test for
  `backend/src/services/trading/close_trade.py` is
  `tests/services/trading/test_close_trade.py`.
- **Every directory needs `__init__.py`.** Basenames repeat across service dirs
  (`test_repo_transactions.py` exists three times); without `__init__.py`
  pytest imports them as the same top-level module and one silently wins.
- **`tests/core/` is legacy and closed.** `backend/src/core/` no longer exists —
  it was dissolved into `services/` during the 2026 refactor and the tests did
  not follow. Never add a file there. When you touch a file in `tests/core/`,
  move it to the directory that mirrors its subject as part of that change.
- `frontend/tests/` (inside the frontend package) is an empty placeholder in
  `testpaths`. Frontend tests go in `tests/frontend/`.

### Naming the test type

The refactor-era suffixes stay on existing files and carry meaning:

| Suffix | Purpose |
|---|---|
| `_characterization` | Pins behaviour *before* it moves. Written against unmodified code. |
| `_surface` | Tests the extracted function directly in its new home. |
| `_relocation` | Proves the caller reaches the right thing with the right bindings. |

New tests are plain `test_<module>.py` unless you are mid-migration and one of
the three applies. Delete a characterization test **only** when an
identically-named surface twin exists and you have run it green first — and say
so in the commit.

---

## The rules

### 1. Every test must be capable of failing

Before finishing, invert the logic mentally. If the code returned the wrong
value, would this test catch it? For at least one test per batch, actually break
the assertion and watch it go red.

### 2. Every green assertion needs a negative control

If you assert a set is empty, also assert your detector can find a member.

```python
def test_no_production_code_reaches_into_a_runtime_private():
    assert _find_private_reaches() == []

def test_the_leak_scan_can_actually_see_a_leak():
    """Negative control: a zero-offender assertion is worthless if the
    scanner is blind."""
    assert pattern.search("await engine._some_private(a, b)")
    assert not pattern.search("await self._bridge._get_positions()")
```

Both, always. The first is the rule; the second is what makes the first mean
something.

### 3. Arrange → Act → Assert, one Act per test

```python
def test_deducts_balance_when_a_trade_opens(fresh_db):
    # Arrange
    bridge = _FakeBridge(order_result={"ticket": 8001, "fill_price": 2400.7})
    engine = make_engine(_bridge=bridge)
    # Act
    asyncio.run(ot.open_trade(engine, "XAUUSD", "buy", lots=0.05))
    # Assert
    assert bridge.place_order_calls == [
        {"direction": "buy", "lots": 0.05, "sl": 2390.0, "tp": 2415.0, "comment": ""}
    ]
```

If you need two Act sections, write two tests.

### 4. Test behaviour, not implementation

Ask "what should happen?", not "does line 47 run?". Test through the public
service function. If you refactor and the test breaks while behaviour is
unchanged, the test was coupled to implementation.

### 5. Test names describe subject / scenario / expected

```python
# DON'T
def test_open_trade(): ...
def test_it_works(): ...

# DO
def test_rejects_entry_when_daily_loss_limit_is_already_hit(): ...
def test_places_no_order_when_the_ea_bridge_is_unhealthy(): ...
def test_scales_lots_to_the_broker_minimum_when_risk_rounds_below_it(): ...
```

The docstring names what the test **protects**, not what it calls.

### 6. Cover happy path, error path and edges

Minimum per behaviour:

- **Happy:** normal operation succeeds
- **Error:** invalid input, missing prereq, unhealthy bridge, refused fill
- **Edge:** zero lots, exact boundary of a threshold, empty position list,
  weekend/closed session, the tick that is one pip either side of the trigger

In money-critical areas (`trading`, `risk`, `positions`, `signals`, `broker`,
`db`) the error paths are the point. They are what fails at 3am.

### 7. Assert on persisted state, not just return values

For anything that mutates, verify the row actually changed:

```python
# DON'T — only the response
result = asyncio.run(ot.open_trade(engine, "XAUUSD", "buy", lots=0.05))
assert result["ticket"]

# DO — also the side effect
row = fresh_db.get_trade(result["ticket"])
assert row["lot_size"] == 0.05
assert row["status"] == "open"
```

**Emissions need a payload assertion, not just a return check.** Telegram
alerts, notification emails, DPM bookkeeping rows, cluster sync ledger entries —
if an emitter silently stops firing, or fires with the wrong arguments, the host
function's return value is unchanged and a return-only test stays green. That is
the silent-data-loss class. Assert the payload:

```python
assert alerts.send_calls == [{"kind": "trade_opened", "ticket": 8001, "lots": 0.05}]
```

Watch the **seam**: the emitter often fires from a different entry point than
the one you are testing. Call the path that actually emits.

### 8. Use the most specific assertion available

```python
# DON'T
assert result
assert result is not None
assert len(positions) > 0

# DO
assert result["fill_price"] == 2400.7
assert len(positions) == 3
assert governor.blocked_reason == "daily_loss_limit"
```

Reserve truthiness checks for when that is genuinely all that matters.

### 9. No branching logic in a test body

`if`, `try/except`, ternaries and loops-with-assertions mean some assertions may
never run.

```python
# DON'T
def test_handles_response():
    result = process(signal)
    if result["ok"]:
        assert result["ticket"]
    else:
        assert result["error"]

# DO — one test per branch
def test_returns_a_ticket_when_the_fill_succeeds(): ...
def test_returns_an_error_when_the_broker_refuses_the_fill(): ...
```

### 10. Expect errors explicitly — never swallow them

```python
# DON'T — passes whether it raises or not
try:
    close_trade(engine, ticket)
except Exception:
    pass

# DO
with pytest.raises(ValueError, match="unknown ticket"):
    close_trade(engine, 999999)

# DO — for functions returning an error value
err = governor.check(engine, lots=5.0)
assert err is not None
assert err.reason == "exceeds_max_lot"
```

### 11. Fresh data per test — no shared mutable state

Take `fresh_db` and `make_engine` from `tests/conftest.py`. **Define neither
locally.**

```python
def test_x(fresh_db, make_engine):
    engine = make_engine(_bridge=_FakeBridge(), _tp_cache={})
```

`fresh_db` is currently redefined 119 times across the suite in 17 variants,
each reaching into `db._thread_local`, `db._db_executor` and `db._rs_cache` —
private state that moves when the DB layer moves. When you touch a file that has
its own copy, diff it against the conftest version; if it matches, delete the
local copy and its helpers, and say so in the commit.

### 12. Control all non-determinism

- The **market clock is pinned** by `tools/testing/fixed_clock.py`, loaded via
  `addopts` in `pyproject.toml`. Session gates and weekend checks are stable —
  do not work around it.
- **Never build a "now" timestamp at module import.** By the time a five-minute
  suite reaches your test it is stale. Compute it inside the test.
- Patch `random`, `time.time` and `uuid` where the code *uses* them.
- Never depend on wall clock, sleep durations or execution speed.

### 13. Async: call it explicitly

`pytest-asyncio` is installed but **not configured**, and the house style is
explicit — 87 files already do this:

```python
result = asyncio.run(ot.open_trade(engine, "XAUUSD", "buy", lots=0.05))
```

Use `unittest.mock.AsyncMock` for awaitable collaborators. Do not add
`asyncio_mode` or `@pytest.mark.asyncio` to a file without changing the config
for the whole suite deliberately.

### 14. Patch precisely, and with `autospec=True`

Patch the name **where it is used**, not where it is defined, and let mock
enforce the signature:

```python
# DON'T — signature drift goes unnoticed; a renamed arg still "passes"
with patch("backend.src.services.telegram.alerts.send_alert"):
    ...

# DO
with patch.object(alerts, "send_alert", autospec=True) as send:
    ...
    assert send.call_args.kwargs["ticket"] == 8001
```

Prefer a **hand-written fake that records calls** (`_FakeBridge`, `_FakeEA` — the
established pattern in this suite) over a mock, for anything on the order path.
A fake gives you a real call log to assert against and cannot silently accept a
call that production would reject.

### 15. Mock only after understanding the dependency

Before patching, ask: what side effects does the real thing have? Does this test
depend on any of them? Can the slow or external boundary be faked lower down?

Do not mock "to be safe". Over-mocking removes the behaviour the test exists to
verify. Mock these boundaries and no more:

| Boundary | Where |
|---|---|
| MT5 native | `services/broker/mt5_native.py` |
| MT5 bridge process | `services/broker/{mt5_client,bridge_process,watchdog}.py` |
| EA bridge | `services/broker/ea_bridge.py` |
| Anthropic | `services/ai/provider.py`, `*/claude_reviewer.py` |
| Telegram | `services/telegram/reader*.py`, `alerts.py`, `bot_loop.py` |
| Cluster sockets | `services/cluster/{remote,sync}/*.py` |
| SMTP | `services/notifications/email_service.py` |
| Market data | `yfinance` in `services/test_signal/market_context.py` |
| Keychain | `config/secrets.py` |
| Licence server | `config/licence/client.py` |

SQLite is **not** on that list. Use `fresh_db` — a real temp database is faster
and more faithful than a mocked one.

### 16. Fixtures must match reality

Several fixtures build a partly-initialised object via
`TradingRuntime.__new__(TradingRuntime)` and set only the attributes the test
happens to need. That passes until a code path reads one more attribute.

If a fixture needs a new attribute because production code binds it, set what
`__init__` actually sets. That is a fixture becoming *more faithful*, not a test
being bent, and it changes no assertion. Say so in the commit.

### 17. Realistic data

```python
# DON'T
seed_trade(symbol="FOO", lots=999999, sl=1)

# DO
seed_trade(symbol="XAUUSD", lots=0.05, entry=2400.5, sl=2390.0, tp=2415.0)
```

Gold trades near 2400 with 0.01–0.10 lots. Tickets are 8-digit ints. Use values
the system will actually see, so boundary bugs surface.

### 18. Never add a test-only production API

If a method, flag, endpoint or export exists only so tests can control
production code, it belongs in `tests/conftest.py` instead. Production APIs model
real trading behaviour. `set_test_mode()` and `reset_for_test()` are how a
dangerous call path gets built.

---

## Never do this to a test

- delete it because it fails
- add `@pytest.mark.skip` or `xfail` to get past it
- loosen an assertion (`==` → `>=`, exact string → `in`)
- widen a tolerance
- comment out the assert
- lower a coverage baseline to get a gate green

If a test fails, either the change is wrong or the test knows something you
don't. **Read it.**

The **one** legitimate edit to a characterization test is a **mock-target
relocation**: the function moved, so `patch("old.path.fn")` becomes
`patch("new.path.fn")`. Same function, same signature, new home. Name it in the
commit message.

---

## Anti-patterns — reject on sight

| Anti-pattern | What it looks like | Why it's dangerous |
|---|---|---|
| **Tautological test** | Asserts on a mock's return value, not production output | Always passes — tests the mock |
| **Testing the setup** | Seeds a row then asserts the row is there | Proves the fixture works, not the service |
| **Mocking the SUT** | `patch.object(svc, "fn")` then calls `svc.fn()` | You mocked the answer |
| **No assertions** | Body has no `assert` | Passes unless it raises |
| **Copy-paste error** | Success assertion pasted into the failure test | Wrong assertion, always green |
| **The Liar** | `assert result is not None` on a mutation | Coverage without verification |
| **Missing negative control** | `assert offenders == []` and nothing else | A blind detector reports clean forever |
| **Over-mocking** | More patch setup than assertions | Tests the mock wiring |
| **Sequencer** | Depends on dict/list ordering | Sort, or compare as sets |
| **Import-time now** | `NOW = datetime.now()` at module level | Stale by the time a 5-min suite arrives |
| **Local `fresh_db`** | Yet another copy of the fixture | 119 edits when the DB layer moves |
| **Test-only production method** | `reset_for_test()` in a service | Pollutes real APIs, builds live call paths |
| **Incomplete fake** | Fake returns only the fields this assertion reads | Hides integration assumptions |
| **Tests as afterthought** | Implementation done, tests added for coverage | Biased by the implementation |
| **Broker reachability** | Any path that could hit a real or demo order | Costs money |

---

## Review checklist

Reject any test that fails these:

| # | Check | Reject if… |
|---|---|---|
| 1 | Calls production code | Only calls mocks and fixtures |
| 2 | Assertions test code output | Assertions test mock return values |
| 3 | Assertions are specific | Truthiness check on specific data |
| 4 | Would fail on a bug | Inverting the logic changes nothing |
| 5 | Negative control present | A "zero offenders" assertion stands alone |
| 6 | No branching in the body | Has `if` / `try` / ternary |
| 7 | Determinism controlled | Uses wall clock, `random`, or import-time now |
| 8 | Errors asserted explicitly | Exceptions caught and swallowed |
| 9 | Persisted state verified | Only checks the return value |
| 10 | Emissions verified | Emitter fired but payload unasserted |
| 11 | Name matches assertions | Description says one thing, asserts another |
| 12 | One behaviour per test | Unrelated assertions bundled |
| 13 | Shared fixtures used | Local `fresh_db` / `make_engine` copy |
| 14 | Cannot reach a broker | Any live order path unproven |
| 15 | Correct directory | Anything new added to `tests/core/` |

---

## Authoring workflow (mandatory)

1. Write expected-behaviour bullets from product rules and `docs/`, not from the
   implementation.
2. Write one failing test for the next behaviour.
3. **Run it. Watch it fail for the expected reason.**
4. Smallest production change to pass.
5. Run it. Watch it pass.
6. Add the error path, then the boundary. Repeat.
7. Break one assertion on purpose once, confirm red, restore.
8. Run the touched directory, then the full suite if behaviour changed.
9. Re-read the names — do they still match what is asserted?
10. `python -m tools.checks all` before committing.

---

## Running

```bash
pytest tests/services/trading/ -q          # the directory you touched
pytest tests/ -q                           # full suite, ~5 minutes
pytest tests/refactor/ -q                  # structural gates
pytest tests/ -q -k "close_trade"          # by name
pytest tests/services/trading/test_close_trade.py::test_x -q
python -m tools.checks all                 # suite + gates + ratchet + boot
```

**Never run two full suites at once.** It produces phantom failures — known and
reproducible here.

### Coverage

```bash
pytest tests/ -q --cov=backend --cov=frontend --cov-report=json:.coverage.json
python -m tools.refactor_audit.coverage_gate --report
```

Coverage is a per-area ratchet, not a target. It may rise; it may not fall.
Moving test files between directories does not change it — areas are keyed on
*source* paths.

Coverage measures lines *executed*, not behaviour *verified*. A file at 90% whose
tests assert nothing is untested. Use it to find the zero-coverage holes, never
to declare victory. See `/coverage-gap`.

---

## Related

| | |
|---|---|
| `docs/system/rules/40-testing.md` | The protocol this skill implements |
| `docs/system/rules/20-trading-safety.md` | What can cost money |
| `docs/system/rules/30-architecture.md` | Layer boundaries the gates enforce |
| `/verify` | Pre-commit: full suite + gates + boot |
| `/coverage-gap` | Finding and filling untested code |
| `/safe-change` | Anything near orders, sizing or the close path |
