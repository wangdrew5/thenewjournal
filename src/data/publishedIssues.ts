import type { Publication } from "./publications";
import { isPublicationId, parsePreviewDraft, previewPublication, type PreviewDraft } from "../lib/preview";

// Every issue the editor has published: src/data/published/<id>.json, where <id> is the
// issue's web address. Bundled at build time; with none there, the site shows an empty state.
const files = import.meta.glob<unknown>("./published/*.json", { eager: true, import: "default" });

export interface PublishedDraft {
  id: string;
  draft: PreviewDraft;
}

export function readPublished(entries: Record<string, unknown>): PublishedDraft[] {
  return Object.entries(entries).flatMap(([path, json]) => {
    const id = /([^/]+)\.json$/.exec(path)?.[1] ?? "";
    const draft = isPublicationId(id) ? parsePreviewDraft(JSON.stringify(json)) : null;
    return draft ? [{ id, draft: { ...draft, publicationId: id } }] : [];
  });
}

/** Newest issue first: by issue number when both have one, otherwise by address. */
function newestFirst(a: PublishedDraft, b: PublishedDraft) {
  const order = b.draft.issueNumber.localeCompare(a.draft.issueNumber, undefined, { numeric: true });
  return order || a.id.localeCompare(b.id);
}

export const publishedDrafts: PublishedDraft[] = readPublished(files).sort(newestFirst);

export function publishedPublications(drafts: PublishedDraft[], base?: string): Publication[] {
  return drafts
    .map(({ id, draft }) => previewPublication(draft, { id, base }))
    .filter((publication) => publication.pieces.length > 0);
}

export const publishedIssues: Publication[] = publishedPublications(publishedDrafts);

// Compare drafts by content, whatever order their fields were written in.
const normal = (draft: PreviewDraft) => JSON.stringify(parsePreviewDraft(JSON.stringify(draft)));

/** True when a draft is exactly what is published at its address. */
export function matchesPublished(draft: PreviewDraft, drafts: PublishedDraft[] = publishedDrafts) {
  const live = drafts.find((p) => p.id === draft.publicationId);
  return !!live && normal(live.draft) === normal(draft);
}
