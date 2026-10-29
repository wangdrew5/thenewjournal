export type IssueTheme = "surreal" | "museum";

export type GlowColor = "green";

export type PieceType = "poem" | "film" | "art" | "song";

interface PieceBase {
  id: string;
  type: PieceType;
  title: string;
  author: string;
  glow: GlowColor;
  /** Who made this page of the journal, credited small in the page footer. */
  pageCreator?: string;
  /** The partner organization (an id from data/partners) whose logo tops the left page. */
  partner?: string;
}

export interface PoemPiece extends PieceBase {
  type: "poem";
  lines: string[];
  editorArtCaption: string;
  editorArtSrc?: string;
  editorArtAlt?: string;
}

export interface FilmPiece extends PieceBase {
  type: "film";
  logline: string;
  videoSrc?: string;
}

export interface ArtPiece extends PieceBase {
  type: "art";
  /** The caption printed beneath the artwork on the left page. */
  imageCaption: string;
  /** Text on the right page; reads as `imageCaption` where absent. */
  pageText?: string;
  /** An SVG signature shown below the right-page text. */
  signatureSrc?: string;
  imageSrc?: string;
  imageAlt?: string;
  editorNote?: string;
}

export interface SongPiece extends PieceBase {
  type: "song";
  /** A direct link to a playable audio file (not a streaming-service page). */
  audioSrc?: string;
  /** Transcript lines; empty strings are the blank lines between verses. */
  transcript: string[];
}

export type Piece = PoemPiece | FilmPiece | ArtPiece | SongPiece;

export interface Publication {
  id: string;
  caption: string;
  theme?: IssueTheme;
  issueNumber?: string;
  coverSrc?: string;
  coverAlt?: string;
  glow: GlowColor;
  pieces: Piece[];
  /** Kept in the codebase but left off the site until it is ready. */
  hidden?: boolean;
}
