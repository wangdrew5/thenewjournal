import {
  createPreviewDraft,
  MAX_ISSUE_BYTES,
  MAX_PIECES,
  type PreviewDraft,
  type PreviewPiece,
} from "./preview";
export interface DraftState {
  draft: PreviewDraft | null;
  saveStatus: string;
}
export type DraftAction =
  | { type: "update"; update: Partial<PreviewDraft> }
  | { type: "add"; piece: PreviewPiece; index?: number }
  | { type: "edit"; id: string; update: Partial<PreviewPiece> }
  | { type: "remove"; id: string }
  | { type: "move"; id: string; offset: -1 | 1 }
  | { type: "start" }
  | { type: "reset" }
  | { type: "status"; value: string };
export function draftReducer(
  state: DraftState,
  action: DraftAction,
): DraftState {
  if (action.type === "status") return { ...state, saveStatus: action.value };
  if (action.type === "reset")
    return { draft: null, saveStatus: "Changes stay in this browser" };
  const draft = state.draft ?? createPreviewDraft();
  let next: PreviewDraft;
  switch (action.type) {
    case "start":
      if (state.draft) return state;
      next = draft;
      break;
    case "update":
      next = { ...draft, ...action.update };
      break;
    case "add": {
      if (
        draft.pieces.length >= MAX_PIECES ||
        draft.pieces.some((p) => p.id === action.piece.id)
      )
        return state;
      const pieces = [...draft.pieces];
      pieces.splice(action.index ?? pieces.length, 0, action.piece);
      next = { ...draft, pieces };
      break;
    }
    case "edit":
      next = {
        ...draft,
        pieces: draft.pieces.map((p) =>
          p.id === action.id
            ? { ...p, ...action.update, id: p.id, type: p.type }
            : p,
        ),
      };
      break;
    case "remove":
      next = {
        ...draft,
        pieces: draft.pieces.filter((p) => p.id !== action.id),
      };
      break;
    case "move": {
      const index = draft.pieces.findIndex((p) => p.id === action.id);
      const target = index + action.offset;
      if (index < 0 || target < 0 || target >= draft.pieces.length)
        return state;
      const pieces = [...draft.pieces];
      [pieces[index], pieces[target]] = [pieces[target], pieces[index]];
      next = { ...draft, pieces };
      break;
    }
  }
  if (
    new TextEncoder().encode(JSON.stringify(next)).byteLength > MAX_ISSUE_BYTES
  )
    return {
      ...state,
      saveStatus:
        "That change could not be added: this issue is over 8 MB. Download a copy, then use smaller images or start another issue",
    };
  return { draft: next, saveStatus: "Saving…" };
}
