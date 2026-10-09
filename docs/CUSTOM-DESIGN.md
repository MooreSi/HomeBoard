# Custom Design

Open Settings → Custom Design. Enable the custom design, give it a name and choose a starting layout. Your built-in theme stays selected so disabling Custom Design returns to it. Changes remain a draft until Save changes.

v0.22 upgrades saved designs to design schema version 2; version 1 imports remain supported. The theme-file envelope remains version 1.

The canvas has 12 columns and 12 rows. Drag a panel to move it; focus it and use arrow keys, or Shift + arrows to resize. Exact dimensions and layers appear below. Panels may overlap, with higher layers in front. Undo/redo keeps up to 100 draft steps. Calendar, clock, photos, weather, news, lists, chores, routines, meals, bins, countdowns and notices each have a visibility switch. Weather/news also require their own source settings to be enabled. The editor does not connect new sources.

Eight locally available font families include bundled Roboto and system fonts. Choose different body and heading faces, sizes, weight, line height and spacing. Change six palette colours, panel gap/padding, corners, border, shadow and opacity. Backgrounds can be solid, a two-colour gradient or the existing rotating photo backdrop. Contrast is calculated for text against the opaque surface colour; transparency and photos can reduce actual contrast, so check the preview.

Landscape screens use the landscape grid. For version 2 designs, screens below 700px use the independent portrait grid: choose Portrait in the editor to arrange it. Older version 1 designs retain their stacked layout. Calendar panels scroll internally. Hidden panels keep their canvas position for later use. Dimensions that cannot fit are clamped to the grid in the editor and rejected in imported files.

## Panel styles and reusable blocks

Give the selected panel its own font, text size, foreground/background colours and alignment. Otherwise it inherits the overall design. Align left, align top and horizontal centring operate on the selected orientation. Placement always snaps to the grid.

Save a named reusable panel layout/style in the block library, then apply it to another selected panel. This copies presentation and placement, without copying personal content. Blocks live in the family data store and are included in full backups. Exporting a theme includes its applied panel styles and both orientations, so they can be shared with other HomeBoard users.

## Sharing

Export theme file downloads JSON with `format: "homeboard-design"`, `version: 1` and a `design` object. Import theme file accepts this format (maximum 64 KB) and previews it without changing the saved dashboard. Save changes applies it across your home displays. There is no remote theme marketplace; exchange files directly with other users.

Design files contain presentation settings only. Arbitrary CSS/scripts, remote font URLs, unexpected fields and invalid dimensions/colours are rejected. Calendar subscription links, weather keys, tokens, source paths, photos and display preferences are excluded. Themes from other software need to be recreated with these controls; they are not directly compatible.

## Design research

The controls were informed by common wall-display editor conventions: precise block placement, snapping, layers, keyboard movement, undo/redo and font selection; and [Home Assistant's Sections](https://www.home-assistant.io/dashboards/sections/) for responsive grid placement. HomeBoard implements these concepts with its own HTML/CSS modules and a portable declarative theme format. It uses existing content panels rather than copying third-party code or exposing arbitrary imported CSS.
