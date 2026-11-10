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

/**
 * A song's credit as it is printed after "produced by". Credits typed with the words
 * already in them ("produced by …") lose them, so the reader never says them twice.
 */
export const songCredit = (author: string) => author.replace(/^\s*produced by\s+/i, "").trim();
