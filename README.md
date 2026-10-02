# The New Journal

A React publication reader for writing, artwork, and films by incarcerated youth. The original publication data lives in `src/data/publications.ts`.

[Shareable preview](https://the-new-journal-preview-oct02.defenestranator.chatgpt.site)

## Issue designs

Each publication opens from its cover tile on the home page: the cover grows to fill the screen in that issue's palette and hands off to its own reader.

- **Surreal edition** (`theme: "surreal"`) — a two-page magazine over animated, hand-built SVG dreamscapes (`src/components/surreal/`). Pages turn with a 3D page flip around the spine; the backdrop crossfades to a new scene as you read and leans with the mouse. Phones get a single page that peels away.
- **Gallery edition** (`theme: "museum"`) — white gallery walls, spotlight and floor (`src/components/gallery/`). Each piece is hung like a work with soft layered shadows and a museum wall label; the carousel slides between works, with neighbours peeking in and drag/swipe support.

Both readers share URL-based page state (`src/lib/useIssueNav.ts`), so direct links, the contents dialog, arrow keys (plus Home/End), and bookmarks behave the same. The scenes and gallery sculpture are decorative brand artwork, never attributed to contributors.

## Try an issue

Choose **Try it** to open `/preview`. **Add a piece** lets visitors add writing, artwork, or films to a growing issue (up to 200 pieces). Select any piece in the contents list to edit it, move it up/down, or remove it with an undo option. Open finished pieces in the reader. Existing two-poem drafts migrate automatically without changing their piece IDs.

Changes save in the visitor's browser; they are not shared or published. **Download issue** saves a portable JSON copy including images; **Restore issue** validates and opens downloaded files up to 8 MB, with confirmation before replacing existing work. A cover is optional. JPG, PNG, and WebP images under 1 MB are supported. Films use direct HTTPS MP4/WebM links, not video-platform page links. **Start over** clears the draft after confirmation.

The reader supports arrow keys, a contents panel, direct links to pieces, and bookmarks saved on the current device. Motion follows the visitor's reduced-motion preference. The editor animates piece arrivals, removals, reordering, selection, preview changes, save confirmation, image arrivals, and control feedback. Writing appears immediately while typing; reader line reveals have a capped delay.

## Local development

```sh
npm install
npm run dev
```

```sh
npm run build
npm run lint
npm run check:preview
```

## Shared preview deployment

The separate `../journal-share-preview` checkout contains the published static export and Sites identity in `.openai/hosting.json`. The export uses SPA fallback so reader and editor links survive reloads. Source work stays in this repository; rebuild and refresh that export before publishing changes through the Sites workflow.

Build, lint, legacy draft migration, portable issue files, reordering, undo, validation, and server-render integration checks passed for the editor. Browser access blocked the final editor interaction and visual inspection; those checks should be completed when browser access is available.
