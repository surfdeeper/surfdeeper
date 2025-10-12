# Magic Link Validation

Automated system to prevent broken links in a graph-based content model.

## What it validates

- Magic link syntax in Markdown: `[Label](:concept-id)` and alias forms `[Label](:concept-id|:alias)`
- Frontmatter relationships by ID: `dependsOn`, `leadsTo`
- Duplicate IDs or alias collisions

## Scripts

- `npm run lint:links` - Check all concept ID links and relationships

## Authoring

- Link by concept ID, not by path: `[Pop-up](:pop-up)`
- Declare relationships by ID in frontmatter: `dependsOn: [cobra-pose]`
- For the full model and examples, see: `docs/KNOWLEDGE_ARCHITECTURE.md`
