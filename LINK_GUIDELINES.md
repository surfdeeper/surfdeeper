# Link Validation

Automated system to prevent broken internal links in content.

## How It Works

- **Pre-commit validation**: Links are checked before each commit
- **Auto-suggestions**: When links break, get suggestions for correct paths
- **Auto-fixing**: Run `npm run fix:links` to fix common patterns

## Scripts

- `npm run lint:links` - Check all internal links

## Link Format

Use full paths for internal guide links:

```markdown
✅ Correct: [Cobra Pose](/guide/core-skills/cobra-pose) ❌ Wrong: [Cobra Pose](/guide/cobra-pose)
```

URL structure matches the file system:

- File: `src/content/guides/core-skills/cobra-pose.md`
- URL: `/guide/core-skills/cobra-pose`
