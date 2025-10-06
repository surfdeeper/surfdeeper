/**
 * Detects if a markdown document contains no meaningful content other than
 * variations of the word "todo" (e.g., "to do", "TODO", "to-do").
 *
 * Approach: lowercase and strip all non a-z characters; if the result equals
 * "todo", then the content is considered a placeholder.
 */
export function isPlaceholderTodo(markdown: string | undefined | null): boolean {
  const normalized = (markdown ?? "").toLowerCase().replace(/[^a-z]/g, "").trim();
  return  normalized === "todo" || normalized == 'comingsoon';
}
