import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { publishedIssues } from "../data/publishedIssues";
import { publicPages, readerPath, siteOrigin } from "../lib/publicPages";

const pages = new Map(publicPages(publishedIssues).map(page => [page.path, page]));

export default function PageHead() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    const path = pathname.replace(/\/?$/, "/");
    const cover = pages.get(path);
    const legacyId = new URLSearchParams(search).get("piece");
    const piece = !cover?.piece && cover?.publication?.pieces.find(work => work.id === legacyId);
    const page = piece && cover?.publication ? pages.get(readerPath(cover.publication, piece)) : cover;
    const title = page?.title ?? "The New Journal";
    const description = page?.description ?? "";
    document.title = title;
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical && page) canonical.href = siteOrigin + page.path;
    for (const [selector, value] of [
      ['name="description"', description], ['property="og:title"', title],
      ['property="og:description"', description], ['property="og:type"', page?.piece ? "article" : "website"],
      ['property="og:url"', page ? siteOrigin + page.path : ""],
      ['property="og:image"', siteOrigin + (page?.piece ? page.path + "share.jpg" : "/journal-table.jpg")],
      ['property="og:image:alt"', page?.piece ? page.piece.title + " by " + page.piece.author.trim() : "The New Journal on its reading table"],
      ['name="robots"', page && import.meta.env.PROD ? "index,follow" : "noindex,follow"],
    ]) document.querySelector(`meta[${selector}]`)?.setAttribute("content", value);
  }, [pathname, search]);
  return null;
}
