// Shared placeholder detection for Node-side scripts (remark, migrations)
// Mirrors src/utils/guide-filters.ts:isPlaceholderTodo to keep behavior consistent
export function isPlaceholderDoc(markdown) {
  const text = String(markdown ?? "").trim();
  if (!text) return false;

  const firstLine = text.split(/\r?\n/).find((l) => l.trim().length > 0) || "";
  const firstTrim = firstLine.trim();

  // Matches: "Coming soon", "coming soon.", etc.
  if (/^coming\s*soon[.!?]*$/i.test(firstTrim)) return true;

  // Matches: "TODO", "to-do", "to do"
  if (/^to\s*-?\s*do\b|^todo\b/i.test(firstTrim)) return true;

  // Matches: lines that start with "Placeholder" (e.g., "Placeholder: concept page ...")
  if (/^placeholder\b/i.test(firstTrim)) return true;

  // Fallback strict normalization check for entire doc
  const normalized = text
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .trim();
  return (
    normalized === "todo" ||
    normalized === "comingsoon" ||
    normalized === "placeholder"
  );
}
