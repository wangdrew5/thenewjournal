# The New Journal

A React publication reader for writing, artwork, films, and songs by incarcerated youth. Issues are built and published with the dev-only editor; each published issue lives in `src/data/published/<id>.json`, with its images and audio under `public/published/<id>/`. Shared types are in `src/data/publications.ts`.

[Shareable preview](https://the-new-journal-preview-oct02.defenestranator.chatgpt.site)

## Issue designs

Each publication opens from its cover tile on the home page: the cover grows to fill the screen in that issue's palette and hands off to its own reader.

- **Surreal edition** (`theme: "surreal"`) — a two-page magazine over animated, hand-built SVG dreamscapes (`src/components/surreal/`). Pages turn with a 3D page flip around the spine; the backdrop crossfades to a new scene as you read and leans with the mouse. Phones get a single page that peels away.
- **Gallery edition** (`theme: "museum"`) — white gallery walls, spotlight and floor (`src/components/gallery/`). Each piece is hung like a work with soft layered shadows and a museum wall label; the carousel slides between works, with neighbours peeking in and drag/swipe support.

Both readers share URL-based page state (`src/lib/useIssueNav.ts`), so direct links, the contents dialog, arrow keys (plus Home/End), and bookmarks behave the same. The scenes and gallery sculpture are decorative brand artwork, never attributed to contributors.

The home page has the masthead title and the staged issue covers; in development it also shows the editor's desk. Each piece is a single page however long it is; long writing scrolls inside its page. Reading positions remember the piece; stale or malformed positions are ignored. Text panels can be focused and scrolled with the keyboard independently of page navigation.

## Songs

A song (`type: "song"`) has a title, an artist or performer credit, a direct audio-file link (`audioSrc`), and an optional transcript (`transcript`, one string per line; empty strings are the blank lines between verses).

- **Surreal edition:** the left page carries the title, credit, and player over the illustration; the right page holds the transcript in the book's paper and type. Long transcripts scroll on one page. On phones the player sits above the transcript.
- **Gallery edition:** the title, credit, and player stay at the top of the work; the transcript scrolls beneath them. The wall label reads "Song, recorded audio".

Playback uses one audio element per visit to an issue (`src/lib/SongAudioProvider.tsx`). The book draws temporary copies of a page while it turns; those copies show the same playback state but are inert, so a turn never duplicates or restarts a song, and only one song can play. Songs never autoplay. Leaving a song's page pauses it and keeps its place for the rest of the visit; leaving the reader stops it. Player controls and transcript scrolling never turn the page.

Links must be direct HTTPS audio files (MP3, M4A, OGG, WAV, …); query strings are kept, so signed links work. Spotify, Apple Music, SoundCloud, YouTube, Bandcamp and other streaming-service pages are rejected with an explanation. A valid link does not guarantee playable audio, so a failure to play shows a message instead. Seeking needs the host to support byte-range requests, as most file hosts and CDNs do.

## Editor (development only)

The editor is a developer tool. It exists only under `npm run dev`: open it from the editor's desk on the home page or at `/preview`. Production builds leave out the desk, the editor code, local drafts, and the publish endpoints, and `/preview` redirects home.

## Publishing

The issues visitors see are the ones published from the editor. With nothing published, the home page says so.

1. Build the issue in the editor. Give it a title, an optional **Issue number** (shown on covers and in the readers), and a **Web address**: the issue appears at `/publication/<address>`. Keep an issue's address to update it; use a new address to publish another issue.
2. Press **Publish**. The editor first lists any pieces that would be left out (writing with no text, artwork without an image, a film or song without a usable link or file) and asks you to confirm. The dev server (`scripts/publish-plugin.ts`) then writes `src/data/published/<address>.json` and the issue's images and audio under `public/published/<address>/`, deletes media there that the issue no longer uses, and the editor lists every file written or removed. Embedded images become files, so the issue file stays small; file names carry a content hash, so a changed image or song is never served from a stale cache.
3. Press **Commit and push** and confirm. It runs `git add -A` and `git commit -m "Publish issue"` limited to `src/data/published` and `public/published`, so no other uncommitted work is included, then `git push`. Git's output appears in the editor. Pushing to `main` runs the GitHub Pages deploy.

**Published issues** in the editor lists every published issue, to open one for editing or remove it from the site (the removal goes online with the next commit and push). When the editor opens with no draft in the browser, it loads the newest published issue, so work can continue on another computer. The status beside the save message reads *Published*, *Unpublished changes*, or *Not published yet*.

Songs can use a direct HTTPS audio link or an audio file chosen from disk (MP3, M4A, or WAV, up to 20 MB). A chosen file is uploaded to the dev server and kept in the git-ignored `.tnj-staging/` folder (not in the browser) until you publish, when it moves to `public/published/<address>/audio/`.

The publish endpoints exist only under `npm run dev` and only answer requests from this computer that carry the editor's header. Media paths are stored relative to the site root and gain the base path when shown, so the site also works from a sub-path; it is served from the root of thenewjournal.org.

**Add a piece** lets you add writing, artwork, films, or songs to a growing issue (up to 200 pieces). Select any piece in the contents list to edit it, move it up/down, or remove it with an undo option. Open finished pieces in the reader. Existing two-poem drafts migrate automatically without changing their piece IDs.

Drafts save in this browser until you publish. **Download issue** saves a portable JSON copy including embedded images (an uploaded song is referenced by its path, not copied into the file); **Restore issue** validates and opens downloaded files up to 8 MB, with confirmation before replacing existing work. A cover is optional. JPG, PNG, and WebP images under 1 MB are supported. Films use direct HTTPS MP4/WebM links, not video-platform page links. Songs use a direct HTTPS audio link or an uploaded audio file. Issue files saved before songs or publishing existed still restore. **Start over** clears the draft after confirmation.

The reader supports arrow keys, a contents panel, direct links to pieces, and bookmarks saved on the current device. Motion follows the visitor's reduced-motion preference. The editor animates piece arrivals, removals, reordering, selection, preview changes, save confirmation, image arrivals, and control feedback. Writing appears immediately while typing; the Gallery edition reveals lines with a capped delay.

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

On October 2, 2026, desktop and 390px phone views were inspected in the browser. Cover entry, page navigation, contents jumps, keyboard text scrolling, and the continue-reading link were exercised. Build, lint, draft migration, portable files, reordering, undo, validation, one-page writing of any length, reading-position restoration, and both reader render checks passed. Real contributor artwork and film remain forthcoming.
