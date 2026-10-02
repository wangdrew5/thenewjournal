import { createContext, useContext } from "react";
import type { Publication } from "../data/publications";
import type { PreviewDraft, PreviewPiece } from "./preview";
export interface JournalState {
  draft: PreviewDraft | null;
  publications: Publication[];
  saveStatus: string;
  updateDraft: (update: Partial<PreviewDraft>) => void;
  addPiece: (piece: PreviewPiece, index?: number) => void;
  updatePiece: (id: string, update: Partial<PreviewPiece>) => void;
  removePiece: (id: string) => void;
  movePiece: (id: string, offset: -1 | 1) => void;
  startPreview: () => void;
  resetPreview: () => void;
}
export const JournalContext = createContext<JournalState | null>(null);
export function useJournal() {
  const journal = useContext(JournalContext);
  if (!journal) throw new Error("JournalProvider is missing");
  return journal;
}
