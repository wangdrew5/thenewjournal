import assert from "node:assert/strict";
import { createServer } from "vite";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { createHash } from "node:crypto";

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const m = await server.ssrLoadModule("/src/lib/preview.ts");
  const { draftReducer } = await server.ssrLoadModule("/src/lib/draftState.ts");
  const image = "data:image/png;base64,iVBORw0KGgo=";
  const old = {
    version: 1,
    caption: "Old issue",
    cover: image,
    poems: [
      { title: "First", author: "A", text: "One\n\nTwo" },
      { title: "Second", author: "B", text: "Three" },
    ],
    artwork: image,
    artTitle: "Window",
    artAuthor: "C",
    artCaption: "Evening",
    artAlt: "A lit window",
  };
  const migrated = m.parsePreviewDraft(JSON.stringify(old));
  assert.equal(migrated.version, 2);
  assert.deepEqual(
    migrated.pieces.map((p) => p.id),
    ["preview-poem-1", "preview-poem-2", "preview-art"],
  );
  assert.deepEqual(m.previewPublication(migrated).pieces[0].lines, [
    "One",
    "",
    "Two",
  ]);
  assert.equal(migrated.pieces[2].alt, old.artAlt);
  assert.deepEqual(m.parsePreviewDraft(JSON.stringify(migrated)), migrated);
  assert.equal(m.parsePreviewDraft("{"), null);
  assert.equal(
    m.parsePreviewDraft(
      JSON.stringify({
        ...migrated,
        pieces: [...migrated.pieces, migrated.pieces[0]],
      }),
    ),
    null,
  );
  assert.equal(
    m.parsePreviewDraft(
      JSON.stringify({
        ...migrated,
        cover: "data:image/svg+xml;base64,PHN2Zz4=",
      }),
    ),
    null,
  );
  assert.equal(
    m.parsePreviewDraft(JSON.stringify({ ...migrated, pieces: [null] })),
    null,
  );
  assert.equal(m.videoUrl("javascript:alert(1)"), undefined);
  assert.equal(m.videoUrl("https://youtube.com/watch?v=1"), undefined);
  assert.equal(
    m.videoUrl("https://example.com/video.webm?token=test"),
    "https://example.com/video.webm?token=test",
  );
  // The two art texts are separate; drafts from before the split show their one caption in both.
  {
    const art = { ...m.createPreviewPiece("art", "preview-split"), title: "Split", image, caption: "Under the painting", pageText: "On the page" };
    const shown = m.previewPublication({ ...m.createPreviewDraft(), pieces: [art] }).pieces[0];
    assert.equal(shown.imageCaption, "Under the painting");
    assert.equal(shown.pageText, "On the page");
    const { pageText: _unused, ...oldPiece } = art;
    const old = m.parsePreviewDraft(JSON.stringify({ ...m.createPreviewDraft(), pieces: [oldPiece] }));
    assert.equal(old.pieces[0].pageText, "Under the painting");
    assert.equal(m.parsePreviewDraft(JSON.stringify({ ...m.createPreviewDraft(), pieces: [{ ...art, pageText: 5 }] })), null);
  }
  // Signatures: plain SVG only, drawn through an <img>, published as a file beside the artwork.
  {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 4"><path d="M0 2 L10 2" stroke="#000"/></svg>';
    const url = (text) => `data:image/svg+xml;base64,${Buffer.from(text).toString("base64")}`;
    assert.equal(m.svgProblem(svg), null);
    for (const bad of [
      svg.replace("<path", "<script>alert(1)</script><path"),
      svg.replace("<path", '<path onclick="x()"'),
      svg.replace("<path", '<image href="https://example.com/a.png"/><path'),
      svg.replace("<path", '<a href="javascript:alert(1)"><path'),
      svg.replace('stroke="#000"', 'style="fill:url(https://example.com/x)"'),
      svg.replace("<path", "<foreignObject/><path"),
      svg.replace(' viewBox="0 0 10 4"', ""),
      "<html></html>",
    ])
      assert.ok(m.svgProblem(bad), bad);
    assert.equal(m.svgProblem(svg.replace('stroke="#000"', 'fill="url( #a)"')), null);
    const art = { ...m.createPreviewPiece("art", "preview-sig"), title: "Signed", image, caption: "Under", pageText: "Line one\nBy Someone", signature: url(svg) };
    const draft = { ...m.createPreviewDraft(), pieces: [art] };
    assert.deepEqual(m.parsePreviewDraft(JSON.stringify(draft)), draft, "A signature must survive saving");
    assert.equal(m.parsePreviewDraft(JSON.stringify({ ...draft, pieces: [{ ...art, signature: url("<svg viewBox='0 0 1 1'><script/></svg>") }] })), null);
    assert.equal(m.parsePreviewDraft(JSON.stringify({ ...draft, pieces: [{ ...art, signature: "data:image/png;base64,AAAA" }] })), null);
    assert.equal(m.previewPublication(draft).pieces[0].signatureSrc, url(svg));
    const { issue, files } = await (await server.ssrLoadModule("/src/lib/publish.ts")).publishDraft(draft, "sig-test", async () => null, () => "abc");
    assert.match(issue.pieces[0].signature, /^published\/sig-test\/images\/preview-sig-signature-abc\.svg$/);
    assert.ok(files.some((f) => f.path === issue.pieces[0].signature && Buffer.from(f.bytes).toString() === svg));
    assert.deepEqual(m.parsePreviewDraft(JSON.stringify(issue)), issue, "A published signature path must reload");
    assert.equal(m.previewPublication(issue, { base: "/thenewjournal/" }).pieces[0].signatureSrc, `/thenewjournal/${issue.pieces[0].signature}`);
  }
  // Partner organizations: a known id travels to the reader; an unknown one is dropped, not fatal.
  {
    const poem = { ...m.createPreviewPiece("poem", "preview-partner"), title: "With", text: "Line", partner: "pongo" };
    const draft = { ...m.createPreviewDraft(), pieces: [poem] };
    assert.deepEqual(m.parsePreviewDraft(JSON.stringify(draft)), draft);
    assert.equal(m.previewPublication(draft).pieces[0].partner, "pongo");
    const gone = m.parsePreviewDraft(JSON.stringify({ ...draft, pieces: [{ ...poem, partner: "no-such-partner" }] }));
    assert.equal(gone.pieces[0].partner, "");
    assert.equal(m.previewPublication(gone).pieces[0].partner, undefined);
    const { partner: _none, ...older } = poem;
    assert.equal(m.parsePreviewDraft(JSON.stringify({ ...draft, pieces: [older] })).pieces[0].partner, "");
  }
  let state = { draft: m.createPreviewDraft(), saveStatus: "" };
  const items = [
    {
      ...m.createPreviewPiece("poem", "preview-one"),
      title: "First writing",
      text: "First line\n\nLast line",
    },
    {
      ...m.createPreviewPiece("art", "preview-two"),
      title: "First image",
      image,
      alt: "Window",
    },
    {
      ...m.createPreviewPiece("film", "preview-three"),
      title: "First film",
      video: "https://example.com/film.mp4",
      caption: "A short film",
    },
    {
      ...m.createPreviewPiece("poem", "preview-four"),
      title: "Another writing",
      text: "Fourth piece",
    },
    m.createPreviewPiece("poem", "preview-empty"),
  ];
  for (const piece of items)
    state = draftReducer(state, { type: "add", piece });
  assert.equal(state.draft.pieces.length, 5);
  assert.equal(
    m.previewPublication(state.draft).pieces.length,
    4,
    "Blank drafts should not enter reader",
  );
  assert.deepEqual(
    m.parsePreviewDraft(JSON.stringify(state.draft)),
    state.draft,
    "Downloaded issue must restore exactly",
  );
  const before = state;
  state = draftReducer(state, { type: "move", id: "preview-four", offset: -1 });
  assert.deepEqual(
    state.draft.pieces.map((p) => p.id),
    [
      "preview-one",
      "preview-two",
      "preview-four",
      "preview-three",
      "preview-empty",
    ],
  );
  assert.equal(
    before.draft.pieces[2].id,
    "preview-three",
    "Reordering must not mutate prior state",
  );
  assert.equal(
    draftReducer(state, { type: "move", id: "preview-one", offset: -1 }),
    state,
  );
  state = draftReducer(state, {
    type: "edit",
    id: "preview-four",
    update: { text: "Edited\n\nPreserved", id: "bad", type: "film" },
  });
  assert.equal(state.draft.pieces[2].id, "preview-four");
  assert.equal(state.draft.pieces[2].type, "poem");
  const removed = state.draft.pieces[1];
  state = draftReducer(state, { type: "remove", id: removed.id });
  state = draftReducer(state, { type: "add", piece: removed, index: 1 });
  assert.equal(
    state.draft.pieces[1].id,
    removed.id,
    "Undo returns artwork to its original position",
  );
  assert.equal(
    draftReducer(state, { type: "add", piece: removed }),
    state,
    "Duplicate IDs cannot be added",
  );
  const oversized = draftReducer(state, {
    type: "update",
    update: { cover: "x".repeat(m.MAX_ISSUE_BYTES) },
  });
  assert.equal(
    oversized.draft,
    state.draft,
    "Oversized changes must leave existing writing intact",
  );
  assert.match(oversized.saveStatus, /could not be added/);
  // A multi-stanza fixture (the editor no longer ships a sample issue).
  const comedy = {
    ...m.createPreviewDraft(),
    caption: "Fixture issue",
    pieces: [
      {
        ...m.createPreviewPiece("poem", "preview-poem-1"),
        title: "Peer Review of a Chair",
        author: "Fixture",
        text: "The chair spoke first.\n\nThe panel took notes.\nNobody sat down.",
      },
    ],
  };
  const { magazinePages, pageFromQuery } = await server.ssrLoadModule("/src/lib/magazine.ts");
  const { readingPosition } = await server.ssrLoadModule("/src/lib/readingPosition.ts");
  const comedyPublication = m.previewPublication(comedy);
  const pages = magazinePages(comedyPublication);
  assert.equal(pages.length, 2, "Writing of any length is one page: the cover plus one page per piece");
  assert.deepEqual(pages[1].piece.lines, comedy.pieces[0].text.split("\n"), "A long piece keeps every line and stanza break on its single page");
  const longText = Array.from({ length: 400 }, (_, i) => (i % 9 === 8 ? "" : `line ${i + 1} of a very long poem`)).join("\n");
  const longDraft = { ...comedy, pieces: [{ ...comedy.pieces[0], text: longText }] };
  const longPages = magazinePages(m.previewPublication(longDraft));
  assert.equal(longPages.length, 2, "A 400-line poem is not split across pages");
  assert.equal(longPages[1].piece.lines.length, 400, "The whole 400-line poem is on its page");
  const position = JSON.stringify({ version: 1, publicationId: comedyPublication.id, pieceId: pages[1].piece.id });
  const restored = readingPosition(position, [comedyPublication]);
  assert.equal(restored.index, 1);
  const query = new URLSearchParams(restored.to.split("?")[1]);
  assert.equal(pageFromQuery(pages, query.get("piece")), 1, "Continue reading restores the piece");
  for (const raw of ["{", "null", JSON.stringify({ version: 1, publicationId: "gone", pieceId: "gone" })])
    assert.equal(readingPosition(raw, [comedyPublication]), null, "Invalid reading positions are ignored");
  const { JournalContext } = await server.ssrLoadModule(
    "/src/lib/useJournal.ts",
  );
  const { default: Preview } = await server.ssrLoadModule(
    "/src/pages/Preview.tsx",
  );
  const { default: Reader } = await server.ssrLoadModule(
    "/src/pages/PublicationViewer.tsx",
  );
  const noop = () => {};
  const journal = {
    ...state,
    publications: [m.previewPublication(state.draft)],
    updateDraft: noop,
    addPiece: noop,
    updatePiece: noop,
    removePiece: noop,
    movePiece: noop,
    startPreview: noop,
    resetPreview: noop,
  };
  const render = (path, component, route) =>
    renderToStaticMarkup(
      React.createElement(
        JournalContext.Provider,
        { value: journal },
        React.createElement(
          MemoryRouter,
          { initialEntries: [path] },
          React.createElement(
            Routes,
            null,
            React.createElement(Route, {
              path: route,
              element: React.createElement(component),
            }),
          ),
        ),
      ),
    );
  const editor = render("/preview", Preview, "/preview");
  for (const label of [
    "Add a piece",
    "First writing",
    "First image",
    "First film",
    "Another writing",
    "Download issue",
    "Restore issue",
  ])
    assert.ok(editor.includes(label), label);
  for (const theme of ["surreal", "museum"]) {
  journal.publications = [{ ...m.previewPublication(state.draft), theme }];
  for (const [id, expected] of [
    ["preview-one", "First line"],
    ["preview-two", "A lit window"],
    ["preview-three", "https://example.com/film.mp4"],
    ["preview-four", "Preserved"],
  ]) {
    const reader = render(
      `/publication/preview-issue?piece=${id}`,
      Reader,
      "/publication/:pubId",
    );
    // This artwork fixture has its own alt text rather than the migrated fixture's.
    assert.ok(
      reader.includes(id === "preview-two" ? 'alt="Window"' : expected),
      `Reader should render ${id}`,
    );
  }
  }
  // ---------- Songs ----------
  // Link validation: direct files (including signed links with queries) pass; streaming
  // pages, insecure or credentialed links, and non-web schemes are explained, not accepted.
  assert.equal(m.audioUrlProblem(""), null, "An empty link is not an error yet");
  for (const ok of [
    "https://example.com/song.mp3",
    "https://cdn.example.org/a/b/track.m4a?X-Amz-Signature=abc123&X-Amz-Expires=3600",
    "https://example.com/stream",
  ])
    assert.equal(m.audioUrlProblem(ok), null, `Accepts ${ok}`);
  assert.equal(
    m.audioUrl(" https://cdn.example.org/track.m4a?sig=a%20b&t=1 "),
    "https://cdn.example.org/track.m4a?sig=a%20b&t=1",
    "Signed query strings are kept intact",
  );
  for (const [bad, pattern] of [
    ["open.spotify.com/track/1", /full link/],
    ["https://open.spotify.com/track/1", /Spotify page/],
    ["https://music.apple.com/us/album/x/1", /Apple Music page/],
    ["https://soundcloud.com/artist/track", /SoundCloud page/],
    ["https://music.youtube.com/watch?v=1", /YouTube page/],
    ["https://artist.bandcamp.com/track/x", /Bandcamp page/],
    ["http://example.com/song.mp3", /https:\/\//],
    ["https://user:secret@example.com/song.mp3", /username and password/],
    ["javascript:alert(1)", /https:\/\//],
    ["data:audio/mp3;base64,AAAA", /https:\/\//],
  ]) {
    assert.match(m.audioUrlProblem(bad) ?? "", pattern, `Explains ${bad}`);
    assert.equal(m.audioUrl(bad), undefined, `Rejects ${bad}`);
  }
  // Conversion: a song needs a usable link; its transcript keeps verse breaks; an empty
  // transcript is allowed; nothing about a song leaks into film or artwork fields.
  const songDraft = {
    ...m.createPreviewDraft(),
    pieces: [
      {
        ...m.createPreviewPiece("song", "preview-song-1"),
        title: "River Song",
        author: "The Wardens",
        audio: "https://cdn.example.org/river.mp3?sig=abc",
        text: "Verse one line\nVerse one again\n\nVerse two line\n\n\nAfter a long gap",
      },
      {
        ...m.createPreviewPiece("song", "preview-song-2"),
        title: "Instrumental",
        audio: "https://cdn.example.org/hum.ogg",
      },
      { ...m.createPreviewPiece("song", "preview-song-3"), title: "Streaming page", audio: "https://open.spotify.com/track/1", text: "Words" },
      { ...m.createPreviewPiece("song", "preview-song-4"), title: "No link yet", text: "Words" },
    ],
  };
  const songPublication = m.previewPublication(songDraft);
  assert.deepEqual(
    songPublication.pieces.map((p) => p.id),
    ["preview-song-1", "preview-song-2"],
    "Songs without a usable audio link stay drafts",
  );
  const [river, hum] = songPublication.pieces;
  assert.equal(river.type, "song");
  assert.equal(river.audioSrc, "https://cdn.example.org/river.mp3?sig=abc");
  assert.deepEqual(
    river.transcript,
    ["Verse one line", "Verse one again", "", "Verse two line", "", "", "After a long gap"],
    "Transcript keeps every line and blank verse break",
  );
  assert.equal(river.author, "The Wardens");
  assert.deepEqual(hum.transcript, [], "A song may have no transcript");
  assert.equal(hum.author, "Anonymous");
  for (const leaked of ["videoSrc", "logline", "imageSrc", "lines"])
    assert.ok(!(leaked in river), `Songs never carry ${leaked}`);
  // Portable files: songs round-trip exactly; drafts and files saved before songs existed
  // (no audio field) still restore, reading the missing field as empty.
  assert.deepEqual(m.parsePreviewDraft(JSON.stringify(songDraft)), songDraft, "Song issues restore exactly");
  const legacy = JSON.parse(JSON.stringify(state.draft));
  for (const piece of legacy.pieces) delete piece.audio;
  delete legacy.issueNumber;
  delete legacy.publicationId;
  assert.deepEqual(
    m.parsePreviewDraft(JSON.stringify(legacy)),
    state.draft,
    "Pre-song, pre-publishing issue files restore unchanged, with empty new fields",
  );
  assert.ok(migrated.pieces.every((p) => p.audio === ""), "Migrated first-version drafts gain an empty audio field");
  assert.equal(
    m.parsePreviewDraft(JSON.stringify({ ...songDraft, pieces: [{ ...songDraft.pieces[0], audio: 42 }] })),
    null,
    "A malformed audio field is rejected",
  );
  assert.equal(
    m.parsePreviewDraft(JSON.stringify({ ...songDraft, pieces: [{ ...songDraft.pieces[0], type: "podcast" }] })),
    null,
    "Unknown media are rejected",
  );
  // Editing workflow: songs add, edit, move, remove, undo, and keep their type.
  let songState = { draft: m.createPreviewDraft(), saveStatus: "" };
  for (const piece of songDraft.pieces) songState = draftReducer(songState, { type: "add", piece });
  songState = draftReducer(songState, { type: "edit", id: "preview-song-2", update: { audio: "https://cdn.example.org/new.wav", type: "film" } });
  assert.equal(songState.draft.pieces[1].type, "song", "Edits cannot change a song into another medium");
  assert.equal(songState.draft.pieces[1].audio, "https://cdn.example.org/new.wav");
  songState = draftReducer(songState, { type: "move", id: "preview-song-2", offset: -1 });
  assert.equal(songState.draft.pieces[0].id, "preview-song-2");
  const removedSong = songState.draft.pieces[0];
  songState = draftReducer(songState, { type: "remove", id: removedSong.id });
  songState = draftReducer(songState, { type: "add", piece: removedSong, index: 0 });
  assert.equal(songState.draft.pieces[0].id, removedSong.id, "Undo restores a removed song in place");
  const hugeSong = draftReducer(songState, { type: "edit", id: "preview-song-1", update: { text: "x".repeat(m.MAX_ISSUE_BYTES) } });
  assert.equal(hugeSong.draft, songState.draft, "Song edits respect the issue size limit");
  // Contents, labels and rendering. Static markup only: this proves structure, not playback.
  const { pieceKind } = await server.ssrLoadModule("/src/lib/useIssueNav.ts");
  assert.equal(pieceKind.song, "Song");
  journal.publications = [songPublication];
  for (const theme of ["surreal", "museum"]) {
    journal.publications = [{ ...songPublication, theme }];
    const reader = render(`/publication/preview-issue?piece=preview-song-1`, Reader, "/publication/:pubId");
    for (const text of ["River Song", "The Wardens", "Transcript", "Verse two line", "After a long gap", "Play River Song", "Seek in River Song"])
      assert.ok(reader.includes(text), `${theme} song page shows ${text}`);
    assert.equal((reader.match(/<audio/g) ?? []).length, 1, `${theme}: exactly one audio element for the whole reader`);
    assert.ok(!reader.includes("<video"), `${theme}: a song never renders the film player`);
    assert.ok(reader.includes("\u00a0"), `${theme}: blank verse lines keep their height`);
    const empty = render(`/publication/preview-issue?piece=preview-song-2`, Reader, "/publication/:pubId");
    assert.ok(empty.includes("No transcript has been added for this song."), `${theme}: empty transcript is explained`);
  }
  journal.draft = songState.draft;
  journal.publications = [m.previewPublication(songState.draft)];
  const songEditor = render("/preview", Preview, "/preview");
  for (const label of ["Song", "Instrumental", "River Song"])
    assert.ok(songEditor.includes(label), `Editor shows ${label}`);
  // ---------- Publishing ----------
  const published = await server.ssrLoadModule("/src/data/publishedIssues.ts");
  const publishing = await server.ssrLoadModule("/src/lib/publish.ts");
  const { issueName } = await server.ssrLoadModule("/src/lib/issueLabel.ts");
  // The old issues are gone; the gallery example stays in the code, hidden.
  const dataModule = await server.ssrLoadModule("/src/data/publications.ts");
  assert.ok(!("publications" in dataModule), "The hard-coded issue list is gone");
  const { comedyExample } = await server.ssrLoadModule("/src/data/comedyExample.ts");
  assert.equal(comedyExample.hidden, true, "The gallery example is kept but hidden");
  assert.ok(!published.publishedIssues.some((p) => p.id === "pub-1" || p.id === "comedy-example"), "Old issues are not published");
  assert.equal(typeof m.createComedyDraft, "undefined", "The editor no longer offers the comedy example");
  assert.equal(
    readingPosition(JSON.stringify({ version: 1, publicationId: "pub-1", pieceId: "pub-1-poem-1" }), published.publishedIssues),
    null,
    "Reading positions in the removed issue are ignored",
  );
  journal.publications = published.publishedIssues;
  const goneReader = render("/publication/pub-1?piece=pub-1-poem-1", Reader, "/publication/:pubId");
  assert.ok(!goneReader.includes("sr-reader") && !goneReader.includes("gal-reader"), "Links to the removed issue open no reader");

  // Web addresses.
  for (const ok of ["issue-01", "spring", "a"]) assert.ok(m.isPublicationId(ok), ok);
  for (const bad of ["", "preview-issue", "comedy-example", "-x", "x-", "Issue", "a b", "a/b", "x".repeat(61)])
    assert.ok(!m.isPublicationId(bad), `Rejects address “${bad}”`);
  const numbered = { ...m.createPreviewDraft(), issueNumber: "01" };
  assert.equal(publishing.suggestPublicationId(numbered, new Set()), "issue-01");
  assert.equal(publishing.suggestPublicationId(numbered, new Set(["issue-01"])), "issue-01-2");
  assert.equal(publishing.suggestPublicationId({ ...m.createPreviewDraft(), caption: "Spring Songs!" }, new Set()), "spring-songs");

  // Round trip: draft → published files → draft again.
  const hash = (bytes) => createHash("sha256").update(bytes).digest("hex").slice(0, 10);
  const png = Buffer.from("iVBORw0KGgo=", "base64");
  const webp = Buffer.from("UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=", "base64");
  const mp3 = Buffer.from("ID3\u0003\u0000\u0000\u0000\u0000\u0000\u0000song bytes", "latin1");
  const stagedPath = "__staging/preview-song-up-1234567890.mp3";
  const disk = new Map([[stagedPath, mp3]]);
  const load = async (value) => disk.get(value) ?? null;
  const toPublish = {
    ...m.createPreviewDraft(),
    caption: "Spring Issue",
    issueNumber: "01",
    cover: `data:image/png;base64,${png.toString("base64")}`,
    pieces: [
      { ...m.createPreviewPiece("poem", "preview-poem-p"), title: "Poem", text: "One\n\nTwo" },
      { ...m.createPreviewPiece("art", "preview-art-p"), title: "Window", image: `data:image/webp;base64,${webp.toString("base64")}`, alt: "A window" },
      { ...m.createPreviewPiece("song", "preview-song-up"), title: "Uploaded", audio: stagedPath, text: "La\n\nLa" },
      { ...m.createPreviewPiece("song", "preview-song-link"), title: "Linked", audio: "https://cdn.example.org/a.mp3?sig=1" },
      { ...m.createPreviewPiece("film", "preview-film-empty"), title: "No link yet" },
    ],
  };
  assert.deepEqual(m.leftOut(toPublish).map((p) => p.id), ["preview-film-empty"], "Publishing can list pieces that would be left out");
  const first = await publishing.publishDraft(toPublish, "issue-01", load, hash);
  const issueJson = JSON.stringify(first.issue);
  assert.ok(!issueJson.includes("data:") && !issueJson.includes("__staging"), "Published issue files hold paths, never embedded media");
  assert.equal(first.issue.publicationId, "issue-01");
  assert.deepEqual(first.issue.pieces.map((p) => p.id), toPublish.pieces.map((p) => p.id), "Piece IDs are kept for bookmarks");
  assert.match(first.issue.cover, /^published\/issue-01\/images\/cover-[0-9a-f]{10}\.png$/);
  assert.match(first.issue.pieces[1].image, /^published\/issue-01\/images\/preview-art-p-[0-9a-f]{10}\.webp$/);
  assert.match(first.issue.pieces[2].audio, /^published\/issue-01\/audio\/preview-song-up-[0-9a-f]{10}\.mp3$/);
  assert.equal(first.issue.pieces[3].audio, "https://cdn.example.org/a.mp3?sig=1", "Audio links stay links");
  const filesByPath = new Map(first.files.map((f) => [f.path, Buffer.from(f.bytes)]));
  assert.deepEqual(filesByPath.get(first.issue.cover), png, "The cover image is written byte for byte");
  assert.deepEqual(filesByPath.get(first.issue.pieces[1].image), webp);
  assert.deepEqual(filesByPath.get(first.issue.pieces[2].audio), mp3, "The uploaded song is written byte for byte");
  assert.deepEqual(m.parsePreviewDraft(issueJson), first.issue, "A published issue file opens in the editor unchanged");
  for (const [path, bytes] of filesByPath) disk.set(path, bytes);
  const again = await publishing.publishDraft(first.issue, "issue-01", load, hash);
  assert.deepEqual(again.issue, first.issue, "Republishing an unchanged issue changes nothing");
  assert.deepEqual(again.files.map((f) => f.path).sort(), [...filesByPath.keys()].sort());
  const moved = await publishing.publishDraft(first.issue, "issue-02", load, hash);
  assert.ok(moved.files.every((f) => f.path.startsWith("published/issue-02/")), "Publishing at a new address copies media there");
  await assert.rejects(
    publishing.publishDraft({ ...toPublish, pieces: [{ ...toPublish.pieces[2], audio: "__staging/preview-song-up-missing.mp3" }] }, "issue-01", load, hash),
    /missing/,
    "A missing upload stops publishing with a clear message",
  );
  const read = published.readPublished({
    "./published/issue-01.json": JSON.parse(issueJson),
    "./published/Bad Name.json": JSON.parse(issueJson),
    "./published/broken.json": { nope: true },
  });
  assert.deepEqual(read.map((r) => r.id), ["issue-01"], "Only valid issue files with valid addresses are read");

  // Base path: site paths gain it, links and embedded images do not.
  const onPages = published.publishedPublications(read, "/thenewjournal/")[0];
  assert.equal(onPages.id, "issue-01");
  assert.equal(onPages.issueNumber, "01");
  assert.equal(onPages.coverSrc, `/thenewjournal/${first.issue.cover}`);
  assert.equal(onPages.pieces.find((p) => p.type === "art").imageSrc, `/thenewjournal/${first.issue.pieces[1].image}`);
  assert.deepEqual(
    onPages.pieces.filter((p) => p.type === "song").map((p) => p.audioSrc),
    [`/thenewjournal/${first.issue.pieces[2].audio}`, "https://cdn.example.org/a.mp3?sig=1"],
  );
  assert.equal(m.mediaUrl("published/a/images/x.png", "/thenewjournal"), "/thenewjournal/published/a/images/x.png");
  assert.equal(m.mediaUrl("published/a/images/x.png", "/"), "/published/a/images/x.png");
  assert.equal(m.mediaUrl("data:image/png;base64,AAAA", "/thenewjournal/"), "data:image/png;base64,AAAA");
  assert.equal(m.mediaUrl("https://cdn.example.org/a.mp3", "/thenewjournal/"), "https://cdn.example.org/a.mp3");
  assert.equal(m.mediaUrl("published/../../etc/passwd", "/x/"), "published/../../etc/passwd", "Unexpected paths are never treated as site files");
  assert.equal(issueName(onPages), "Issue 01");
  assert.equal(issueName({ ...onPages, issueNumber: undefined }), "Online issue", "A published issue without a number gets neutral text");
  assert.equal(issueName({ ...onPages, id: m.PREVIEW_ID, issueNumber: undefined }), "Your issue");

  // Empty state: no published issues (or only empty ones) shows a message, not a crash.
  assert.deepEqual(published.readPublished({}), []);
  assert.deepEqual(
    published.publishedPublications([{ id: "empty", draft: { ...m.createPreviewDraft(), pieces: [m.createPreviewPiece("poem", "preview-blank")] } }]),
    [],
    "An issue with nothing ready is not listed",
  );
  const { default: Home } = await server.ssrLoadModule("/src/pages/Home.tsx");
  journal.publications = [];
  assert.ok(render("/", Home, "/").includes("The first issue is on its way."), "The home page shows an empty state");
  journal.publications = [onPages];
  const homeWithIssue = render("/", Home, "/");
  assert.ok(homeWithIssue.includes("Spring Issue") && !homeWithIssue.includes("The first issue is on its way."));

  // Editor: publishing controls instead of the sample issue.
  const publishEditor = render("/preview", Preview, "/preview");
  for (const label of ["Publish", "Commit and push", "Issue number", "Web address", "Choose audio file"])
    assert.ok(publishEditor.includes(label), `Editor shows ${label}`);
  assert.ok(!publishEditor.includes("Use comedy example"), "The comedy example button is gone");

  console.log(
    "Passed: migration, portable files, validation, editing, order, undo, size protection, one-page writing of any length, reading-position restoration, editor render, both reader editions for writing/art/film/song, song links, conversion, round trips, pre-song compatibility, old issues removed, publish round trip, empty state, and base paths.",
  );
} finally {
  await server.close();
}
