import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { SongPiece } from "../data/publications";
import { SongAudioContext, type SongLive } from "./useSongAudio";

const IDLE: SongLive = { id: null, playing: false, pending: false, time: 0, duration: NaN, status: "idle" };

// One audio element per reader visit. Pages, and the copies of them drawn while the book
// turns, only display and steer it, so a turn can never duplicate or restart a song, and
// only one song can ever sound. Leaving the reader unmounts this and stops playback.
export function SongAudioProvider({ children }: { children: ReactNode }) {
  const audio = useRef<HTMLAudioElement>(null);
  const current = useRef<{ id: string; src?: string } | null>(null);
  // A saved position waiting for the new source's metadata before it can be applied.
  const pendingSeek = useRef<number | null>(null);
  const [positions] = useState(() => new Map<string, number>());
  const [durations] = useState(() => new Map<string, number>());
  const [live, setLive] = useState<SongLive>(IDLE);
  const [volume, setVolumeState] = useState(1);
  const [muted, setMuted] = useState(false);
  const [volumeAdjustable, setVolumeAdjustable] = useState(false);

  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    // iOS ties media volume to the hardware buttons and ignores this property.
    el.volume = 0.5;
    setVolumeAdjustable(el.volume === 0.5);
    el.volume = 1;
    const id = () => current.current?.id ?? null;
    const patch = (next: Partial<SongLive>) =>
      setLive((l) => (l.id !== null && l.id === id() ? { ...l, ...next } : l));
    const handlers: Record<string, () => void> = {
      loadedmetadata: () => {
        const at = pendingSeek.current;
        if (at !== null) {
          pendingSeek.current = null;
          if (Math.abs(el.currentTime - at) > 0.25) el.currentTime = at;
        }
        handlers.durationchange();
        patch({ status: "ready" });
      },
      durationchange: () => {
        const key = id();
        if (key && Number.isFinite(el.duration)) durations.set(key, el.duration);
        patch({ duration: el.duration });
      },
      timeupdate: () => {
        const key = id();
        // A fresh source reports 0 before the saved position is restored; ignore it.
        if (!key || pendingSeek.current !== null) return;
        positions.set(key, el.currentTime);
        patch({ time: el.currentTime });
      },
      play: () => patch({ playing: true, pending: el.readyState < 3 }),
      playing: () => patch({ playing: true, pending: false, status: "ready" }),
      waiting: () => patch({ pending: !el.paused }),
      pause: () => patch({ playing: false, pending: false }),
      ended: () => patch({ playing: false, pending: false }),
      error: () => patch({ playing: false, pending: false, status: "error" }),
      volumechange: () => {
        setVolumeState(el.volume);
        setMuted(el.muted);
      },
    };
    for (const [type, fn] of Object.entries(handlers)) el.addEventListener(type, fn);
    return () => {
      for (const [type, fn] of Object.entries(handlers)) el.removeEventListener(type, fn);
      el.pause();
      el.removeAttribute("src");
      el.load();
      // Forget the selection with the source, so a remount (React's development
      // double-mount included) loads the song again instead of keeping an empty player.
      current.current = null;
      pendingSeek.current = null;
      setLive(IDLE);
    };
  }, [positions, durations]);

  const select = useCallback(
    (song: SongPiece | null) => {
      const el = audio.current;
      if (!el) return;
      const cur = current.current;
      if (cur && cur.id !== song?.id) {
        // Record exactly where the outgoing song stopped; periodic updates can lag.
        if (pendingSeek.current === null && el.currentSrc) positions.set(cur.id, el.currentTime);
        if (!el.paused) el.pause();
      }
      // Keep the paused song loaded, so coming back to its page resumes where it was.
      if (!song || (cur?.id === song.id && cur.src === song.audioSrc)) return;
      current.current = { id: song.id, src: song.audioSrc };
      const at = positions.get(song.id) ?? 0;
      pendingSeek.current = song.audioSrc && at > 0 ? at : null;
      if (song.audioSrc) {
        el.src = song.audioSrc;
        if (at > 0) el.currentTime = at;
      } else {
        el.removeAttribute("src");
        el.load();
      }
      setLive({
        id: song.id,
        playing: false,
        pending: false,
        time: at,
        duration: durations.get(song.id) ?? NaN,
        status: song.audioSrc ? "loading" : "error",
      });
    },
    [positions, durations],
  );

  const toggle = useCallback(
    (song: SongPiece) => {
      const el = audio.current;
      if (!el || !song.audioSrc) return;
      select(song);
      if (!el.paused) {
        el.pause();
        return;
      }
      if (el.error) {
        // Try the link again after a failure, from the same place.
        const at = positions.get(song.id) ?? 0;
        pendingSeek.current = at > 0 ? at : null;
        el.load();
        if (at > 0) el.currentTime = at;
      }
      setLive((l) => (l.id === song.id ? { ...l, pending: true, status: l.status === "ready" ? "ready" : "loading" } : l));
      el.play().catch((error: DOMException) => {
        // A pause or a new source interrupting play() is not a failure.
        if (error.name === "AbortError") return;
        setLive((l) =>
          l.id === song.id
            ? { ...l, playing: false, pending: false, status: error.name === "NotAllowedError" ? "blocked" : "error" }
            : l,
        );
      });
    },
    [select, positions],
  );

  const seek = useCallback(
    (song: SongPiece, time: number) => {
      const el = audio.current;
      positions.set(song.id, time);
      if (!el || current.current?.id !== song.id || !song.audioSrc) return;
      if (pendingSeek.current !== null) pendingSeek.current = time;
      el.currentTime = time;
      setLive((l) => (l.id === song.id ? { ...l, time } : l));
    },
    [positions],
  );

  const setVolume = useCallback((value: number) => {
    const el = audio.current;
    if (!el) return;
    el.volume = Math.min(1, Math.max(0, value));
    if (value > 0 && el.muted) el.muted = false;
  }, []);

  const toggleMute = useCallback(() => {
    const el = audio.current;
    if (el) el.muted = !el.muted;
  }, []);

  const value = useMemo(
    () => ({ live, volume, muted, volumeAdjustable, positions, durations, select, toggle, seek, setVolume, toggleMute }),
    [live, volume, muted, volumeAdjustable, positions, durations, select, toggle, seek, setVolume, toggleMute],
  );
  return (
    <SongAudioContext.Provider value={value}>
      <audio ref={audio} preload="metadata" hidden />
      {children}
    </SongAudioContext.Provider>
  );
}
