import { useState } from "react";
import type { GlowColor } from "../../data/publications";
import { glowVar } from "../../lib/glow";
interface Props {
  glow: GlowColor;
  videoSrc?: string;
}
export default function FilmPlayer({ glow, videoSrc }: Props) {
  const [failed, setFailed] = useState(false);
  if (videoSrc) {
    return (
      <>
        <div
          style={{ "--glow-color": glowVar[glow] } as React.CSSProperties}
          className="glow-ring aspect-video w-full overflow-hidden rounded-3xl bg-black"
        >
          <video
            src={videoSrc}
            controls
            preload="metadata"
            onError={() => setFailed(true)}
            onLoadedData={() => setFailed(false)}
            className="h-full w-full"
          />
        </div>
        {failed && (
          <p role="alert" className="preview-error mt-4">
            This video could not play. Check that the link opens an accessible
            MP4 or WebM file.
          </p>
        )}
      </>
    );
  }
  return <p className="media-unavailable">Video not yet available.</p>;
}
