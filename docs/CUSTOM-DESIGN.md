# Custom designer

Open Settings → Custom designer. Choose a finished starter (Studio, Family, Planner or Gallery), then enable your design. Changes are a draft until **Save changes**. Disabling the custom design returns to the selected dashboard theme.

## Work on the live canvas

- Hold the left mouse button and drag a panel to move it. Drag any of its eight edge/corner handles to resize it. Placement snaps to a 12 × 12 grid and stays inside the canvas.
- Right-click a panel for **Panel appearance**, **Position & size**, size presets, alignment, layer order or hiding. Appearance and placement open compact dropdown controls directly beside the canvas.
- Right-click empty canvas space for **Screen appearance**: coordinated palettes, background type, gradient colours/direction, fonts, spacing, opacity and corners.
- **Add panel**, **Panel options** and **Screen style** open the same controls without a right-click, including on touch devices. Hidden panels retain their content and placement.
- Arrow keys move the focused panel; Shift + arrows resizes it. Shift + F10 opens its context menu. Escape closes menus and restores focus or cancels an active drag. Undo/redo stores up to 100 changes; a complete drag is one step.

Select Landscape or Portrait to edit the independent layouts. Portrait tablets, portrait wall displays and narrow phones use the portrait arrangement. The editor always previews the orientation you chose, regardless of the management device's width. Calendars and other overflowing panels scroll internally on the dashboard.

The preview uses your current calendar and household records. Empty selected family panels retain their headings and a setup hint. Weather/news require their own enabled source settings. Selecting a starter does not connect a source or add household records.

## Make it yours

Five coordinated palettes cover midnight blue, soft sage, warm terracotta, northern lights and lavender mist. Backgrounds support a solid colour, a gradient with two colours and a direction, or your existing slideshow with adjustable shading. A gradient is available while no photo is loaded. No separate image upload is required for backgrounds.

Choose bundled Roboto, system fonts and six other locally available families. Body/heading sizes, weights, line height, letter spacing, panel padding/gap, borders, rounded corners, shadows and opacity can be fine-tuned in the collapsed Screen appearance section. A panel can inherit the screen's style or have its own font, colour, size, surface and alignment. Advanced placement fields remain available as an alternative to dragging.

Contrast guidance compares text with the opaque surface colour. Transparency and photographs change actual contrast, so review the preview too.

## Design library and scheduled screens

**Save to library** stores the current whole design with its name and both orientations. Library cards let you **Edit** a saved copy as a draft, **Update** it from the current draft, or **Delete** it. Saving a library copy does not replace the dashboard until you save the dashboard settings.

The library uses the durable named-screen store. Existing saved screens appear in it. New copies start with scheduling disabled; use Settings → Family & screens to set weekdays/times, enable schedules, arrange playlists or open pinned screen URLs. Designs and reusable panel blocks are included in household backups. Reusable block controls live under Advanced panel properties.

## Sharing and compatibility

Export a design file to share its presentation choices. Imports preview as drafts; Save changes applies them. Files contain no calendar links, credentials, photos or household content. Unexpected fields, executable CSS/scripts, remote font URLs, invalid colours/geometry and files over 64 KB are rejected.

v0.3 adds design schema version 3 for validated gradient endpoints, direction and photo shading. Existing version 1/2 settings, saved screens and portable files remain supported; the editor upgrades them when edited. The portable file envelope remains `format: "homeboard-design"`, `version: 1` with a `design` object.

## Implementation research

The design uses native [W3C Pointer Events](https://www.w3.org/TR/pointerevents/latest/): pointer capture retains a drag when the cursor leaves its starting handle, mouse/touch use the same geometry, and cancellation restores the starting position. Grid snapping and bounded resize follow the interaction model documented by [interact.js](https://interactjs.io/docs/), while keeping HomeBoard's integer-grid implementation dependency-free.

The click/dropdown and keyboard alternatives follow [W3C dragging guidance](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements). Context actions use [WAI menu keyboard conventions](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/); property popovers use ordinary labelled inputs, dropdowns and Escape/focus restoration. Right-click is an accelerator; the toolbar exposes equivalent operations.
