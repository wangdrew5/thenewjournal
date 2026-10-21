import "./table.css";

// The site's backdrop outside the issues: an oak tabletop by a window in daylight.
// Drawn once and fixed behind the page, so scrolling slides things across it.
export default function TableScene() {
  return (
    <div className="table-scene" aria-hidden="true">
      <svg className="table-grain" width="100%" height="100%" preserveAspectRatio="none">
        <filter id="oak-grain" x="0" y="0" width="100%" height="100%">
          {/* Long, stretched noise reads as grain running along the boards */}
          <feTurbulence type="fractalNoise" baseFrequency="0.0015 0.075" numOctaves="5" seed="11" />
          <feColorMatrix values="0 0 0 0 0.24  0 0 0 0 0.13  0 0 0 0 0.05  1.8 0 0 0 -0.7" />
        </filter>
        <filter id="oak-pores" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.6" numOctaves="3" seed="3" />
          <feColorMatrix values="0 0 0 0 0.2  0 0 0 0 0.1  0 0 0 0 0.04  1.8 0 0 0 -0.8" />
        </filter>
        <rect width="100%" height="100%" filter="url(#oak-grain)" />
        <rect width="100%" height="100%" filter="url(#oak-pores)" />
      </svg>
      <div className="table-boards" />
      <div className="table-window">
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="table-vignette" />
    </div>
  );
}
