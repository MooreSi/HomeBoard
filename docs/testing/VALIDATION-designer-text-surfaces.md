# Designer text selection, transparency and weather controls

Validated on 17 October 2026.

## Behaviour

- Select text is a visible designer action. Double-clicking a panel also enters
  text editing. Individual labels, dates and bin titles have selectable outlines;
  headings, whole sections and cards remain available in the Selected text list.
- The selected text has its own font, size, colour and percentage-based position
  and box dimensions. Dragging, edge resizing and keyboard movement remain
  available. Increasing the text size gives its box enough height for a line.
  Digital time retains its explicit size when the clock ticks.
- Every panel has a visible Transparent panel background switch. It removes the
  surface, border and shadow without fading text or graphics. Exact panel
  properties include Background opacity (%) for partial transparency. A legacy
  solid-background selector no longer overrides the alpha-aware surface rule;
  the correction is limited to background styling to preserve compact padding.
- Selecting Weather exposes Weather panel presentation next to the designer
  controls. Compact, detailed cards, graphical scenes and a temperature chart
  update the connected forecast preview immediately and share the normal
  Weather settings preference.

Text keys use household item IDs where available. Existing version 7 content
placements without optional font/colour fields remain valid. Validation rejects
unknown fonts, unsafe colours, non-string style values, null records, unknown
fields and out-of-bounds geometry. No free-form CSS or remote font URLs are saved.

## Regression evidence

The three feature tests first failed because Select text, the transparent switch
and designer weather selector were absent. A new text-style unit test failed
against the former content-key schema; a separate malformed-record test failed
on null input before validation was corrected. An intentionally incorrect font
assertion was run red after implementation and restored. The digital clock test
first failed because its text had no selectable target.

Browser checks exercise individual bin-title selection; saved font, colour, size
and position; real dashboard rendering after restart; position after portrait
resize; all thirteen transparent panel styles; transparent rendered weather with
full text opacity; immediate graphical/chart previews and persistence; Family
Hub chart rendering; double-click selection; and clock ticks preserving the
selected size. Existing bin-card movement/resize and organiser checks are retained.

The full browser run also caught two regressions: compact bins lost their padding
rule when the surface selector was widened, and the expanded toolbar could leave
clock drag handles outside the viewport. The surface override now affects only
background; entering clock dragging brings the canvas into view immediately.
The original assertions were retained and run green after these corrections.

## Verification

- Full Chrome browser suite: **64 passed, 0 failed, 0 skipped**.
- `npm run verify`: 99 JavaScript files checked; **187 passed, 0 failed,
  0 skipped**.
- Installer shell syntax and whitespace checks: passed.
- Final production Docker build: passed.
- `npm run verify` inside the production image: 99 JavaScript files checked;
  **187 passed, 0 failed, 0 skipped**.
- Disposable Docker smoke: boot, health, main/family dashboards, settings/family
  management pages, six assets, APIs and transparent surfaces/text styles saved
  across container restart passed. Temporary container and volume were removed.
- Synthetic designer screenshot inspected; text outlines and preview displayed
  the selected bin title independently of the panel. No coverage ratchet is
  configured or claimed.

No personal calendars, photos, tokens or production household data were used.
Live provider accounts and physical Fire/iPad/Android/Safari device checks remain
unverified. Browser checks use Chrome with synthetic data and emulated viewports.
