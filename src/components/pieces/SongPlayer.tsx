import type { CSSProperties } from "react";
import type { SongPiece } from "../../data/publications";
import { useSong } from "../../lib/useSongAudio";

function clock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "--:--";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

function spoken(seconds: number) {
  if (!Number.isFinite(seconds)) return "unknown length";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  const minutes = m ? `${m} minute${m === 1 ? "" : "s"} ` : "";
  return `${minutes}${s} second${s === 1 ? "" : "s"}`;
}

const messages = {
  error:
    "This song could not play. Check that the link opens an audio file, such as an MP3, that allows playback from other sites.",
  blocked: "Your browser blocked playback. Press play to try again.",
};

/**
 * The reader's player for a song. `live` marks the copy of the page a visitor can use;
 * copies drawn while a page turns pass `live={false}` and show the same state, inertly.
 */
export default function SongPlayer({
  song,
  live,
  tone,
}: {
  song: SongPiece;
  live: boolean;
  tone: "dark" | "light";
}) {
  const s = useSong(song);
  const known = Number.isFinite(s.duration) && s.duration > 0;
  const time = known ? Math.min(s.time, s.duration) : s.time;
  const usable = live && !!song.audioSrc;
  const message = s.status === "error" || s.status === "blocked" ? messages[s.status] : "";
  return (
    <div
      className={`song-player is-${tone}`}
      role="group"
      aria-label={`Audio player: ${song.title}`}
      aria-hidden={live ? undefined : true}
      inert={!live}
    >
      {song.audioSrc ? (
        <>
          <div className="song-controls">
            <button
              type="button"
              className="song-play"
              aria-label={`${s.playing ? "Pause" : "Play"} ${song.title}`}
              disabled={!usable}
              onClick={s.toggle}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {s.playing ? <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /> : <path d="M8 5.5v13l10.5-6.5z" />}
              </svg>
            </button>
            <div className="song-track">
              <input
                type="range"
                className="song-seek"
                min={0}
                max={known ? s.duration : 1}
                step="any"
                value={known ? time : 0}
                disabled={!usable || !known}
                aria-label={`Seek in ${song.title}`}
                aria-valuetext={`${spoken(time)} of ${known ? spoken(s.duration) : "unknown length"}`}
                style={{ "--progress": `${known ? (time / s.duration) * 100 : 0}%` } as CSSProperties}
                onChange={(event) => s.seek(Number(event.currentTarget.value))}
              />
              <div className="song-times" aria-hidden="true">
                <span>{clock(time)}</span>
                <span>{known ? clock(s.duration) : "--:--"}</span>
              </div>
            </div>
            <div className="song-volume">
              <button
                type="button"
                className="song-mute"
                aria-label={s.muted ? "Unmute" : "Mute"}
                aria-pressed={s.muted}
                disabled={!usable}
                onClick={s.toggleMute}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
                  {s.muted || s.volume === 0 ? (
                    <path className="song-stroke" d="m15.5 9.5 5 5m0-5-5 5" />
                  ) : (
                    <path className="song-stroke" d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11" />
                  )}
                </svg>
              </button>
              {s.volumeAdjustable && (
                <input
                  type="range"
                  className="song-level"
                  min={0}
                  max={1}
                  step={0.05}
                  value={s.muted ? 0 : s.volume}
                  disabled={!usable}
                  aria-label="Volume"
                  aria-valuetext={`${Math.round((s.muted ? 0 : s.volume) * 100)}%`}
                  style={{ "--progress": `${(s.muted ? 0 : s.volume) * 100}%` } as CSSProperties}
                  onChange={(event) => s.setVolume(Number(event.currentTarget.value))}
                />
              )}
            </div>
          </div>
          <p className="song-status" role={live ? "status" : undefined}>
            {s.pending ? "Loading audio…" : ""}
          </p>
          {message && (
            <p className="song-error" role={live ? "alert" : undefined}>
              {message}
            </p>
          )}
        </>
      ) : (
        <p className="song-unavailable">Audio forthcoming</p>
      )}
    </div>
  );
}
