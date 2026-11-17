import { buildShareCard } from "./share-card.mjs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";

// Load the same validated publications and URLs that drive the interactive readers.
const server = await createServer({ base: process.env.PAGES_BASE || "/", server: { middlewareMode: true, hmr: false }, appType: "custom" });
try {
  const { publishedIssues } = await server.ssrLoadModule("/src/data/publishedIssues.ts");
  const { siteOrigin, publicPages, readerPath, medium } = await server.ssrLoadModule("/src/lib/publicPages.ts");
  const { partners } = await server.ssrLoadModule("/src/data/partners.ts");
  const { wallPreview } = await server.ssrLoadModule("/src/lib/wallPreview.ts");
  const pages = publicPages(publishedIssues);
  const template = await readFile("dist/index.html", "utf8");
  const base = server.config.base;
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const link = (route, label) => `<a href="${escape(base + route.slice(1))}">${escape(label)}</a>`;
  const list = (items, render) => `<ul>${items.map(item => "<li>" + render(item) + "</li>").join("")}</ul>`;
  function workBody(piece) {
    switch (piece.type) {
      case "art": return `<img src="${escape(piece.imageSrc)}" alt="${escape(piece.imageAlt ?? piece.title)}"><p>${escape(piece.pageText || piece.imageCaption)}</p>`;
      case "film": return `<video controls preload="none" src="${escape(piece.videoSrc)}"></video><p>${escape(piece.logline)}</p>`;
      case "poem": return `<p>${escape(piece.lines.join("\n"))}</p>`;
      case "song": return `<audio controls preload="none" src="${escape(piece.audioSrc)}"></audio><p>${escape(piece.transcript.join("\n"))}</p>`;
    }
  }
  function catalogue(issue) {
    return list(issue.pieces, work => link(readerPath(issue, work), work.title) + " · " + escape(medium[work.type] + " by " + work.author));
  }
  function contents(page) {
    if (page.piece) {
      const partner = partners.find(partner => partner.id === page.piece.partner);
      const credit = page.piece.pageCreator ? "<p>Page created by " + escape(page.piece.pageCreator) + "</p>" : "";
      const partnerLink = partner ? "<p>" + link("/partners/#" + partner.id, partner.name) + "</p>" : "";
      return workBody(page.piece) + credit + partnerLink + link(readerPath(page.publication), page.publication.caption);
    }
    if (page.publication) return catalogue(page.publication);
    if (page.path === "/partners/") return list(partners, partner => `<a id="${escape(partner.id)}" href="${escape(partner.url)}">${escape(partner.name)}</a><p>${escape(partner.paragraphs[0])}</p>`);
    if (page.path === "/gallery/") return publishedIssues.map(catalogue).join("");
    if (page.path === "/") {
      const feature = publishedIssues.flatMap(issue => {
        const poem = issue.pieces.find(piece => piece.type === "poem");
        return poem ? [link(readerPath(issue, poem), "Read " + poem.title)] : [];
      })[0];
      return (feature ?? "") + list(publishedIssues, issue => link(readerPath(issue), issue.caption));
    }
    return "";
  }
  const nav = '<nav aria-label="Journal">' + pages.slice(0, 4).map(page => link(page.path, page.heading)).join(" · ") + "</nav>";
  for (const page of pages) {
    const directory = path.join("dist", page.path);
    await mkdir(directory, { recursive: true });
    if (page.piece) await buildShareCard(page, path.join(directory, "share.jpg"), wallPreview(page.piece.videoSrc), base);
    const url = siteOrigin + page.path;
    const head = `<title>${escape(page.title)}</title>
    <meta name="description" content="${escape(page.description)}">
    <meta name="robots" content="index,follow">
    <link rel="canonical" href="${escape(url)}">
    <meta property="og:site_name" content="The New Journal">
    <meta property="og:type" content="${page.piece ? "article" : "website"}">
    <meta property="og:url" content="${escape(url)}">
    <meta property="og:title" content="${escape(page.title)}">
    <meta property="og:description" content="${escape(page.description)}">
    <meta property="og:image" content="${escape(page.piece ? url + "share.jpg" : siteOrigin + "/journal-table.jpg")}">
    <meta property="og:image:alt" content="${escape(page.piece ? page.piece.title + " by " + page.piece.author.trim() : "The New Journal on its reading table")}">
    <meta name="twitter:card" content="summary_large_image">`;
    const body = `<main class="plain-reader">${nav}<h1>${escape(page.heading)}</h1><p>${escape(page.description)}</p>${contents(page)}</main>`;
    await writeFile(path.join(directory, "index.html"), template
      .replace(/<!-- journal-head -->[\s\S]*?<!-- \/journal-head -->/, () => head)
      .replace('<div id="root"></div>', () => '<div id="root">' + body + '</div>'));
  }
  // The issue address is its permanent RSS identifier, including after corrections or rebuilds.
  const items = publishedIssues.map(issue => {
    const url = escape(siteOrigin + readerPath(issue));
    const title = issue.caption + (issue.issueNumber ? " · Issue " + issue.issueNumber : "");
    return `<item><title>${escape(title)}</title><link>${url}</link><guid>${url}</guid><description>${escape(issue.pieces.map(piece => piece.title).join(" · "))}</description></item>`;
  });
  await writeFile("dist/issues.xml", `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>The New Journal — New issues</title><link>${siteOrigin}/</link><description>New issues of The New Journal.</description>
<atom:link href="${siteOrigin}/issues.xml" rel="self" type="application/rss+xml"/>
${items.join("\n")}</channel></rss>`);
  await writeFile("dist/sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + pages.map(page => `  <url><loc>${escape(siteOrigin + page.path)}</loc></url>`).join("\n") + "\n</urlset>\n");
  await writeFile("dist/robots.txt", `User-agent: *\nAllow: /\nSitemap: ${siteOrigin}/sitemap.xml\n`);
  await writeFile("dist/404.html", template
    .replace(/<!-- journal-head -->[\s\S]*?<!-- \/journal-head -->/, '<title>Page not found | The New Journal</title><meta name="robots" content="noindex,follow">')
    .replace('<div id="root"></div>', '<div id="root"><main class="plain-reader"><h1>Page not found</h1>' + nav + '</main></div>'));
  console.log("Built " + pages.length + " public pages and sitemap.");
} finally {
  await server.close();
}
