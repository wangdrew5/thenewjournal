import { createContext, useContext, useEffect } from "react";
import type { Piece, SongPiece } from "../data/publications";

export type SongStatus = "idle" | "loading" | "ready" | "error" | "blocked";

/** Playback state of the one song the reader currently holds. */
export interface SongLive {
  id: string | null;
  playing: boolean;
  /** Play was asked for and the audio is still loading or buffering. */
  pending: boolean;
  time: number;
  duration: number;
  status: SongStatus;
}

export interface SongAudio {
  live: SongLive;
  volume: number;
  muted: boolean;
  volumeAdjustable: boolean;
  positions: Map<string, number>;
  durations: Map<string, number>;
  select(song: SongPiece | null): void;
  toggle(song: SongPiece): void;
  seek(song: SongPiece, time: number): void;
  setVolume(volume: number): void;
  toggleMute(): void;
}

export const SongAudioContext = createContext<SongAudio | null>(null);

/**
 * A song's playback as any copy of its page should show it. The book draws temporary
 * copies of a page while it turns; they all read this one state, so none of them owns
 * (or restarts) the audio.
 */
export function useSong(song: SongPiece) {
  const audio = useContext(SongAudioContext);
  const active = !!audio && audio.live.id === song.id;
  return {
    playing: active && audio.live.playing,
    pending: active && audio.live.pending,
    status: active ? audio.live.status : ("idle" as SongStatus),
    time: active ? audio.live.time : (audio?.positions.get(song.id) ?? 0),
    duration: active ? audio.live.duration : (audio?.durations.get(song.id) ?? NaN),
    volume: audio?.volume ?? 1,
    muted: audio?.muted ?? false,
    volumeAdjustable: audio?.volumeAdjustable ?? false,
    toggle: () => audio?.toggle(song),
    seek: (time: number) => audio?.seek(song, time),
    setVolume: (volume: number) => audio?.setVolume(volume),
    toggleMute: () => audio?.toggleMute(),
  };
}

/**
 * The page the reader asked for decides which song may sound. Leaving a song's page pauses
 * it (keeping its place for when the reader returns); arriving prepares it without playing.
 */
export function useCurrentSong(piece: Piece | undefined) {
  const select = useContext(SongAudioContext)?.select;
  const song = piece?.type === "song" ? piece : null;
  useEffect(() => {
    select?.(song);
  }, [select, song]);
}
