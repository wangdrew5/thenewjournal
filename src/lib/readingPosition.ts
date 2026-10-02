import type { Publication } from "../data/publications";
import { magazinePages } from "./magazine";

export const READING_KEY = "tnj:reading:v1";

export function readingPosition(raw: string | null, publications: Publication[]) {
  try {
    const value = JSON.parse(raw ?? "null");
    if (!value || value.version !== 1 || !Number.isInteger(value.part) || value.part < 0) return null;
    const publication = publications.find((p) => p.id === value.publicationId);
    if (!publication) return null;
    const pages = magazinePages(publication);
    const index = pages.findIndex((p) => p.piece?.id === value.pieceId && p.part === value.part);
    if (index < 1) return null;
    const page = pages[index];
    return { publication, page, index, total: pages.length - 1,
      to: `/publication/${publication.id}?${new URLSearchParams({ piece: page.piece!.id, ...(page.part ? { page: String(page.part + 1) } : {}) })}` };
  } catch { return null; }
}
