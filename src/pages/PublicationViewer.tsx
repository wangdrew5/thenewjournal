import { Navigate, useParams } from "react-router-dom";
import { useJournal } from "../lib/useJournal";
import SurrealReader from "../components/surreal/SurrealReader";
import GalleryReader from "../components/gallery/GalleryReader";

// Each issue theme has its own reading engine: the Surreal edition is a
// page-flip book over dreamscapes, the Gallery edition a white-walled
// carousel of hung works.
export default function PublicationViewer() {
  const { pubId } = useParams();
  const { publications } = useJournal();
  const publication = publications.find((p) => p.id === pubId);
  if (!publication || !publication.pieces.length)
    return <Navigate to="/" replace />;
  return publication.theme === "museum" ? (
    <GalleryReader key={publication.id} publication={publication} />
  ) : (
    <SurrealReader key={publication.id} publication={publication} />
  );
}
