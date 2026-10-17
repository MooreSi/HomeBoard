# Calendar space, bin presentation, panel deletion and charging fit

Validated on 17 October 2026.

## Expected behaviour

The dashboard calendar shows its controls followed directly by calendar content.
The duplicate range row and calendar/person selectors are removed. Filters live
in Settings → Calendars and persist across restart. Their effect is tested with
synthetic ICS events assigned to a household profile, including another profile
that has no events and an Everyone control that restores them. The viewed range
remains in the calendar's accessible label for navigation and build restoration.

Bin presentation is selectable as vertical cards, horizontal cards, upcoming
icons in the panel, or upcoming icons in the header. Icon modes use the earliest
collection day and include all bins collected together, with accessible names
but no visible dates or colour/name labels. Header mode removes the separate bin
panel. Settings and designer controls share an immediate preview; icon size is
12–96 pixels and existing panel resize/placement tools remain available.

Delete panel removes the panel from both orientations, preserves its style and
household records, and supports Undo and Add panel restoration. Charging adapts
typography and spacing to its rendered bounds, scrolls schedule details inside
its card, and retains status messages when no slots exist. Disabled built-in
charging stays hidden.

## Regression evidence

All four initial browser regressions failed before changes: filter settings,
bin presentation, panel deletion and short charging-card fit. Unit regressions
failed because the new settings were unknown and icon mode rendered three dated
cards rather than the two bins due next. A deliberately incorrect icon count was
run red after implementation and restored. The designer bin controls separately
failed before being added.

The original phone layout test now asserts exactly two non-overlapping regions
(toolbar and calendar) with at most 12 pixels between them, replacing its former
four-region contract because the range and filter rows were explicitly removed.
The build-restoration test sets its filter in saved settings and verifies the
calendar's accessible range, selected view, filter preference and URL after
reload. Existing viewport and state assertions are retained.

The first full browser run caught a charging hidden-state regression. The hidden
attribute now takes precedence over the charging flex layout, and the unchanged
charging-disable test was run green after the fix. A further regression checked
header icons after deleting the calendar: header icons now move to an independent
floating header when that panel is absent. Orientation visibility rules override
calendar/charging flex styles so deleting those panels also hides them correctly.

Browser checks include header icons at narrow widths in the organiser, horizontal
card positions, exact icon size, designer preview changes, saved filter effects,
restart persistence, deletion/restoration without removing bin data, independent
header icons after calendar deletion, and first charging-slot bounds at 1024 × 650 and 1500 × 1000.

## Verification

- Full Chrome browser suite: **70 passed, 0 failed, 0 skipped**.
- `npm run verify`: 101 JavaScript files checked; **189 passed, 0 failed,
  0 skipped**.
- Installer shell syntax and whitespace checks: passed.
- Cached-base Docker build: passed, with the registry limitation below.
- Verification inside that image: 101 JavaScript files checked;
  **189 passed, 0 failed, 0 skipped**.
- Disposable Docker smoke: boot, main/organiser/settings/management pages,
  assets and APIs passed. Bin presentation, icon size, calendar/person filters
  and household bin records persisted across restart. The container and volume
  were removed. No coverage ratchet is configured or claimed.

The standard Docker build was attempted, but Docker Hub metadata for
`node:24-alpine` timed out; a separate pull stalled and was stopped. To verify the
app, an existing local production image was used as a cached base. Its
`package.json` and `package-lock.json` SHA-256 hashes match this checkout exactly.
An external temporary Dockerfile copied the current server, lib, public and
scripts directories onto that base; the repository's Dockerfile is unchanged.
This cached-base image built successfully and was used for container checks.
A fresh base-image download/build remains unverified because of that registry
connection failure.

No live provider accounts or physical Fire/iPad/Android/Safari devices were used.
Synthetic local fixtures and disposable container data were used throughout.
