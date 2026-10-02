import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { useSearchParams } from "react-router-dom";
import type { Publication } from "../data/publications";
import { magazinePages, pageFromQuery } from "./magazine";
import { READING_KEY } from "./readingPosition";

// Shared page state for both reader engines: the URL query is the source of
// truth so direct links, reloads, and the contents dialog all agree.
export function useIssueNav(publication: Publication) {
  const [query, setQuery] = useSearchParams();
  const pages = useMemo(() => magazinePages(publication), [publication]);
  const index = pageFromQuery(pages, query.get("piece"), query.get("page"));
  useEffect(() => {
    const page = pages[index];
    if (!page.piece) return;
    try {
      localStorage.setItem(READING_KEY, JSON.stringify({ version: 1, publicationId: publication.id, pieceId: page.piece.id, part: page.part }));
    } catch { /* Reading remains available when browser storage is disabled. */ }
  }, [pages, index, publication.id]);
  const goTo = useCallback(
    (target: number) => {
      const next = Math.min(pages.length - 1, Math.max(0, target));
      if (next === index) return;
      const page = pages[next];
      setQuery(
        page.piece
          ? {
              piece: page.piece.id,
              ...(page.part ? { page: String(page.part + 1) } : {}),
            }
          : {},
        { replace: true },
      );
    },
    [pages, index, setQuery],
  );
  const goToPiece = useCallback(
    (pieceIndex: number) =>
      goTo(
        pages.findIndex(
          (page) => page.piece?.id === publication.pieces[pieceIndex]?.id,
        ),
      ),
    [goTo, pages, publication.pieces],
  );
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if ((event.key === "Home" || event.key === "End") && event.target instanceof HTMLElement && event.target.closest("[role='region']")) return;
      if (
        event.target instanceof HTMLElement &&
        event.target.closest(
          "input, textarea, select, video, dialog, [contenteditable]",
        )
      )
        return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
        return;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(index + (event.key === "ArrowRight" ? 1 : -1));
      } else if (event.key === "Home") {
        event.preventDefault();
        goTo(0);
      } else if (event.key === "End") {
        event.preventDefault();
        goTo(pages.length - 1);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goTo, index, pages.length]);
  return { pages, index, page: pages[index], goTo, goToPiece };
}

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", notify);
      return () => list.removeEventListener("change", notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const pieceKind = { poem: "Poem", film: "Film", art: "Art" } as const;

export function pad(value: number) {
  return String(value).padStart(2, "0");
}

// Controls keep their own pointer behaviour; clicks and swipes on them never
// turn the page.
export const CONTROLS =
  "a, button, video, input, textarea, select, summary, [role='button']";
