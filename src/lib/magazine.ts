import type { IssueTheme, Piece, Publication } from "../data/publications";
export interface MagazinePage {
  id: string;
  piece?: Piece;
  part: number;
  parts: number;
}
export const themeNames: Record<IssueTheme, string> = {
  surreal: "Surreal",
  museum: "Gallery",
};
export function magazinePages(publication: Publication): MagazinePage[] {
  return [
    { id: "cover", part: 0, parts: 1 },
    ...publication.pieces.flatMap((piece): MagazinePage[] => {
      if (piece.type !== "poem")
        return [{ id: piece.id, piece, part: 0, parts: 1 }];
      const chunks: string[][] = [];
      let start = 0;
      while (start < piece.lines.length) {
        let end = start;
        let chars = 0;
        let blank = -1;
        while (end < piece.lines.length && end - start < 16) {
          const nextChars = chars + piece.lines[end].length + 1;
          if (end > start && nextChars > 950) break;
          chars = nextChars;
          if (piece.lines[end] === "") blank = end + 1;
          end++;
        }
        if (end < piece.lines.length && blank > start) end = blank;
        chunks.push(piece.lines.slice(start, end));
        start = end;
      }
      if (!chunks.length) chunks.push([]);
      return chunks.map((lines, part) => ({
        id: `${piece.id}:${part}`,
        piece: { ...piece, lines },
        part,
        parts: chunks.length,
      }));
    }),
  ];
}
export function pageFromQuery(
  pages: MagazinePage[],
  pieceId: string | null,
  rawPart: string | null,
): number {
  if (!pieceId) return 0;
  const requested = Math.max(0, Number.parseInt(rawPart ?? "1", 10) - 1 || 0);
  const exact = pages.findIndex(
    (page) => page.piece?.id === pieceId && page.part === requested,
  );
  return exact >= 0
    ? exact
    : Math.max(
        0,
        pages.findIndex((page) => page.piece?.id === pieceId),
      );
}
