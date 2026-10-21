import type { Publication } from "../data/publications";
import { PREVIEW_ID } from "./preview";

/** "Issue 01" / "No. 01"; the dev draft is "Your issue"; a published issue without a number is "Online issue". */
export function issueName(publication: Publication, prefix: "Issue" | "No." = "Issue") {
  if (publication.issueNumber) return `${prefix} ${publication.issueNumber}`;
  return publication.id === PREVIEW_ID ? "Your issue" : "Online issue";
}

/** The short mark beside an issue on the home page; the dev draft is always "Draft". */
export function issueMark(publication: Publication) {
  return publication.id === PREVIEW_ID ? "Draft" : (publication.issueNumber ?? "—");
}
