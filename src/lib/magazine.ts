import type { IssueTheme, Piece, Publication } from "../data/publications";
export interface MagazinePage {
  id: string;
  piece?: Piece;
}
export const themeNames: Record<IssueTheme, string> = {
  surreal: "Surreal",
  museum: "Gallery",
};
// One page per piece, however long: a long poem scrolls inside its page rather than being
// split across several.
export function magazinePages(publication: Publication): MagazinePage[] {
  return [
    { id: "cover" },
    ...publication.pieces.map((piece): MagazinePage => ({ id: piece.id, piece })),
  ];
}
export function pageFromQuery(pages: MagazinePage[], pieceId: string | null): number {
  if (!pieceId) return 0;
  return Math.max(0, pages.findIndex((page) => page.piece?.id === pieceId));
}
