import { comedyExample } from "../data/comedyExample";
import type {
  IssueTheme,
  Piece,
  PieceType,
  Publication,
} from "../data/publications";

export const PREVIEW_ID = "preview-issue";
// Keep the original key so existing visitors retain their work after migration.
export const PREVIEW_KEY = "tnj:preview:v1";
export const MAX_IMAGE_BYTES = 1024 * 1024;
export const MAX_ISSUE_BYTES = 8 * 1024 * 1024;
export const MAX_PIECES = 200;
export interface PreviewPiece {
  id: string;
  type: PieceType;
  title: string;
  author: string;
  text: string;
  image: string;
  caption: string;
  alt: string;
  video: string;
}
export interface PreviewDraft {
  version: 2;
  theme: IssueTheme;
  caption: string;
  cover: string;
  pieces: PreviewPiece[];
}
export function createPreviewPiece(type: PieceType, id: string): PreviewPiece {
  return {
    id,
    type,
    title: "",
    author: "",
    text: "",
    image: "",
    caption: "",
    alt: "",
    video: "",
  };
}
export function createPreviewDraft(): PreviewDraft {
  return {
    version: 2,
    theme: "surreal",
    caption: "My issue",
    cover: "",
    pieces: [],
  };
}
export function createComedyDraft(): PreviewDraft {
  const piece = comedyExample.pieces[0];
  if (piece.type !== "poem")
    throw new Error("Comedy example must contain writing");
  return {
    ...createPreviewDraft(),
    caption: comedyExample.caption,
    theme: "museum",
    pieces: [
      {
        ...createPreviewPiece("poem", "preview-poem-1"),
        title: piece.title,
        author: piece.author,
        text: piece.lines.join("\n"),
      },
    ],
  };
}
const isImage = (value: unknown): value is string =>
  typeof value === "string" &&
  (value === "" ||
    (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value) &&
      value.length < 1_500_000));
const isText = (value: unknown): value is string =>
  typeof value === "string" && value.length <= 12000;
export function videoUrl(value: string): string | undefined {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase();
    const pageHost = ["youtube.com", "youtu.be", "vimeo.com"].some(
      (domain) => host === domain || host.endsWith(`.${domain}`),
    );
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !pageHost
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}
export function parsePreviewDraft(raw: string | null): PreviewDraft | null {
  if (!raw || raw.length > MAX_ISSUE_BYTES) return null;
  try {
    const d = JSON.parse(raw);
    if (
      !d ||
      !isText(d.caption) ||
      !isImage(d.cover) ||
      (d.theme !== undefined && d.theme !== "surreal" && d.theme !== "museum")
    )
      return null;
    const theme: IssueTheme = d.theme ?? "surreal";
    if (d.version === 1) {
      if (
        ![d.artTitle, d.artAuthor, d.artCaption, d.artAlt].every(isText) ||
        !isImage(d.artwork) ||
        !Array.isArray(d.poems) ||
        d.poems.length !== 2 ||
        !d.poems.every(
          (p: { title: string; author: string; text: string }) =>
            p && [p.title, p.author, p.text].every(isText),
        )
      )
        return null;
      return {
        version: 2,
        theme,
        caption: d.caption,
        cover: d.cover,
        pieces: [
          ...d.poems.map(
            (
              p: { title: string; author: string; text: string },
              i: number,
            ) => ({
              ...createPreviewPiece("poem", `preview-poem-${i + 1}`),
              title: p.title,
              author: p.author,
              text: p.text,
            }),
          ),
          ...(d.artwork
            ? [
                {
                  ...createPreviewPiece("art", "preview-art"),
                  title: d.artTitle,
                  author: d.artAuthor,
                  image: d.artwork,
                  caption: d.artCaption,
                  alt: d.artAlt,
                },
              ]
            : []),
        ],
      };
    }
    if (
      d.version !== 2 ||
      !Array.isArray(d.pieces) ||
      d.pieces.length > MAX_PIECES
    )
      return null;
    const ids = new Set<string>();
    const pieces: PreviewPiece[] = [];
    for (const p of d.pieces) {
      if (
        !p ||
        typeof p.id !== "string" ||
        !/^preview-[a-zA-Z0-9-]{1,100}$/.test(p.id) ||
        ids.has(p.id) ||
        !["poem", "art", "film"].includes(p.type) ||
        ![p.title, p.author, p.text, p.caption, p.alt, p.video].every(isText) ||
        !isImage(p.image)
      )
        return null;
      ids.add(p.id);
      pieces.push({
        id: p.id,
        type: p.type,
        title: p.title,
        author: p.author,
        text: p.text,
        image: p.image,
        caption: p.caption,
        alt: p.alt,
        video: p.video,
      });
    }
    return { version: 2, theme, caption: d.caption, cover: d.cover, pieces };
  } catch {
    return null;
  }
}
export function previewPublication(draft: PreviewDraft): Publication {
  return {
    id: PREVIEW_ID,
    theme: draft.theme,
    caption: draft.caption.trim() || "My issue",
    glow: "green",
    coverSrc: draft.cover || undefined,
    coverAlt: draft.caption.trim() || "Issue cover",
    pieces: draft.pieces.flatMap((p): Piece[] => {
      const base = {
        id: p.id,
        title: p.title.trim() || "Untitled",
        author: p.author.trim() || "Anonymous",
        glow: "green" as const,
      };
      if (p.type === "poem" && p.text.trim())
        return [
          {
            ...base,
            type: "poem",
            lines: p.text.split(/\r?\n/),
            editorArtCaption: "",
          },
        ];
      if (p.type === "art" && p.image)
        return [
          {
            ...base,
            type: "art",
            imageSrc: p.image,
            imageAlt: p.alt.trim() || undefined,
            imageCaption: p.caption.trim(),
          },
        ];
      const url = p.type === "film" ? videoUrl(p.video) : undefined;
      return url
        ? [{ ...base, type: "film", videoSrc: url, logline: p.caption.trim() }]
        : [];
    }),
  };
}
