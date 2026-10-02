import { useEffect, useMemo, useReducer, type ReactNode } from "react";
import { JournalContext } from "./useJournal";
import { comedyExample } from "../data/comedyExample";
import { publications as originals } from "../data/publications";
import {
  parsePreviewDraft,
  previewPublication,
  PREVIEW_KEY,
  type PreviewDraft,
  type PreviewPiece,
} from "./preview";
import { draftReducer } from "./draftState";

function useJournalState() {
  const [{ draft, saveStatus }, dispatch] = useReducer(
    draftReducer,
    undefined,
    () => {
      let draft: PreviewDraft | null = null;
      try {
        draft = parsePreviewDraft(localStorage.getItem(PREVIEW_KEY));
      } catch {
        /* New or unavailable storage. */
      }
      return {
        draft,
        saveStatus: draft
          ? "Saved in this browser"
          : "Changes stay in this browser",
      };
    },
  );
  useEffect(() => {
    if (!draft) return;
    function flush() {
      try {
        localStorage.setItem(PREVIEW_KEY, JSON.stringify(draft));
      } catch {
        /* The onscreen status reports saving failures. */
      }
    }
    window.addEventListener("pagehide", flush);
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(PREVIEW_KEY, JSON.stringify(draft));
        dispatch({ type: "status", value: "Saved in this browser" });
      } catch {
        dispatch({
          type: "status",
          value:
            "This browser could not save your issue. Download an issue file to keep your work",
        });
      }
    }, 400);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pagehide", flush);
    };
  }, [draft]);
  const publications = useMemo(
    () =>
      draft
        ? [...originals, comedyExample, previewPublication(draft)]
        : [...originals, comedyExample],
    [draft],
  );
  function updateDraft(update: Partial<PreviewDraft>) {
    dispatch({ type: "update", update });
  }
  function addPiece(piece: PreviewPiece, index?: number) {
    dispatch({ type: "add", piece, index });
  }
  function updatePiece(id: string, update: Partial<PreviewPiece>) {
    dispatch({ type: "edit", id, update });
  }
  function removePiece(id: string) {
    dispatch({ type: "remove", id });
  }
  function movePiece(id: string, offset: -1 | 1) {
    dispatch({ type: "move", id, offset });
  }
  function startPreview() {
    dispatch({ type: "start" });
  }
  function resetPreview() {
    dispatch({ type: "reset" });
    try {
      localStorage.removeItem(PREVIEW_KEY);
    } catch {
      /* The draft still resets for this visit. */
    }
  }
  return {
    draft,
    publications,
    saveStatus,
    updateDraft,
    addPiece,
    updatePiece,
    removePiece,
    movePiece,
    startPreview,
    resetPreview,
  };
}
export function JournalProvider({ children }: { children: ReactNode }) {
  const journal = useJournalState();
  return (
    <JournalContext.Provider value={journal}>
      {children}
    </JournalContext.Provider>
  );
}
