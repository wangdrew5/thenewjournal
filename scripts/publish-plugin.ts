// Dev-only publishing endpoints for the editor (`npm run dev`); never part of a build.
//
//   POST /__publish            write an issue: src/data/published/<id>.json + public/published/<id>/
//   POST /__publish/audio      stage an uploaded song file in .tnj-staging/ (git-ignored)
//   POST /__publish/unpublish  remove an issue's file and media
//   POST /__publish/commit     commit only the published files, then git push
//   GET  /__staging/<file>     play a staged upload in the editor and dev readers
//
// Requests must come from this computer (loopback address, localhost Host, same-origin)
// and carry the X-TNJ-Publish header, which other sites cannot send without permission.
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { createReadStream, promises as fs } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import type { Plugin, ViteDevServer } from "vite";

const MAX_DRAFT_BYTES = 64 * 1024 * 1024;
const MAX_AUDIO_BYTES = 20 * 1024 * 1024;
const PIECE_ID = /^preview-[a-zA-Z0-9-]{1,100}$/;
const STAGED_NAME = /^[A-Za-z0-9._-]{1,160}\.(mp3|m4a|wav)$/;
const AUDIO_TYPES: Record<string, string> = { mp3: "audio/mpeg", m4a: "audio/mp4", wav: "audio/wav" };

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function fromThisComputer(req: IncomingMessage, needHeader: boolean) {
  const address = req.socket.remoteAddress ?? "";
  const loopback = ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(address);
  const host = (req.headers.host ?? "").replace(/:\d+$/, "");
  const localHost = ["localhost", "127.0.0.1", "[::1]"].includes(host);
  const origin = req.headers.origin;
  const sameOrigin = !origin || /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin);
  return loopback && localHost && sameOrigin && (!needHeader || req.headers["x-tnj-publish"] === "1");
}

async function readBody(req: IncomingMessage, limit: number) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new HttpError(413, "That is too large to publish.");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex").slice(0, 10);

/** Recognises MP3, M4A and WAV by their first bytes, not by what the browser claims. */
function audioKind(bytes: Buffer): "mp3" | "m4a" | "wav" | null {
  if (bytes.subarray(0, 4).toString("latin1") === "RIFF" && bytes.subarray(8, 12).toString("latin1") === "WAVE") return "wav";
  if (bytes.subarray(4, 8).toString("latin1") === "ftyp") return "m4a";
  if (bytes.subarray(0, 3).toString("latin1") === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)) return "mp3";
  return null;
}

function git(root: string, args: string[]) {
  return new Promise<{ ok: boolean; output: string }>((resolve) =>
    // No terminal prompts: a push that needs credentials fails with git's message instead of waiting unseen.
    execFile("git", args, { cwd: root, timeout: 120_000, env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } }, (error, stdout, stderr) =>
      resolve({ ok: !error, output: `$ git ${args.join(" ")}\n${stdout}${stderr}`.trim() }),
    ),
  );
}

async function listFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const nested = await Promise.all(
    entries.map((e) => (e.isDirectory() ? listFiles(path.join(dir, e.name)) : [path.join(dir, e.name)])),
  );
  return nested.flat();
}

