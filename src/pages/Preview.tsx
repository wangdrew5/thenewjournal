import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import SaveStatus from "../components/SaveStatus";
import { Link, useNavigate } from "react-router-dom";
import { useJournal } from "../lib/useJournal";
import {
  createPreviewDraft,
  createPreviewPiece,
  parsePreviewDraft,
  leftOut,
  mediaUrl,
  svgProblem,
  isLocalAudio,
  isPublicationId,
  MAX_AUDIO_BYTES,
  PREVIEW_KEY,
  previewPublication,
  videoUrl,
  audioUrlProblem,
  PREVIEW_ID,
  MAX_IMAGE_BYTES,
  MAX_ISSUE_BYTES,
  MAX_PIECES,
  type PreviewDraft,
  type PreviewPiece,
} from "../lib/preview";
import type { PieceType } from "../data/publications";
import PoemView from "../components/pieces/PoemView";
import ArtView from "../components/pieces/ArtView";
import FilmView from "../components/pieces/FilmView";
import SongView from "../components/pieces/SongView";
import { matchesPublished, publishedDrafts } from "../data/publishedIssues";
import { suggestPublicationId } from "../lib/publish";

// The dev server's publishing endpoints (scripts/publish-plugin.ts).
async function devRequest(path: string, body: BodyInit, type = "application/json") {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": type, "X-TNJ-Publish": "1" },
      body,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await response.json().catch(() => ({}));
    return response.ok
      ? { ok: true as const, data }
      : { ok: false as const, error: String(data.error ?? `The dev server answered ${response.status}.`) };
  } catch {
    return { ok: false as const, error: "Could not reach the dev server. Is npm run dev still running?" };
  }
}


