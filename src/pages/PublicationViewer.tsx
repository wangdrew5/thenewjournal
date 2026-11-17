import { Navigate, useParams, useSearchParams } from "react-router-dom";
import { workSlug } from "../lib/publicPages";
import { useJournal } from "../lib/useJournal";
import SurrealReader from "../components/surreal/SurrealReader";
import GalleryReader from "../components/gallery/GalleryReader";
import { SongAudioProvider } from "../lib/SongAudioProvider";

// Each issue theme has its own reading engine: the Surreal edition is a
// page-flip book over dreamscapes, the Gallery edition a white-walled
// carousel of hung works.
export default function PublicationViewer() {
  const { pubId, slug } = useParams();
  const [query] = useSearchParams();
  const { publications } = useJournal();
  const publication = publications.find((p) => p.id === pubId);
  if (!publication || !publication.pieces.length)
    return <Navigate to="/" replace />;
  if (slug && !publication.pieces.some(piece => workSlug(publication, piece) === slug))
    return <Navigate to={`/publication/${publication.id}/`} replace />;
  // One audio player per visit to an issue; leaving the issue stops any song.
  return (
    <SongAudioProvider key={publication.id}>
      {publication.theme === "museum" || query.get("view") === "gallery" ? (
        <GalleryReader publication={publication} />
      ) : (
        <SurrealReader publication={publication} />
      )}
    </SongAudioProvider>
  );
}
