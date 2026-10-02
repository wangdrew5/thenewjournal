import assert from "node:assert/strict";
import { createServer } from "vite";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";

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
  const comedy = m.createComedyDraft();
  assert.equal(comedy.pieces.length, 1);
  assert.match(comedy.pieces[0].text, /chair/i);
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
  console.log(
    "Passed: legacy migration, portable files, validation, multi-piece editing, order, undo, size protection, editor render, reader routes for writing/art/film.",
  );
} finally {
  await server.close();
}
