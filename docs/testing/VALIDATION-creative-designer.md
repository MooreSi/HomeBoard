# Creative designer validation · 10 October 2026

The creative designer update passes 120 API/unit regressions locally and in the production Docker image, 16 Chrome scenarios and 16 WebKit scenarios, with no failures or skipped tests. Final JavaScript syntax and Git whitespace checks pass. The image was rebuilt after the final context-menu lock fix.

Four new application regressions cover independent typography/surface validation and portable files, legacy design migration without source mutation, all seventeen built-in theme adaptations without changing their metadata, and schema 4 settings/design-library/reusable-block persistence across restart. Missing implementation was observed failing before the new schema was added.

Four new browser scenarios exercise actual rendered bin heading/body/secondary sizes and styles, theme loading and library saving without altering the built-in catalogue, position locking and clean preview, and compact bin content fitting a short panel with independently copied styles. Existing browser assertions remain; the size-preset route now enters the grouped layout submenu.

Final review identified that position locks also disabled style copying while allowing layer changes. A new assertion failed before correction. Chrome's full suite and WebKit's targeted lock scenario pass after the correction. Position locks permit appearance copying and prevent layer changes.

The disposable Docker smoke container serves the new panel stylesheet and verifies schema 4 settings/library persistence, optional password protection, authentication gating and protection removal across two restarts. Both the container and its volume were cleaned up; the user's running instance and household data were not changed.

Visual review uses isolated demo records. Screenshots in ignored artifacts/creative-bin-typography.png and artifacts/creative-clean-preview.png show the typography menu and a compact bin card with a gradient surface. WebKit automation does not substitute for physical iPad/Android gesture testing. Live provider integrations were not reconnected for this designer change.

This update remains local and is recorded under Unreleased. The published v0.3.0 release and running container have not been replaced.
