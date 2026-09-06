# OpsCortex contributor instructions

## UI design contract

Before adding or modifying any component, section, page, styling, or animation,
read [DESIGN.md](DESIGN.md), then inspect the closest existing implementation.

- Reuse the shared tokens, primitives, layout, and motion hooks.
- Preserve logo-red text accents (`--accent2: #f73938`) in both themes.
- Keep body text neutral and **do not change butterfly colors**.
- Keep the supplied theme-specific owl logos and existing font families.
- Follow DESIGN.md's verification checklist for UI changes.
- Do not treat existing placeholders or defects as patterns to reproduce.
- Update DESIGN.md alongside an explicitly approved design-system change.

Explicit user requests take precedence. For a conflict with this contract, name
the specific conflict; do not silently redesign unrelated parts of the site.

