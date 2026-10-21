import { useState } from "react";
import type { SongPiece } from "../../data/publications";
import PieceHeader from "./PieceHeader";

interface Props {
  piece: SongPiece;
}

// The editor's preview of a song. It is the only copy on its page, so the browser's own
// audio controls (fully keyboard and screen-reader accessible) are the right player here.
export default function SongView({ piece }: Props) {
  const [failed, setFailed] = useState(false);
  return (
    <div>
      <PieceHeader label="Song" title={piece.title} author={piece.author} glow={piece.glow} />
      <div className="song-view mx-auto max-w-3xl">
        {piece.audioSrc ? (
          <audio
            key={piece.audioSrc}
            className="song-view-audio"
            src={piece.audioSrc}
            controls
            preload="metadata"
            aria-label={`Play ${piece.title}`}
            onError={() => setFailed(true)}
            onLoadedMetadata={() => setFailed(false)}
          />
        ) : (
          <p className="media-unavailable">Audio not yet available.</p>
        )}
        {failed && (
          <p role="alert" className="preview-error mt-4">
            This song could not play. Check that the link opens an audio file, such as an MP3,
            that allows playback from other sites.
          </p>
        )}
        <section className="song-view-transcript" aria-label={`Transcript of ${piece.title}`}>
          <h2>Transcript</h2>
          {piece.transcript.length ? (
            <div className="poem-text font-display space-y-3 text-white/85">
              {piece.transcript.map((line, i) => (
                <p key={i}>{line || " "}</p>
              ))}
            </div>
          ) : (
            <p className="media-unavailable">No transcript has been added for this song.</p>
          )}
        </section>
      </div>
    </div>
  );
}
