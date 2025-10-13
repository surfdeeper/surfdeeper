# Reduce `any` usage for Leaflet integration

Problem

- Many utilities use `any` for Leaflet map, marker, and window access: `leaflet-setup.ts`, `map-theme-switcher.ts`, `spot-guides-helpers.ts`, `map-preview.ts`, `spot-guides.ts`.

Why this matters

- `any` obscures API misuse; TS cannot help during refactors.

Scope

- Introduce minimal ambient types to avoid pulling full Leaflet types:
  - Define `interface LeafletMap { addControl(c: any): void; removeLayer(l: any): void; _tileLayer?: any; }`
  - Define `interface Leaflet { map(...): LeafletMap; tileLayer(url: string, opts: any): any; divIcon(opts:any): any; marker(latlng:[number,number], opts?: any): any; Control: { extend(opts:any): any } }`
  - Declare `interface Window { L?: Leaflet }` in a `global.d.ts` next to utils.
- Use these interfaces in utils and scripts to replace `any` signatures where feasible.

Steps

- Add `src/types/leaflet-lite.d.ts` with minimal interfaces and window augmentation.
- Update function signatures in `leaflet-setup.ts`, `map-theme-switcher.ts`, and scripts to use these minimal types.

Acceptance criteria

- `grep -R "\bany\b" src/**/*.ts` shows a clear reduction, especially in map-related files.
- Typecheck passes without introducing Leaflet dependency.
