import type { ReactNode } from "react";

/**
 * One line of a poem or transcript as it is drawn. A line wrapped in asterisks, such as
 * `*Previously published in …*`, shows in italics without them; a blank line keeps its height.
 */
export function verseLine(line: string): ReactNode {
  const italic = /^\s*\*(\S(?:.*\S)?)\*\s*$/.exec(line);
  if (italic) return <em>{italic[1]}</em>;
  return line || "\u00a0";
}
