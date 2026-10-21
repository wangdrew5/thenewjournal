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
export const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

// Published media lives under public/published/<issue id>/ and is stored in drafts and
// issue files as a path relative to the site root, so it works under any base path.
// Uploaded song files wait in a git-ignored staging folder until they are published.
const PUBLICATION_ID = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/;
const SITE_IMAGE = /^published\/[a-z0-9-]{1,60}\/images\/[A-Za-z0-9._-]{1,160}\.(png|jpe?g|webp)$/;
const SITE_SIGNATURE = /^published\/[a-z0-9-]{1,60}\/images\/[A-Za-z0-9._-]{1,160}\.svg$/;
const SITE_AUDIO = /^published\/[a-z0-9-]{1,60}\/audio\/[A-Za-z0-9._-]{1,160}\.(mp3|m4a|wav)$/;
const STAGED_AUDIO = /^__staging\/[A-Za-z0-9._-]{1,160}\.(mp3|m4a|wav)$/;
const RESERVED_IDS = new Set([PREVIEW_ID, "comedy-example", "preview", "published"]);
export const isPublicationId = (value: string) => PUBLICATION_ID.test(value) && !RESERVED_IDS.has(value);
export const isSiteImage = (value: string) => SITE_IMAGE.test(value);
export const isSiteSignature = (value: string) => SITE_SIGNATURE.test(value);
export const MAX_SIGNATURE_BYTES = 200 * 1024;
const SVG_DATA_URL = /^data:image\/svg\+xml;base64,([A-Za-z0-9+/=]+)$/;
/** Decodes an embedded SVG (`data:image/svg+xml;base64,…`) to its text; null if it is not one. */
export function decodeSvgDataUrl(value: string): { text: string; bytes: Uint8Array } | null {
  const match = SVG_DATA_URL.exec(value);
  if (!match) return null;
  try {
    const bytes = Uint8Array.from(atob(match[1]), (c) => c.charCodeAt(0));
    return { bytes, text: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    return null;
  }
}
/**
 * Why an SVG cannot be used as a signature, or null if it can. A signature is only ever
 * drawn through an <img> (which never runs scripts), but the file is also published and
 * could be opened directly, so anything active or that reaches out is refused outright.
 */
export function svgProblem(text: string): string | null {
  if (text.length > MAX_SIGNATURE_BYTES) return "That signature is over 200 KB. Export a simpler SVG.";
  if (!/<svg[\s>]/i.test(text)) return "That file is not an SVG image.";
  if (
    /<\s*(script|foreignObject|iframe|object|embed|audio|video|animate|set)\b/i.test(text) ||
    /<!(DOCTYPE|ENTITY)/i.test(text) ||
    /\son[a-z]+\s*=/i.test(text) ||
    /javascript:/i.test(text) ||
    /href\s*=\s*["']\s*[^#\s"']/i.test(text) ||
    /url\(\s*["']?\s*[^#\s"')]/i.test(text) ||
    /@import/i.test(text)
  )
    return "That SVG contains scripts or links to other files, which a signature can't use. Export a plain drawing.";
  const open = /<svg\b[^>]*>/i.exec(text)?.[0] ?? "";
  if (!/\sviewBox\s*=/i.test(open) && !(/\swidth\s*=/i.test(open) && /\sheight\s*=/i.test(open)))
    return "That SVG has no size (viewBox). Export it again with a viewBox.";
  return null;
}
export const isSiteAudio = (value: string) => SITE_AUDIO.test(value);
export const isStagedAudio = (value: string) => STAGED_AUDIO.test(value);
/** True for audio stored with the site (published or waiting to be), rather than a link. */
export const isLocalAudio = (value: string) => isSiteAudio(value) || isStagedAudio(value);
function siteBase() {
  return (typeof import.meta.env === "undefined" ? undefined : import.meta.env.BASE_URL) ?? "/";
}
/** Turns a stored media value into a URL: site paths gain the base path; links pass through. */
export function mediaUrl(value: string, base = siteBase()): string {
  if (!isSiteImage(value) && !isSiteSignature(value) && !isSiteAudio(value) && !isStagedAudio(value)) return value;
  return `${base.endsWith("/") ? base : `${base}/`}${value}`;
}
export interface PreviewPiece {
  id: string;
  type: PieceType;
  title: string;
  author: string;
  text: string;
  image: string;
  /** Art: the caption beneath the artwork. Film: the description. */
  caption: string;
  /** Art: the text on the right page. Absent from older drafts; read as the caption. */
  pageText: string;
  /** Art: an SVG signature drawn below the right-page text (embedded, or a site path once published). */
  signature: string;
  alt: string;
  video: string;
  /** Song audio: an https link or a site path. Absent from pre-song drafts; read as "". */
  audio: string;
}
export interface PreviewDraft {
  version: 2;
  theme: IssueTheme;
  caption: string;
  cover: string;
  pieces: PreviewPiece[];
  /** Optional, e.g. "01". Absent from older drafts; read as "". */
  issueNumber: string;
  /** The web address the issue is published at (/publication/<id>); "" until chosen. */
  publicationId: string;
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
    pageText: "",
    signature: "",
    alt: "",
    video: "",
    audio: "",
  };
}
export function createPreviewDraft(): PreviewDraft {
  return {
    version: 2,
    theme: "surreal",
    caption: "My issue",
    cover: "",
    pieces: [],
    issueNumber: "",
    publicationId: "",
  };
}
const isImage = (value: unknown): value is string =>
  typeof value === "string" &&
  (value === "" ||
    isSiteImage(value) ||
    (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value) &&
      value.length < 1_500_000));
const isSignature = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  if (value === "" || isSiteSignature(value)) return true;
  const svg = decodeSvgDataUrl(value);
  return svg !== null && svgProblem(svg.text) === null;
};
const isOptionalText = (value: unknown, max: number) =>
  value === undefined || (typeof value === "string" && value.length <= max);
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
// Streaming services link to their own player pages, which an <audio> element cannot play.
const STREAMING_PAGES: [test: (host: string) => boolean, name: string][] = [
  [(h) => h === "spotify.com" || h.endsWith(".spotify.com") || h === "spotify.link", "Spotify"],
  [(h) => h === "music.apple.com" || h === "itunes.apple.com", "Apple Music"],
  [(h) => h === "podcasts.apple.com", "Apple Podcasts"],
  [(h) => h === "soundcloud.com" || h.endsWith(".soundcloud.com"), "SoundCloud"],
  [(h) => ["youtube.com", "youtu.be"].some((d) => h === d || h.endsWith(`.${d}`)), "YouTube"],
  [(h) => h === "bandcamp.com" || h.endsWith(".bandcamp.com"), "Bandcamp"],
  [(h) => h === "tidal.com" || h.endsWith(".tidal.com"), "TIDAL"],
  [(h) => h === "deezer.com" || h.endsWith(".deezer.com") || h === "deezer.page.link", "Deezer"],
  [(h) => h.startsWith("music.amazon."), "Amazon Music"],
  [(h) => h === "pandora.com" || h.endsWith(".pandora.com"), "Pandora"],
  [(h) => h === "audiomack.com" || h.endsWith(".audiomack.com"), "Audiomack"],
];
/**
 * Why a song link cannot be used, in words a contributor can act on, or null when it is
 * acceptable (or still empty). Query strings are allowed, so signed links work. A valid
 * link is not proof of playable audio: the players report playback failures separately.
 */
export function audioUrlProblem(value: string): string | null {
  const text = value.trim();
  if (!text) return null;
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return "Enter the full link to the audio file, starting with https://.";
  }
  if (url.protocol !== "https:")
    return url.protocol === "http:"
      ? "Use a secure link that starts with https://."
      : "Use a web link to the audio file that starts with https://.";
  if (url.username || url.password)
    return "Remove the username and password from the link.";
  const service = STREAMING_PAGES.find(([test]) => test(url.hostname.toLowerCase()))?.[1];
  if (service)
    return `That is a ${service} page, not an audio file. Use a direct link to the file itself, such as one ending in .mp3.`;
  return null;
}
export function audioUrl(value: string): string | undefined {
  const text = value.trim();
  return text && audioUrlProblem(text) === null ? new URL(text).href : undefined;
}
export function parsePreviewDraft(raw: string | null): PreviewDraft | null {
  if (!raw || raw.length > MAX_ISSUE_BYTES) return null;
  try {
    const d = JSON.parse(raw);
    if (
      !d ||
      !isText(d.caption) ||
      !isImage(d.cover) ||
      (d.theme !== undefined && d.theme !== "surreal" && d.theme !== "museum") ||
      !isOptionalText(d.issueNumber, 12) ||
      // Loose on purpose: a half-typed address must still save and reload. Publishing
      // checks it strictly (isPublicationId).
      (d.publicationId !== undefined &&
        (typeof d.publicationId !== "string" || !/^[a-z0-9-]{0,60}$/.test(d.publicationId)))
    )
      return null;
    const theme: IssueTheme = d.theme ?? "surreal";
    const issueNumber: string = d.issueNumber ?? "";
    const publicationId: string = d.publicationId ?? "";
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
                  pageText: d.artCaption,
                  alt: d.artAlt,
                },
              ]
            : []),
        ],
        issueNumber,
        publicationId,
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
        !["poem", "art", "film", "song"].includes(p.type) ||
        ![p.title, p.author, p.text, p.caption, p.alt, p.video].every(isText) ||
        (p.audio !== undefined && !isText(p.audio)) ||
        (p.pageText !== undefined && !isText(p.pageText)) ||
        (p.signature !== undefined && !isSignature(p.signature)) ||
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
        // Drafts from before the two art texts were split showed one caption in both places.
        pageText: p.pageText ?? (p.type === "art" ? p.caption : ""),
        signature: p.signature ?? "",
        alt: p.alt,
        video: p.video,
        audio: p.audio ?? "",
      });
    }
    return { version: 2, theme, caption: d.caption, cover: d.cover, pieces, issueNumber, publicationId };
  } catch {
    return null;
  }
}
/**
 * The issue a draft becomes. Pieces missing their medium (empty writing, artwork without
 * an image, a film or song without a usable link or file) are left out; see `leftOut`.
 * `id` is the issue's public address; `base` prefixes site paths (GitHub Pages serves the
 * site from a sub-path).
 */
