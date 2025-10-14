# Magic Link Validation

Automated system to prevent broken links in a graph-based content model.

## What it validates

- Magic link syntax in Markdown: `[Label](:concept-id)` and alias forms `[Label](:concept-id|:alias)`
- Learning link syntax in Markdown: `[[concept-id]]` and `[[concept-id|display text]]`
- Frontmatter relationships by ID: `dependsOn`, `leadsTo`
- Duplicate IDs or alias collisions

## Behavior

- **Broken links are hidden**: Unresolved magic links and learning links are rendered as plain text (not clickable)
- **Validation reports errors**: The linter (`npm run lint:links`) will report all broken links with helpful error messages
- This ensures broken links don't clutter the UI while still catching them during development

## Scripts

- `npm run lint:links` - Check all concept ID links and relationships

## Authoring

- Link by concept ID, not by path: `[Pop-up](:pop-up)`
- Declare relationships by ID in frontmatter: `dependsOn: [cobra-pose]`
- For the full model and examples, see: `docs/KNOWLEDGE_ARCHITECTURE.md`
