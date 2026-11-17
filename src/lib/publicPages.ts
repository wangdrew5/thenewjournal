import type { Piece, Publication } from "../data/publications";

export const siteOrigin = "https://thenewjournal.org";
export const mission = "An online publication by and for incarcerated youth and adults.";
export const medium = { poem: "Poem", art: "Artwork", film: "Film", song: "Song" };

function titleSlug(title: string) {
  return title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").slice(0, 80).replace(/^-|-$/g, "") || "work";
}

export function workSlug(publication: Publication, piece: Piece) {
  const slug = titleSlug(piece.title);
  return publication.pieces.some(other => other.id !== piece.id && titleSlug(other.title) === slug)
    ? slug + "~" + piece.id : slug;
}

export function readerPath(publication: Publication, piece?: Piece) {
  const cover = "/publication/" + encodeURIComponent(publication.id) + "/";
  return piece ? cover + workSlug(publication, piece) + "/" : cover;
}

export interface PublicPage {
  path: string;
  heading: string;
  title: string;
  description: string;
  publication?: Publication;
  piece?: Piece;
}

export function publicPages(publications: Publication[]): PublicPage[] {
  const pages: PublicPage[] = [
    { path: "/", heading: "The New Journal", title: "The New Journal | Writing and art by incarcerated youth and adults", description: mission + " Explore poetry, artwork, film and music in interactive issues." },
    { path: "/gallery/", heading: "Gallery", title: "Gallery | The New Journal", description: "Explore individual poems, artworks, films and songs from the published issues of The New Journal." },
    { path: "/about/", heading: "About", title: "About | The New Journal", description: "The New Journal is an online publication by and for incarcerated youth and adults." },
    { path: "/partners/", heading: "Our partners", title: "Our partners | The New Journal", description: "Meet the organizations that make The New Journal possible and explore their work with incarcerated writers and artists." },
  ];
  for (const publication of publications) {
    const issue = publication.issueNumber ? publication.caption + ", Issue " + publication.issueNumber : publication.caption;
    pages.push({ publication, path: readerPath(publication), heading: publication.caption,
      title: issue + " | The New Journal", description: "Explore " + issue + " of The New Journal. Works include " + publication.pieces.slice(0, 3).map(p => p.title).join(", ") + "." });
    for (const piece of publication.pieces) {
      pages.push({ publication, piece, path: readerPath(publication, piece), heading: piece.title,
        title: piece.title + " | " + issue + " | The New Journal",
        description: medium[piece.type] + " by " + piece.author.replace(/\.$/, "") + ". From " + issue + " of The New Journal." });
    }
  }
  return pages;
}