export function previewPublication(
  draft: PreviewDraft,
  { id = PREVIEW_ID, base = siteBase() }: { id?: string; base?: string } = {},
): Publication {
  return {
    id,
    theme: draft.theme,
    caption: draft.caption.trim() || "My issue",
    issueNumber: draft.issueNumber.trim() || undefined,
    glow: "green",
    coverSrc: draft.cover ? mediaUrl(draft.cover, base) : undefined,
    coverAlt: draft.caption.trim() || "Issue cover",
    pieces: draft.pieces.flatMap((p): Piece[] => {
      const common = {
        id: p.id,
        title: p.title.trim() || "Untitled",
        author: p.author.trim() || "Anonymous",
        glow: "green" as const,
      };
      // Every medium is handled by name, so none can fall through to another's rendering.
      switch (p.type) {
        case "poem":
          return p.text.trim()
            ? [{ ...common, type: "poem", lines: p.text.split(/\r?\n/), editorArtCaption: "" }]
            : [];
        case "art":
          return p.image
            ? [
                {
                  ...common,
                  type: "art",
                  imageSrc: mediaUrl(p.image, base),
                  imageAlt: p.alt.trim() || undefined,
                  imageCaption: p.caption.trim(),
                  pageText: p.pageText.trim(),
                  signatureSrc: p.signature ? mediaUrl(p.signature, base) : undefined,
                },
              ]
            : [];
        case "film": {
          const url = videoUrl(p.video);
          return url ? [{ ...common, type: "film", videoSrc: url, logline: p.caption.trim() }] : [];
        }
        case "song": {
          const url = isLocalAudio(p.audio) ? mediaUrl(p.audio, base) : audioUrl(p.audio);
          return url
            ? [
                {
                  ...common,
                  type: "song",
                  audioSrc: url,
                  transcript: p.text.trim() ? p.text.split(/\r?\n/) : [],
                },
              ]
            : [];
        }
      }
    }),
  };
}
/** Draft pieces that would not appear in the issue, so publishing can say so first. */
export function leftOut(draft: PreviewDraft): PreviewPiece[] {
  const kept = new Set(previewPublication(draft).pieces.map((p) => p.id));
  return draft.pieces.filter((p) => !kept.has(p.id));
}
