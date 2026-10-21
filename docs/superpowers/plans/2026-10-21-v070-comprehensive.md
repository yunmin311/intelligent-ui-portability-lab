# v0.7.0 comprehensive implementation plan

Goal: Complete exact image ZIP archives, CSS fidelity repairs, useful diagnostics and verified offline flows in one authorized execution.
Architecture: Keep IR 1.4 self-contained and unchanged in size. Extend the existing ZIP exporter with a validated raster compositor and an explicit ZIP-only image resource path; no resource references enter JSON. Keep the existing isolated import, finite runtime, CSP and UI.
Constraints: WSL execution; minimum MV3 permissions; 4 MB IR, 2 MB resource and session limits unchanged; no source scripts/remote URLs/fonts; license unchanged; PR and CI merge authorized; no public Release.

- [x] Regression before fixes: CSSOM longhands, complete PNG membership, high entropy explicit archive and resource/hash rejection.
- [x] Add bounded PNG compositor shared by ordinary ZIP and direct ZIP-only import. Notes use a complete relative PNG. ZIP-only contains no snapshot.json and explicitly documents the lack of IR roundtrip.
- [x] Repair CSS longhands for borders, radii, overflow and columns; compare actual source/import/export screenshots. Retain negative CSS URL checks.
- [x] Make math font and Markdown limitations visible before download; verify MathML/SVG/merged tables without inventing formula conversion.
- [x] Exercise installed MV3 popup, clipboard, files/drop, zoom, all recipes and isolated nested states; close source and extension before offline replay. Validate Markdown in a real renderer; attempt isolated existing Obsidian without touching user vault.
- [x] Fresh independent code/security/visual review; fix findings, rerun affected checks then complete full verification once.
- [x] Update docs/version, build final ZIP/source/manifest/checksums, install from ZIP and retest (58 MV3 passed).
- [ ] Create PR, attach, await CI, merge and verify main CI; retain matching final artifacts. No public Release.

Review focus: malformed/reordered/overlapping raster tiles; high entropy memory budgets; alpha and decoded pixel exactness; CSS URL bypass; Markdown absolute/dangling references and unsupported math; cancellation/retry; tampered JSON trust; cross-component and keyboard state; source glyph errors versus export defects.
