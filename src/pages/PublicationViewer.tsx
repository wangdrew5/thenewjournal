import { Navigate, useParams } from "react-router-dom";
import { useJournal } from "../lib/useJournal";
import SurrealReader from "../components/surreal/SurrealReader";
import GalleryReader from "../components/gallery/GalleryReader";
import { SongAudioProvider } from "../lib/SongAudioProvider";

// Each issue theme has its own reading engine: the Surreal edition is a
// page-flip book over dreamscapes, the Gallery edition a white-walled
// carousel of hung works.
export default function PublicationViewer() {
  const { pubId } = useParams();
  const { publications } = useJournal();
  const publication = publications.find((p) => p.id === pubId);
  if (!publication || !publication.pieces.length)
    return <Navigate to="/" replace />;
  // One audio player per visit to an issue; leaving the issue stops any song.
  return (
    <SongAudioProvider key={publication.id}>
      {publication.theme === "museum" ? (
        <GalleryReader publication={publication} />
      ) : (
        <SurrealReader publication={publication} />
      )}
    </SongAudioProvider>
  );
}
