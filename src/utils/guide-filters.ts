/**
 * Detects if a markdown document contains no meaningful content other than
 * variations of the word "todo" (e.g., "to do", "TODO", "to-do").
 *
 * Approach: lowercase and strip all non a-z characters; if the result equals
 * "todo", then the content is considered a placeholder.
 */
export function isPlaceholderTodo(
  markdown: string | undefined | null,
): boolean {
  const text = (markdown ?? "").trim();
  if (!text) return false;

  // Check the first non-empty line for common placeholders
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
