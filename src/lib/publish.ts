import { decodeSvgDataUrl, isSiteAudio, isSiteImage, isSiteSignature, isStagedAudio, svgProblem, type PreviewDraft } from "./preview";

/** A media file to write, at a path relative to `public/` (and to the site root). */
export interface MediaFile {
  path: string;
  bytes: Uint8Array;
}
/** Reads a site path (`published/…`) or a staged upload (`__staging/…`); null if missing. */
export type LoadMedia = (value: string) => Promise<Uint8Array | null>;
export type Hash = (bytes: Uint8Array) => string;

export class PublishError extends Error {}

const IMAGE_TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

function decodeImage(value: string) {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(value);
  if (!match) return null;
  const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
  return { bytes, ext: IMAGE_TYPES[match[1]] };
}

/**
 * Turns a draft into the issue file the site reads plus the media files it needs, without
 * touching the disk. Embedded images and uploaded songs become files under
 * `published/<id>/`; file names carry a content hash so a changed file never reuses a
 * cached name. Links (https) stay links, and piece IDs are kept, because bookmarks use them.
 * Publishing an already-published issue again yields the same paths and files.
 */
export async function publishDraft(
  draft: PreviewDraft,
  id: string,
  load: LoadMedia,
  hash: Hash,
): Promise<{ issue: PreviewDraft; files: MediaFile[] }> {
  const files = new Map<string, Uint8Array>();
  const place = async (value: string, slot: string, folder: "images" | "audio") => {
    if (!value) return value;
    let file: { bytes: Uint8Array; ext: string } | null = null;
    if (folder === "images") {
      file = decodeImage(value);
      const svg = decodeSvgDataUrl(value);
      if (svg) file = { bytes: svg.bytes, ext: "svg" };
    }
    const stored = folder === "images" ? isSiteImage(value) || isSiteSignature(value) : isSiteAudio(value) || isStagedAudio(value);
    if (!file && stored) {
      const bytes = await load(value);
      if (!bytes) throw new PublishError(`A file this issue uses is missing: ${value}`);
      file = { bytes, ext: value.slice(value.lastIndexOf(".") + 1) };
    }
    if (file?.ext === "svg" && svgProblem(new TextDecoder().decode(file.bytes)))
      throw new PublishError("A signature in this issue is not a plain SVG, so nothing was published.");
    if (!file) return value;
    const path = `published/${id}/${folder}/${slot}-${hash(file.bytes)}.${file.ext}`;
    files.set(path, file.bytes);
    return path;
  };
  const cover = await place(draft.cover, "cover", "images");
  const pieces = [];
  for (const p of draft.pieces)
    pieces.push({
      ...p,
      image: await place(p.image, p.id, "images"),
      signature: await place(p.signature, `${p.id}-signature`, "images"),
      audio: p.type === "song" ? await place(p.audio, p.id, "audio") : p.audio,
    });
  const issue: PreviewDraft = { ...draft, cover, pieces, publicationId: id };
  return { issue, files: [...files].map(([path, bytes]) => ({ path, bytes })) };
}

/** Suggests a web address for an issue that has none yet. */
export function suggestPublicationId(draft: PreviewDraft, taken: Set<string>) {
  const from = draft.issueNumber.trim()
    ? `issue-${draft.issueNumber.trim()}`
    : draft.caption.trim() || "issue";
  const slug =
    from
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "issue";
  let candidate = slug;
  for (let n = 2; taken.has(candidate); n++) candidate = `${slug}-${n}`;
  return candidate;
}