export function publishPlugin(): Plugin {
  return {
    name: "tnj-publish",
    apply: "serve",
    // Published files change while you edit; the editor reloads the site when you ask to
    // view them, so a write never interrupts a publish that is still reporting back.
    handleHotUpdate({ file }) {
      if (file.includes(`${path.sep}src${path.sep}data${path.sep}published${path.sep}`)) return [];
    },
    configureServer(server: ViteDevServer) {
      const root = server.config.root;
      const dataDir = path.join(root, "src", "data", "published");
      const mediaDir = path.join(root, "public", "published");
      const stagingDir = path.join(root, ".tnj-staging");
      // Every path written is built from validated IDs and names, then checked against
      // these folders once more before anything touches the disk.
      const inside = (dir: string, target: string) => {
        const resolved = path.resolve(target);
        if (resolved !== dir && !resolved.startsWith(dir + path.sep)) throw new HttpError(400, "Refusing to write outside the published folders.");
        return resolved;
      };

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        // Media URLs carry the site's base path (e.g. /thenewjournal/__staging/…).
        const base = server.config.base;
        const route = base !== "/" && url.pathname.startsWith(base) ? `/${url.pathname.slice(base.length)}` : url.pathname;
        if (!route.startsWith("/__publish") && !route.startsWith("/__staging/")) return next();
        try {
          if (route.startsWith("/__staging/") && req.method === "GET") {
            if (!fromThisComputer(req, false)) throw new HttpError(403, "Only this computer can use the editor's files.");
            const name = decodeURIComponent(route.slice("/__staging/".length));
            if (!STAGED_NAME.test(name)) throw new HttpError(404, "Not found");
            const file = inside(stagingDir, path.join(stagingDir, name));
            const { size } = await fs.stat(file).catch(() => { throw new HttpError(404, "Not found"); });
            res.setHeader("Content-Type", AUDIO_TYPES[name.split(".").pop()!]);
            res.setHeader("Accept-Ranges", "bytes");
            // Byte ranges let the player seek, as a real file host would.
            const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? "");
            if (range) {
              const start = range[1] ? Number(range[1]) : 0;
              const end = Math.min(range[2] ? Number(range[2]) : size - 1, size - 1);
              res.statusCode = 206;
              res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
              res.setHeader("Content-Length", end - start + 1);
              createReadStream(file, { start, end }).pipe(res);
            } else {
              res.setHeader("Content-Length", size);
              createReadStream(file).pipe(res);
            }
            return;
          }
          if (req.method !== "POST") throw new HttpError(405, "Use POST.");
          if (!fromThisComputer(req, true)) throw new HttpError(403, "Publishing only works from the editor on this computer.");
          const preview = await server.ssrLoadModule("/src/lib/preview.ts");
          const publishing = await server.ssrLoadModule("/src/lib/publish.ts");

          if (route === "/__publish/audio") {
            const piece = url.searchParams.get("piece") ?? "";
            if (!PIECE_ID.test(piece)) throw new HttpError(400, "Unknown piece.");
            const bytes = await readBody(req, MAX_AUDIO_BYTES);
            const kind = audioKind(bytes);
            if (!kind) throw new HttpError(415, "That file is not an MP3, M4A, or WAV recording.");
            const name = `${piece}-${hash(bytes)}.${kind}`;
            await fs.mkdir(stagingDir, { recursive: true });
            await fs.writeFile(inside(stagingDir, path.join(stagingDir, name)), bytes);
            return send(res, 200, { path: `__staging/${name}`, bytes: bytes.length });
          }

          if (route === "/__publish") {
            const body = JSON.parse((await readBody(req, MAX_DRAFT_BYTES)).toString("utf8"));
            const id: string = body?.id ?? "";
            if (typeof id !== "string" || !preview.isPublicationId(id))
              throw new HttpError(400, "Choose a web address of lowercase letters, numbers, and hyphens.");
            const draft = preview.parsePreviewDraft(JSON.stringify(body?.draft ?? null));
            if (!draft) throw new HttpError(400, "That draft did not pass the editor's checks, so nothing was written.");
            const load = async (value: string) => {
              const file = preview.isStagedAudio(value)
                ? inside(stagingDir, path.join(stagingDir, value.slice("__staging/".length)))
                : inside(mediaDir, path.join(root, "public", value));
              return fs.readFile(file).catch(() => null);
            };
            const { issue, files } = await publishing.publishDraft(draft, id, load, hash).catch((error: Error) => {
              throw new HttpError(400, error.message);
            });
            const issueDir = inside(mediaDir, path.join(mediaDir, id));
            const written: string[] = [];
            for (const file of files as { path: string; bytes: Uint8Array }[]) {
              const target = inside(issueDir, path.join(root, "public", file.path));
              const existing = await fs.readFile(target).catch(() => null);
              if (existing && Buffer.compare(existing, Buffer.from(file.bytes)) === 0) continue;
              await fs.mkdir(path.dirname(target), { recursive: true });
              await fs.writeFile(target, file.bytes);
              written.push(path.relative(root, target));
            }
            const keep = new Set((files as { path: string }[]).map((f) => path.join(root, "public", f.path)));
            const removed: string[] = [];
            for (const file of await listFiles(issueDir)) {
              if (keep.has(file)) continue;
              await fs.rm(inside(issueDir, file));
              removed.push(path.relative(root, file));
            }
            const jsonPath = inside(dataDir, path.join(dataDir, `${id}.json`));
            const json = `${JSON.stringify(issue, null, 2)}\n`;
            if ((await fs.readFile(jsonPath, "utf8").catch(() => "")) !== json) {
              await fs.mkdir(dataDir, { recursive: true });
              await fs.writeFile(jsonPath, json);
              written.unshift(path.relative(root, jsonPath));
            }
            // Staged uploads now live with the issue.
            for (const p of draft.pieces as { audio: string }[])
              if (preview.isStagedAudio(p.audio))
                await fs.rm(inside(stagingDir, path.join(stagingDir, p.audio.slice("__staging/".length))), { force: true });
            return send(res, 200, { issue, written, removed });
          }

          if (route === "/__publish/unpublish") {
            const { id } = JSON.parse((await readBody(req, 4096)).toString("utf8"));
            if (typeof id !== "string" || !preview.isPublicationId(id)) throw new HttpError(400, "Unknown issue.");
            const jsonPath = inside(dataDir, path.join(dataDir, `${id}.json`));
            const issueDir = inside(mediaDir, path.join(mediaDir, id));
            const removed = [
              ...(await fs.stat(jsonPath).then(() => [path.relative(root, jsonPath)], () => [])),
              ...(await listFiles(issueDir)).map((f) => path.relative(root, f)),
            ];
            await fs.rm(jsonPath, { force: true });
            await fs.rm(issueDir, { recursive: true, force: true });
            return send(res, 200, { removed });
          }

          if (route === "/__publish/commit") {
            // Only the published files: never anything else you have uncommitted.
            const paths = ["src/data/published", "public/published"];
            const present: string[] = [];
            for (const p of paths) {
              const onDisk = await fs.stat(path.join(root, p)).then(() => true, () => false);
              const tracked = (await git(root, ["ls-files", "--", p])).output.split("\n").length > 1;
              if (onDisk || tracked) present.push(p);
            }
            if (!present.length) return send(res, 200, { ok: false, output: "Nothing has been published yet." });
            const steps = [await git(root, ["add", "-A", "--", ...present])];
            const staged = await git(root, ["diff", "--cached", "--quiet", "--", ...present]);
            if (staged.ok) return send(res, 200, { ok: false, output: `${steps[0].output}\nNo published changes to commit.`.trim() });
            steps.push(await git(root, ["commit", "-m", "Publish issue", "--", ...present]));
            if (steps[1].ok) steps.push(await git(root, ["push"]));
            return send(res, 200, { ok: steps.every((s) => s.ok), output: steps.map((s) => s.output).join("\n\n") });
          }
          throw new HttpError(404, "Unknown publishing request.");
        } catch (error) {
          const status = error instanceof HttpError ? error.status : 500;
          send(res, status, { error: error instanceof Error ? error.message : "Publishing failed." });
        }
      });
    },
  };
}
