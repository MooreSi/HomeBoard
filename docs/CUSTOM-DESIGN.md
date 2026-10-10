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

## More creative control

Right-click a panel and choose **Heading typography**, **Body typography** or **Secondary typography**. Each text group has its own font, size (including compact sizes below 12px), weight from light to black, italic toggle, underline/strikethrough, colour and alignment. **Panel appearance** exposes all text controls together.

For family cards, the heading is the widget title; body text includes item names and content; secondary text includes dates, assignments and small metadata. In Bin collections, the collection date is secondary text, so its size can be adjusted independently of the bin name and widget heading.

**Spacing & surface** controls padding, item gaps, corners, borders, shadow, surface opacity, a per-panel gradient, line height, letter spacing, vertical alignment and scrolling/clipping. Surface transparency leaves text opaque. **Make compact** applies small type, tight spacing and padding as a starting point for bins and other short panels. Choose whether to show a panel heading in its text options, or use the direct **Hide heading / Show heading** context action. **Restore pre-compact spacing & type** restores the sizes, spacing and corners from before Make compact. This restoration survives saving/reloading and keeps later colour/font choices. Reapplying Make compact retains the original restoration point; Undo/redo is also available.

**Copy panel style / Paste panel style** transfers presentation without moving the destination or changing household content. **Lock position** protects dragging, keyboard movement and placement controls while allowing appearance edits. **Layers** offers Bring to front, Go forward, Go backward and Send to back. Forward/backward move one position in a stable layer order, including when panels originally share a layer. **More layout actions** groups alignment and sizing presets. The selected-panel list in the toolbar lets you select a panel covered by another. **Copy panel to other orientation** copies that panel's placement; check the other orientation for overlaps afterward. Undo/redo includes these operations.

The **Preview** toolbar button hides selection overlays and lets you interact with the actual calendar in the iframe; **Edit panels** returns to design mode.

## Smart charging panel

Connect Octopus in Settings → Smart charging using your account ID/API key, then choose **Add panel → Smart charging**. The panel uses the same typography, crop, layers and library controls as other widgets. See the [Octopus setup guide](OCTOPUS.md). Credentials are server-side and are excluded from portable designs. The editor now uses schema 6 to add this optional panel while retaining earlier schema support.

## Crop panels and compose date/time

**Crop panel** trims the top, right, bottom and left edges by percentages. **Drag crop edges** switches the canvas to crop mode: drag its edge/corner handles, then click **Done editing**. Cropping retains the underlying content and grid position; the remaining area is at least 10% on each axis. **Reset crop** restores the whole panel. Crop mode supports arrows for the top/left edges and Shift + arrows for the bottom/right edges. Escape exits the tool or cancels an active drag. Cropping applies to both orientations.

For Date & time, **Arrange date/time items** controls Time, Analog clock, Date, Location / timezone and Seconds. Select an item to show/hide it or set its position/size as a percentage of the panel. **Drag items on canvas** lets you move each visible item and resize with edge handles. Arrow keys move items; Shift + arrows resizes them. Removed items stay available in the dropdown. These settings survive reloads and clock updates. **Reset date/time arrangement** restores the normal automatic composition. The global Date & time settings still select digital/analog/both and date format. When using both clocks, position their independent slots to avoid overlap. Location displays the chosen timezone.

Clock text inherits the panel’s heading/secondary typography; adjust that alongside the item rectangles to fit the available space. Date/time placement currently applies to both orientations. Use the independent panel positions/sizes to provide room in each orientation. Panel position locking protects the outer panel while internal clock composition remains editable. Unlock the position before dragging crop handles; crop percentage controls remain available while locked.

## Copy a built-in theme

Choose a theme in **Load a built-in theme as a copy**, then click **Load theme as new design**. All seventeen themes are available. The copy adopts its palette, font character, background type and a grid-based adaptation of its composition. Built-in theme layouts are responsive CSS, so this is an editable adaptation rather than a pixel-for-pixel conversion.

The new draft is named “Theme name · my design”. Save it to your design library or save dashboard settings to apply it. The built-in theme catalogue and selected default theme remain unchanged. You can save multiple variations under new names.

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

The creative update uses schema version 4 for separate text roles, rich surfaces and position locks. Version 1/2/3 designs and reusable blocks are upgraded by the editor without mutating their source. Schema 4 files require a HomeBoard build containing this creative update. The panel-tools update upgrades editor drafts to schema 5, which adds validated crops, compact restoration and date/time composition; schemas 1–4 remain supported.

## Implementation research

Separate text styles and adjustable spacing follow the approach documented in [Figma's typography system guide](https://www.figma.com/best-practices/typography-systems-in-figma/) and [auto layout guide](https://help.figma.com/hc/en-us/articles/360040451373-Explore-auto-layout-properties). Position locking and transferable styles help keep a composed screen stable while experimenting with typography and colour. Local font families and validated declarative properties keep designs portable without arbitrary CSS or remote font dependencies.

The design uses native [W3C Pointer Events](https://www.w3.org/TR/pointerevents/latest/): pointer capture retains a drag when the cursor leaves its starting handle, mouse/touch use the same geometry, and cancellation restores the starting position. Grid snapping and bounded resize follow the interaction model documented by [interact.js](https://interactjs.io/docs/), while keeping HomeBoard's integer-grid implementation dependency-free.

The click/dropdown and keyboard alternatives follow [W3C dragging guidance](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements). Context actions use [WAI menu keyboard conventions](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/); property popovers use ordinary labelled inputs, dropdowns and Escape/focus restoration. Right-click is an accelerator; the toolbar exposes equivalent operations.
