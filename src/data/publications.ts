export type GlowColor = "green";

export type PieceType = "poem" | "film" | "art";

interface PieceBase {
  id: string;
  type: PieceType;
  title: string;
  author: string;
  glow: GlowColor;
}

export interface PoemPiece extends PieceBase {
  type: "poem";
  lines: string[];
  editorArtCaption: string;
}

export interface FilmPiece extends PieceBase {
  type: "film";
  logline: string;
  videoSrc?: string;
}

export interface ArtPiece extends PieceBase {
  type: "art";
  imageCaption: string;
  editorNote?: string;
}

export type Piece = PoemPiece | FilmPiece | ArtPiece;

export interface Publication {
  id: string;
  caption: string;
  glow: GlowColor;
  pieces: Piece[];
}

export const publications: Publication[] = [
  {
    id: "pub-1",
    caption: "Untitled Publication — coming soon",
    glow: "green",
    pieces: [
      {
        id: "pub-1-poem-1",
        type: "poem",
        title: "Untitled",
        author: "Anonymous",
        glow: "green",
        lines: [
          "Some nights the ceiling turns into a sky,",
          "and I count the cracks like stars.",
          "I am learning the language of waiting,",
          "how patience can sound like a held breath.",
          "Somewhere outside these walls,",
          "a season is changing without me,",
          "but I am changing too,",
          "quietly, in ways no one has named yet.",
        ],
        editorArtCaption: "Editor illustration — placeholder",
      },
      {
        id: "pub-1-film-1",
        type: "film",
        title: "Untitled",
        author: "Anonymous",
        glow: "green",
        logline: "A short film — embed coming soon.",
      },
      {
        id: "pub-1-art-1",
        type: "art",
        title: "Untitled",
        author: "Anonymous",
        glow: "green",
        imageCaption: "Artwork placeholder",
        editorNote:
          "Editor's note — a short reflection from our editorial team on this piece will go here.",
      },
      {
        id: "pub-1-poem-2",
        type: "poem",
        title: "Untitled",
        author: "Anonymous",
        glow: "green",
        lines: [
          "They ask what I'm made of.",
          "I say paper and static,",
          "unopened letters,",
          "a name that used to fit different.",
          "I am still writing myself",
          "into a shape I recognize.",
        ],
        editorArtCaption: "Editor illustration — placeholder",
      },
      {
        id: "pub-1-film-2",
        type: "film",
        title: "Untitled",
        author: "Anonymous",
        glow: "green",
        logline: "A visual poem in motion — embed coming soon.",
      },
    ],
  },
];
