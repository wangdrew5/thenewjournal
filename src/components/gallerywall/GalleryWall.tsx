import "./gallerywall.css";

// The Gallery's own room: a dark plaster wall lit by a few picture lights.
export default function GalleryWall() {
  return (
    <div className="gw-wall" aria-hidden="true">
      <div className="gw-light gw-light-a" />
      <div className="gw-light gw-light-b" />
      <div className="gw-light gw-light-c" />
      <div className="gw-floor" />
    </div>
  );
}
