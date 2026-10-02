import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import SaveStatus from "../components/SaveStatus";
import { Link, useNavigate } from "react-router-dom";
import { useJournal } from "../lib/useJournal";
import {
  createPreviewDraft,
  createPreviewPiece,
  createComedyDraft,
  parsePreviewDraft,
  previewPublication,
  videoUrl,
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

const typeLabel: Record<PieceType, string> = {
  poem: "Writing",
  art: "Artwork",
  film: "Film",
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
  return (
    <main className="preview-page mx-auto max-w-6xl px-6 pb-24 sm:px-10">
      <Link to="/" className="back-link">
        ← All issues
      </Link>
      <header className="preview-heading">
        <h1 className="font-display text-glow-white">Make an issue</h1>
        <p>
          Add your writing, artwork, and films. Read them together in the
          journal.
        </p>
        <button
          type="button"
          className="issue-entry"
          onClick={() => requestReplace(createComedyDraft())}
        >
          Use comedy example <span aria-hidden="true">→</span>
        </button>
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
            {(["poem", "art", "film"] as const).map((type) => (
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
                {piece.type === "art" ? "Artist" : "Author"}
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
              {piece.type !== "poem" && (
                <label className="preview-field">
                  {piece.type === "film"
                    ? "Description (optional)"
                    : "Caption (optional)"}
                  <textarea
                    rows={3}
                    maxLength={2000}
                    value={piece.caption}
                    onChange={(e) => update({ caption: e.target.value })}
                  />
                </label>
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
              Start with writing, an image, or a film using the buttons above.
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
          <SaveStatus status={journal.saveStatus} />
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
                    src={draft.cover}
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
                        : piece
                          ? "Add your writing and it will appear as you type."
                          : "Choose Writing, Artwork, or Film to get started."}
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
