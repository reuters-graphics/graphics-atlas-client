---
"@reuters-graphics/graphics-atlas-client": minor
---

Modernized release with the map build folded back into the package.

- **TopoJSON maps** ship in the package (country polygons + border lines at `low`/`medium`/`high`), fetched from the version-pinned CDN via `fetch*` methods or imported directly (tree-shakeable).
- **Flags** via `flag-icons` (`getCountryFlag` / `getFlag`, incl. non-country flags) — URLs/classes only, nothing bundled.
- **GDP** added to each country's `dataProfile`; population refreshed to 2025; `coordinates` use `[lon, lat]` (GeoJSON order).
- Case-insensitive and numeric ISO lookups.
- Ships **dual ESM + CommonJS** with **zero runtime dependencies**.
- Fixed polygon winding inversion that made `medium`/`high` maps render hollow (scale-aware quantization + spherical rewind, with a build-time guard).