const typeLabel: Record<PieceType, string> = {
  poem: "Writing",
  art: "Artwork",
  film: "Film",
  song: "Song",
};
export default function Preview() {
  const reduced = useReducedMotion();
  const journal = useJournal();
  const draft = journal.draft ?? createPreviewDraft();
  const publication = previewPublication(draft);
  const navigate = useNavigate();
  const readyIds = new Set(publication.pieces.map((p) => p.id));
  const [editing, setEditing] = useState<string | null>(null);
  const piece = draft.pieces.find((p) => p.id === editing) ?? draft.pieces[0];
  const displayed = publication.pieces.find((p) => p.id === piece?.id);
  const index = draft.pieces.findIndex((p) => p.id === piece?.id);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resetting, setResetting] = useState(false);
  const [replacement, setReplacement] = useState<PreviewDraft | null>(null);
  const [removed, setRemoved] = useState<{
    piece: PreviewPiece;
    index: number;
  } | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const addRef = useRef<HTMLFieldSetElement>(null);
  const contentsRef = useRef<HTMLOListElement>(null);
  const focusNew = useRef(false);
  useEffect(() => {
    if (focusNew.current) {
      (titleRef.current ?? addRef.current?.querySelector("button"))?.focus();
      focusNew.current = false;
    }
  }, [editing]);
  useEffect(() => {
    const list = contentsRef.current;
    const active = list?.querySelector('[aria-current="true"]');
    if (!list || !active) return;
    const bounds = list.getBoundingClientRect();
    const item = active.getBoundingClientRect();
    const shift =
      item.top < bounds.top
        ? item.top - bounds.top
        : item.bottom > bounds.bottom
          ? item.bottom - bounds.bottom
          : 0;
    if (shift)
      list.scrollTo({
        top: list.scrollTop + shift,
        behavior: reduced ? "instant" : "smooth",
      });
  }, [piece?.id, index, reduced]);
  function replace(next: PreviewDraft) {
    journal.updateDraft(next);
    setEditing(next.pieces[0]?.id ?? null);
    setError("");
    setNotice("Issue loaded. You can edit it or add another piece.");
    setReplacement(null);
    setRemoved(null);
  }
  function requestReplace(next: PreviewDraft) {
    if (journal.draft) setReplacement(next);
    else replace(next);
  }
  function add(type: PieceType) {
    const next = createPreviewPiece(type, `preview-${crypto.randomUUID()}`);
    journal.addPiece(next);
    focusNew.current = true;
    setEditing(next.id);
    setError("");
    setNotice(`${typeLabel[type]} added. Fill in the details below.`);
  }
  async function image(event: ChangeEvent<HTMLInputElement>, pieceId?: string) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Choose an image under 1 MB so the browser can save it.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (pieceId)
        journal.updatePiece(pieceId, { image: String(reader.result) });
      else journal.updateDraft({ cover: String(reader.result) });
      setError("");
    };
    reader.onerror = () =>
      setError("That image could not be opened. Try another file.");
    reader.readAsDataURL(file);
  }
  async function signature(event: ChangeEvent<HTMLInputElement>, pieceId: string) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.type !== "image/svg+xml" && !/\.svg$/i.test(file.name)) {
      setError("Choose an SVG file for the signature.");
      return;
    }
    const text = await file.text().catch(() => "");
    const problem = svgProblem(text);
    if (problem) {
      setError(problem);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      journal.updatePiece(pieceId, { signature: String(reader.result) });
      setError("");
    };
    reader.onerror = () => setError("That signature could not be opened. Try another file.");
    reader.readAsDataURL(new Blob([text], { type: "image/svg+xml" }));
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(draft)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "my-journal-issue.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(
      "Issue file prepared. Use Restore issue to open this copy later.",
    );
  }
  async function restore(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_ISSUE_BYTES) {
      setError("That issue file is too large. Choose one under 8 MB.");
      return;
    }
    try {
      const next = parsePreviewDraft(await file.text());
      if (!next) {
        setError(
          "That file is not a supported journal issue. Choose a downloaded issue file.",
        );
        return;
      }
      setError("");
      requestReplace(next);
    } catch {
      setError("That issue file could not be opened. Try again.");
    }
  }
  function remove() {
    if (!piece) return;
    focusNew.current = true;
    setRemoved({ piece, index });
    journal.removePiece(piece.id);
    setEditing(
      draft.pieces[index + 1]?.id ?? draft.pieces[index - 1]?.id ?? null,
    );
    setNotice("Piece removed. You can undo this below.");
  }
  function update(update: Partial<PreviewPiece>) {
    if (piece) journal.updatePiece(piece.id, update);
  }

  // ---------- Publishing (dev only, like the rest of the editor) ----------
  const [published, setPublished] = useState(
    () => new Map(publishedDrafts.map(({ id, draft }) => [id, draft])),
  );
  const suggestedId = suggestPublicationId(draft, new Set(published.keys()));
  const targetId = draft.publicationId || suggestedId;
  const live = draft.publicationId ? published.get(draft.publicationId) : undefined;
  const publishState = !live
    ? "Not published yet"
    : matchesPublished(draft, [{ id: draft.publicationId, draft: live }])
      ? "Published"
      : "Unpublished changes";
  const [publishStep, setPublishStep] = useState<"idle" | "confirm" | "working">("idle");
  const [report, setReport] = useState<{ id: string; written: string[]; removed: string[] } | null>(null);
  const [commitStep, setCommitStep] = useState<"idle" | "confirm" | "working">("idle");
  const [gitResult, setGitResult] = useState<{ ok: boolean; output: string } | null>(null);
  const [unpublishing, setUnpublishing] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const omitted = publishStep === "confirm" ? leftOut(draft) : [];
  const opened = useRef(false);
  useEffect(() => {
    // With no draft in this browser, start from the newest published issue, so work can
    // continue on another computer.
    if (opened.current) return;
    opened.current = true;
    const newest = publishedDrafts[0];
    if (!journal.draft && newest) {
      journal.updateDraft(newest.draft);
      setEditing(newest.draft.pieces[0]?.id ?? null);
      setNotice(`Opened the published issue “${newest.draft.caption}” to keep editing.`);
    }
  }, [journal]);
  function requestPublish() {
    if (!isPublicationId(targetId)) {
      setError("Choose a web address of lowercase letters, numbers, and hyphens (not starting or ending with a hyphen).");
      return;
    }
    setError("");
    setReport(null);
    setPublishStep("confirm");
  }
  async function publish() {
    setPublishStep("working");
    const result = await devRequest("/__publish", JSON.stringify({ id: targetId, draft }));
    setPublishStep("idle");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const issue = result.data.issue as PreviewDraft;
    journal.updateDraft(issue);
    try {
      localStorage.setItem(PREVIEW_KEY, JSON.stringify(issue));
    } catch {
      /* Autosave will retry. */
    }
    setPublished((m) => new Map(m).set(targetId, issue));
    setReport({ id: targetId, written: result.data.written, removed: result.data.removed });
    setGitResult(null);
  }
  async function unpublish(id: string) {
    setUnpublishing(null);
    const result = await devRequest("/__publish/unpublish", JSON.stringify({ id }));
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPublished((m) => {
      const next = new Map(m);
      next.delete(id);
      return next;
    });
    setReport({ id, written: [], removed: result.data.removed });
    setNotice(`Removed /publication/${id} from the site files. Commit and push to take it offline.`);
  }
  async function commitAndPush() {
    setCommitStep("working");
    const result = await devRequest("/__publish/commit", "{}");
    setCommitStep("idle");
    setGitResult(
      result.ok
        ? { ok: !!result.data.ok, output: String(result.data.output ?? "") }
        : { ok: false, output: result.error },
    );
  }
  async function uploadAudio(event: ChangeEvent<HTMLInputElement>, pieceId: string) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_AUDIO_BYTES) {
      setError("Choose an audio file under 20 MB.");
      return;
    }
    setUploading(true);
    setError("");
    const result = await devRequest(
      `/__publish/audio?piece=${encodeURIComponent(pieceId)}`,
      file,
      "application/octet-stream",
    );
    setUploading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    journal.updatePiece(pieceId, { audio: String(result.data.path) });
    setNotice(`Added “${file.name}”. It is saved with the project when you publish.`);
  }
  return (
    <main className="preview-page mx-auto max-w-6xl px-6 pb-24 sm:px-10">
      <Link to="/" className="back-link">
        ← All issues
      </Link>
      <header className="preview-heading">
        <h1 className="font-display text-glow-white">Make an issue</h1>
        <p>
          Add your writing, artwork, films, and songs. Read them together in
          the journal.
        </p>
        {replacement && (
          <div
            className="preview-reset"
            role="group"
            aria-label="Replace current issue"
          >
            <p>
              Replace your current issue? Download a copy first if you want to
              keep it.
            </p>
            <button type="button" onClick={download}>
              Download current issue
            </button>
            <button type="button" onClick={() => replace(replacement)}>
              Replace issue
            </button>
            <button type="button" onClick={() => setReplacement(null)}>
              Keep editing
            </button>
          </div>
        )}
      </header>
      <div className="preview-workspace">
        <section
          id="preview-editor"
          className="preview-editor"
          aria-label="Edit your issue"
        >
          <label className="preview-field">
            Issue title
            <input
              maxLength={120}
              value={draft.caption}
              onChange={(e) => journal.updateDraft({ caption: e.target.value })}
            />
          </label>
          <label className="preview-field">
            Issue number (optional)
            <input
              maxLength={12}
              placeholder="01"
              value={draft.issueNumber}
              onChange={(e) => journal.updateDraft({ issueNumber: e.target.value })}
            />
          </label>
          <label className="preview-field">
            Web address
            <input
              maxLength={60}
              placeholder={suggestedId}
              value={draft.publicationId}
              aria-invalid={!!draft.publicationId && !isPublicationId(draft.publicationId)}
              aria-describedby="publication-id-help"
              onChange={(e) =>
                journal.updateDraft({
                  publicationId: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
                })
              }
            />
            <span id="publication-id-help" className="preview-help">
              Readers find this issue at /publication/{targetId}. Keep the
              address to update the issue; use a new one to publish another.
            </span>
          </label>
          <fieldset className="preview-theme-picker">
            <legend>Issue design</legend>
            {(["surreal", "museum"] as const).map((theme) => (
              <label
                key={theme}
                className={`theme-choice theme-choice-${theme}`}
              >
                <input
                  type="radio"
                  name="issue-theme"
                  value={theme}
                  checked={draft.theme === theme}
                  onChange={() => journal.updateDraft({ theme })}
                />
                <span>
                  {theme === "surreal" ? "Surreal" : "Gallery"}
                  <small>
                    {theme === "surreal"
                      ? "Dreamscapes · Page-flip magazine"
                      : "White gallery walls · Carousel"}
                  </small>
                </span>
              </label>
            ))}
          </fieldset>
          <fieldset ref={addRef} className="preview-add">
            <legend>Add a piece</legend>
            {(["poem", "art", "film", "song"] as const).map((type) => (
              <motion.button
                whileHover={reduced ? undefined : { y: -2 }}
                whileTap={reduced ? undefined : { scale: 0.96 }}
                transition={{ type: "spring", stiffness: 420, damping: 26 }}
                key={type}
                type="button"
                disabled={draft.pieces.length >= MAX_PIECES}
                onClick={() => add(type)}
              >
                <span className="add-piece-plus" aria-hidden="true">
                  ＋
                </span>{" "}
                {typeLabel[type]}
              </motion.button>
            ))}
          </fieldset>
          {draft.pieces.length >= MAX_PIECES && (
            <p className="preview-help">
              This issue has 200 pieces. Download it before starting another.
            </p>
          )}
          {draft.pieces.length > 0 && (
            <nav className="preview-contents" aria-label="Your issue contents">
              <p>
                {draft.pieces.length}{" "}
                {draft.pieces.length === 1 ? "piece" : "pieces"} in this issue
              </p>
              <motion.ol ref={contentsRef} layoutScroll>
                <AnimatePresence initial={false} mode="popLayout">
                  {draft.pieces.map((p, i) => (
                    <motion.li
                      key={p.id}
                      layout={reduced ? false : "position"}
                      initial={{ opacity: 0, x: reduced ? 0 : -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{
                        opacity: 0,
                        x: reduced ? 0 : 12,
                        pointerEvents: "none",
                      }}
                      transition={{ duration: reduced ? 0 : 0.22 }}
                    >
                      <button
                        type="button"
                        aria-current={p.id === piece?.id ? "true" : undefined}
                        onClick={() => {
                          setEditing(p.id);
                          setError("");
                        }}
                      >
                        {p.id === piece?.id && (
                          <motion.span
                            className="preview-selection"
                            layoutId={reduced ? undefined : "editor-selection"}
                            aria-hidden="true"
                            transition={{
                              type: "spring",
                              stiffness: 450,
                              damping: 36,
                              duration: reduced ? 0 : undefined,
                            }}
                          />
                        )}
                        <span className="preview-piece-number">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="preview-piece-name">
                          {p.title.trim() ||
                            `Untitled ${typeLabel[p.type].toLowerCase()}`}
                          <small>
                            {typeLabel[p.type]}
                            {readyIds.has(p.id) ? "" : " · Draft"}
                          </small>
                        </span>
                        <span aria-hidden="true">→</span>
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </motion.ol>
            </nav>
          )}
          {piece ? (
            <motion.div
              className="preview-piece-editor"
              key={piece.id}
              initial={{ opacity: reduced ? 1 : 0.65, y: reduced ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0 : 0.18 }}
            >
              <div className="preview-edit-label">
                <span>Editing {typeLabel[piece.type].toLowerCase()}</span>
                <span>
                  {index + 1} / {draft.pieces.length}
                </span>
              </div>
              <label className="preview-field">
                Title
                <input
                  ref={titleRef}
                  maxLength={120}
                  placeholder="Give this piece a title"
                  value={piece.title}
                  onChange={(e) => update({ title: e.target.value })}
                />
              </label>
              <label className="preview-field">
                {piece.type === "art"
                  ? "Artist"
                  : piece.type === "song"
                    ? "Artist or performer"
                    : "Author"}
                <input
                  maxLength={120}
                  placeholder="Name, initials, or Anonymous"
                  value={piece.author}
                  onChange={(e) => update({ author: e.target.value })}
                />
              </label>
              {piece.type === "poem" && (
                <label className="preview-field">
                  Writing
                  <textarea
                    rows={12}
                    maxLength={12000}
                    placeholder="Paste or write your piece here…"
                    value={piece.text}
                    onChange={(e) => update({ text: e.target.value })}
                  />
                  <span className="preview-help">
                    Line breaks and blank lines stay as you wrote them.
                  </span>
                </label>
              )}
              {piece.type === "art" && (
                <>
                  <div className="preview-image-control">
                    <label className="preview-file">
                      {piece.image ? "Change artwork" : "Choose artwork"}
                      <input
                        aria-label="Choose artwork image"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => image(e, piece.id)}
                      />
                    </label>
                    {piece.image && (
                      <button
                        type="button"
                        onClick={() => update({ image: "" })}
                      >
                        Remove image
                      </button>
                    )}
                  </div>
                  <p className="preview-help">JPG, PNG, or WebP, under 1 MB.</p>
                  <div className="preview-image-control">
                    <label className="preview-file">
                      {piece.signature ? "Change signature" : "Choose artist’s signature"}
                      <input
                        aria-label="Choose artist’s signature SVG"
                        type="file"
                        accept="image/svg+xml,.svg"
                        onChange={(e) => signature(e, piece.id)}
                      />
                    </label>
                    {piece.signature && (
                      <>
                        <img
                          className="preview-signature"
                          src={mediaUrl(piece.signature)}
                          alt="Signature preview"
                        />
                        <button type="button" onClick={() => update({ signature: "" })}>
                          Remove signature
                        </button>
                      </>
                    )}
                  </div>
                  <p className="preview-help">
                    An SVG, under 200 KB. It appears on the right page directly below the text.
                  </p>
                  <label className="preview-field">
                    Describe the image
                    <textarea
                      rows={3}
                      maxLength={1000}
                      value={piece.alt}
                      onChange={(e) => update({ alt: e.target.value })}
                    />
                    <span className="preview-help">
                      For readers using a screen reader.
                    </span>
                  </label>
                </>
              )}
              {piece.type === "film" && (
                <label className="preview-field">
                  Video link
                  <input
                    type="url"
                    maxLength={2000}
                    placeholder="https://…/your-film.mp4"
                    value={piece.video}
                    aria-invalid={
                      !!piece.video.trim() && !videoUrl(piece.video)
                    }
                    onChange={(e) => update({ video: e.target.value })}
                  />
                  <span className="preview-help">
                    Paste an HTTPS link directly to an MP4 or WebM video.
                    YouTube and Vimeo page links cannot play here.
                  </span>
                  {piece.video.trim() && !videoUrl(piece.video) && (
                    <span className="preview-error">
                      Use a direct HTTPS video file link, rather than a YouTube
                      or Vimeo page.
                    </span>
                  )}
                </label>
              )}
              {piece.type === "song" && (
                <>
                  <div className="preview-image-control">
                    <label className="preview-file">
                      {uploading
                        ? "Adding audio…"
                        : isLocalAudio(piece.audio)
                          ? "Change audio file"
                          : "Choose audio file"}
                      <input
                        aria-label="Choose song audio file"
                        type="file"
                        accept=".mp3,.m4a,.wav,audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/x-wav"
                        disabled={uploading}
                        onChange={(e) => uploadAudio(e, piece.id)}
                      />
                    </label>
                    {isLocalAudio(piece.audio) && (
                      <button type="button" onClick={() => update({ audio: "" })}>
                        Remove audio
                      </button>
                    )}
                  </div>
                  <p className="preview-help">
                    MP3, M4A, or WAV, up to 20 MB. The file is kept with the
                    project (not in this browser) and goes online when you publish.
                  </p>
                  {isLocalAudio(piece.audio) ? (
                    <p className="preview-help">
                      Using the file{" "}
                      <strong>{piece.audio.slice(piece.audio.lastIndexOf("/") + 1)}</strong>.
                    </p>
                  ) : (
                    <label className="preview-field">
                      Or an audio link
                      <input
                        type="url"
                        maxLength={2000}
                        placeholder="https://…/your-song.mp3"
                        value={piece.audio}
                        aria-invalid={!!audioUrlProblem(piece.audio)}
                        aria-describedby="song-audio-help"
                        onChange={(e) => update({ audio: e.target.value })}
                      />
                      <span id="song-audio-help" className="preview-help">
                        Paste an HTTPS link directly to an audio file, such as
                        an MP3, M4A, OGG, or WAV. Spotify, Apple Music,
                        SoundCloud, and other streaming pages are not audio
                        files and cannot play here. Signed links with ?query
                        details are fine.
                      </span>
                      {audioUrlProblem(piece.audio) && (
                        <span className="preview-error">
                          {audioUrlProblem(piece.audio)}
                        </span>
                      )}
                    </label>
                  )}
                  <label className="preview-field">
                    Transcript
                    <textarea
                      rows={12}
                      maxLength={12000}
                      placeholder="Paste or write the lyrics or words here…"
                      value={piece.text}
                      onChange={(e) => update({ text: e.target.value })}
                    />
                    <span className="preview-help">
                      Line breaks and blank lines between verses stay as you
                      wrote them. Optional.
                    </span>
                  </label>
                </>
              )}
              {piece.type === "film" && (
                <label className="preview-field">
                  Description (optional)
                  <textarea
                    rows={3}
                    maxLength={2000}
                    value={piece.caption}
                    onChange={(e) => update({ caption: e.target.value })}
                  />
                </label>
              )}
              {piece.type === "art" && (
                <>
                  <label className="preview-field">
                    Caption under the artwork (optional)
                    <textarea
                      rows={3}
                      maxLength={2000}
                      value={piece.caption}
                      onChange={(e) => update({ caption: e.target.value })}
                    />
                    <span className="preview-help">
                      Printed beneath the painting on the left page.
                    </span>
                  </label>
                  <label className="preview-field">
                    Text on the right page (optional)
                    <textarea
                      rows={3}
                      maxLength={2000}
                      value={piece.pageText}
                      onChange={(e) => update({ pageText: e.target.value })}
                    />
                    <span className="preview-help">
                      Shown beside the artwork, under its title. It can differ
                      from the caption.
                    </span>
                  </label>
                </>
              )}
              <div className="preview-piece-actions">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => journal.movePiece(piece.id, -1)}
                >
                  ↑ Move up
                </button>
                <button
                  type="button"
                  disabled={index === draft.pieces.length - 1}
                  onClick={() => journal.movePiece(piece.id, 1)}
                >
                  ↓ Move down
                </button>
                <button type="button" onClick={remove}>
                  Remove piece
                </button>
              </div>
            </motion.div>
          ) : (
            <p className="preview-help">
              Start with writing, an image, a film, or a song using the buttons
              above.
            </p>
          )}
          {removed && (
            <motion.div
              key="undo"
              initial={{ opacity: 0, height: reduced ? "auto" : 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: reduced ? "auto" : 0 }}
              transition={{ duration: reduced ? 0 : 0.2 }}
              className="preview-undo"
              role="group"
              aria-label="Undo removed piece"
            >
              <p>Removed “{removed.piece.title.trim() || "Untitled"}”.</p>
              <button
                type="button"
                disabled={draft.pieces.length >= MAX_PIECES}
                onClick={() => {
                  focusNew.current = true;
                  journal.addPiece(removed.piece, removed.index);
                  setEditing(removed.piece.id);
                  setRemoved(null);
                  setNotice("Piece restored.");
                }}
              >
                Undo removal
              </button>
            </motion.div>
          )}
          {error && (
            <motion.p
              key={error}
              role="alert"
              className="preview-error"
              initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : -3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0 : 0.18 }}
            >
              {error}
            </motion.p>
          )}
          <div className="preview-actions">
            <button
              type="button"
              className="preview-open"
              disabled={!publication.pieces.length}
              onClick={() => {
                journal.startPreview();
                navigate(
                  `/publication/${PREVIEW_ID}${displayed ? `?piece=${encodeURIComponent(displayed.id)}` : ""}`,
                );
              }}
            >
              Open in reader <span aria-hidden="true">→</span>
            </button>
          </div>
          <section className="preview-publish" aria-labelledby="publish-heading">
            <h2 id="publish-heading">Publish to the site</h2>
            <p className="preview-help">
              Publishing writes this issue into the project at
              /publication/{targetId}. It goes online when you commit and push.
            </p>
            <div className="preview-actions">
              <button
                type="button"
                className="preview-open"
                disabled={!publication.pieces.length || publishStep !== "idle"}
                onClick={requestPublish}
              >
                {publishStep === "working" ? "Publishing…" : "Publish"}
              </button>
              <button
                type="button"
                disabled={commitStep !== "idle"}
                onClick={() => setCommitStep("confirm")}
              >
                {commitStep === "working" ? "Committing…" : "Commit and push"}
              </button>
            </div>
            {publishStep === "confirm" && (
              <div className="preview-reset" role="group" aria-label="Confirm publishing">
                <p>
                  Publish “{draft.caption.trim() || "My issue"}” to /publication/{targetId}?
                  {published.has(targetId) && draft.publicationId !== targetId
                    ? " This replaces the issue already published at that address."
                    : ""}
                </p>
                {omitted.length > 0 && (
                  <>
                    <p>These pieces are not ready and will be left out:</p>
                    <ul className="preview-omitted">
                      {omitted.map((p) => (
                        <li key={p.id}>
                          {p.title.trim() || `Untitled ${typeLabel[p.type].toLowerCase()}`} (
                          {p.type === "poem"
                            ? "no writing yet"
                            : p.type === "art"
                              ? "no image"
                              : p.type === "film"
                                ? "no usable video link"
                                : "no usable audio file or link"}
                          )
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <button type="button" onClick={publish}>
                  {omitted.length ? "Publish anyway" : "Publish"}
                </button>
                <button type="button" onClick={() => setPublishStep("idle")}>
                  Cancel
                </button>
              </div>
            )}
            {report && (
              <div className="preview-report" role="status">
                <p>
                  {report.written.length || report.removed.length
                    ? `Updated the files for /publication/${report.id}.`
                    : `/publication/${report.id} was already up to date.`}
                </p>
                {report.written.length > 0 && (
                  <>
                    <p>Wrote:</p>
                    <ul>
                      {report.written.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </>
                )}
                {report.removed.length > 0 && (
                  <>
                    <p>Removed:</p>
                    <ul>
                      {report.removed.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </>
                )}
                {published.has(report.id) && (
                  <a
                    className="issue-entry"
                    href={`${import.meta.env.BASE_URL}publication/${report.id}`}
                  >
                    View it on the site <span aria-hidden="true">→</span>
                  </a>
                )}
              </div>
            )}
            {commitStep === "confirm" && (
              <div className="preview-reset" role="group" aria-label="Confirm commit and push">
                <p>
                  Commit only src/data/published and public/published as
                  “Publish issue”, then push? Your other uncommitted work is
                  left alone. Pushing to main puts the site online.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCommitStep("working");
                    void commitAndPush();
                  }}
                >
                  Commit and push
                </button>
                <button type="button" onClick={() => setCommitStep("idle")}>
                  Cancel
                </button>
              </div>
            )}
            {gitResult && (
              <div className={`preview-git ${gitResult.ok ? "" : "is-error"}`} role={gitResult.ok ? "status" : "alert"}>
                <p>{gitResult.ok ? "Committed and pushed." : "Git did not finish. Its output:"}</p>
                <pre>{gitResult.output}</pre>
              </div>
            )}
            {published.size > 0 && (
              <div className="preview-published">
                <p>Published issues</p>
                <ul>
                  {[...published].map(([id, issue]) => (
                    <li key={id}>
                      <span>
                        {issue.caption || "My issue"}
                        <small>
                          {issue.issueNumber ? `No. ${issue.issueNumber} · ` : ""}/publication/{id}
                        </small>
                      </span>
                      <button type="button" onClick={() => requestReplace(issue)}>
                        Open in editor
                      </button>
                      <button type="button" onClick={() => setUnpublishing(id)}>
                        Remove from site
                      </button>
                    </li>
                  ))}
                </ul>
                {unpublishing && (
                  <div className="preview-reset" role="group" aria-label="Confirm removing an issue">
                    <p>
                      Remove /publication/{unpublishing} and its files from the
                      project? It stays online until you commit and push.
                    </p>
                    <button type="button" onClick={() => unpublish(unpublishing)}>
                      Remove from site
                    </button>
                    <button type="button" onClick={() => setUnpublishing(null)}>
                      Keep it
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
          <SaveStatus status={journal.saveStatus} />
          <p className={`preview-publish-state is-${publishState.split(" ")[0].toLowerCase()}`}>
            {publishState}
          </p>
          <p className="preview-help">
            Your edits are private to this browser.
          </p>
          <div role="status" className="preview-notice">
            <AnimatePresence initial={false} mode="wait">
              {notice && (
                <motion.p
                  key={notice}
                  className="preview-help"
                  initial={{ opacity: 0, y: reduced ? 0 : 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduced ? 0 : 0.15 }}
                >
                  {notice}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <details className="preview-options">
            <summary>Cover &amp; issue files</summary>
            <div className="preview-image-control">
              <span>Optional cover</span>
              <label className="preview-file">
                {draft.cover ? "Change cover" : "Choose cover"}
                <input
                  aria-label="Choose cover image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => image(e)}
                />
              </label>
              {draft.cover && (
                <>
                  <img
                    key={draft.cover}
                    src={mediaUrl(draft.cover)}
                    alt="Your issue cover"
                  />
                  <button
                    type="button"
                    onClick={() => journal.updateDraft({ cover: "" })}
                  >
                    Remove cover
                  </button>
                </>
              )}
            </div>
            <p className="preview-help">
              Images under 1 MB. Download an issue file to keep a copy or move
              it to another device.
            </p>
            <div className="preview-actions">
              <button
                type="button"
                disabled={!draft.pieces.length && !draft.cover}
                onClick={download}
              >
                Download issue
              </button>
              <label className="preview-file">
                Restore issue
                <input
                  aria-label="Restore downloaded issue"
                  type="file"
                  accept=".json,application/json"
                  onChange={restore}
                />
              </label>
              <button type="button" onClick={() => setResetting(true)}>
                Start over
              </button>
            </div>
          </details>
          {resetting && (
            <div className="preview-reset">
              <p>
                Clear your issue? Download a copy first if you want to keep it.
              </p>
              <button type="button" onClick={download}>
                Download issue
              </button>
              <button
                type="button"
                onClick={() => {
                  journal.resetPreview();
                  setEditing(null);
                  setResetting(false);
                  setRemoved(null);
                  setError("");
                  setNotice("");
                }}
              >
                Clear issue
              </button>
              <button type="button" onClick={() => setResetting(false)}>
                Keep editing
              </button>
            </div>
          )}
          <a className="preview-jump issue-entry" href="#live-preview">
            See live preview ↓
          </a>
        </section>
        <section
          id="live-preview"
          className={`preview-stage preview-theme-${draft.theme}`}
          aria-label="Live issue preview"
        >
          <div className="preview-stage-label">
            <span>Live preview</span>
            <span>{publication.caption}</span>
          </div>
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={`${piece?.id ?? "empty"}:${displayed ? "ready" : "draft"}`}
              initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : -5 }}
              transition={{ duration: reduced ? 0 : 0.16 }}
              className="preview-stage-content"
            >
              {displayed?.type === "poem" ? (
                <PoemView
                  key={displayed.id}
                  piece={displayed}
                  animateLines={false}
                />
              ) : displayed?.type === "art" ? (
                <ArtView key={displayed.id} piece={displayed} />
              ) : displayed?.type === "film" ? (
                <FilmView key={displayed.id} piece={displayed} />
              ) : displayed?.type === "song" ? (
                <SongView key={displayed.id} piece={displayed} />
              ) : (
                <div className="preview-empty">
                  <span aria-hidden="true">{piece ? "…" : "+"}</span>
                  <h2 className="font-display">
                    {piece
                      ? "Your piece begins here."
                      : "Your first piece goes here."}
                  </h2>
                  <p>
                    {piece?.type === "art"
                      ? "Choose an image to see your artwork."
                      : piece?.type === "film"
                        ? "Add a video link to see your film."
                        : piece?.type === "song"
                          ? "Add an audio link to hear your song."
                          : piece
                            ? "Add your writing and it will appear as you type."
                            : "Choose Writing, Artwork, Film, or Song to get started."}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          <a className="preview-jump issue-entry" href="#preview-editor">
            Back to edits ↑
          </a>
        </section>
      </div>
    </main>
  );
}
