# Harden knowledge-graph types and APIs

Problem

- `src/utils/knowledge-graph.ts` builds a graph using optional fields and raw arrays; `GuideNode.levels` defaults to `[]` but no invariant is enforced. Edge filtering relies on string IDs without normalization across all call sites.

Why this matters

- Graph operations are foundational for paths/breadcrumbs; type drift can cause subtle UI issues.

Scope

- Introduce branded `GuideId` type (opaque string) to reduce accidental mixing.
- Ensure `normalizeId()` is used consistently; expose a single `getGuideId(entry)` function and use it where `id` is constructed.
- Strengthen types on `getGuidesByPath` and `buildPathSubgraph` (narrow return arrays/maps).
- Add a couple unit tests for `buildGraph` and `buildPathSubgraph` filtering.

Acceptance criteria

- Graph API exposes explicit types; no casting in consumers.
- Tests cover at least building edges and filtering by path and kind.
