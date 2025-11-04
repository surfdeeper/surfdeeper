# Normalize category vs paths usage

Problem

- Guides use both `category` (for sections) and `paths` for relationships. Logic across the code mixes these distinctions (e.g., gallery uses `category` to group). Risk of inconsistent semantics.

Why this matters

- Clear separation of concerns prevents bugs in navigation and graph.

Scope

- Document the intended meaning:
  - `category`: section membership (single, stable)
  - `paths`: learning path tags (multi)
- Add a small validation script that checks for guides with missing `category` or improper combinations (e.g., section `kind` but also non-empty `dependsOn`).

Acceptance criteria

- New script `scripts/validate-semantics.ts` reports inconsistencies.
- Readme docs updated to clarify fields.
