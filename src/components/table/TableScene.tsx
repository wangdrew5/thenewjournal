import "./table.css";

// The site's backdrop outside the issues: an oak tabletop by a window in daylight.
// Drawn once and fixed behind the page, so scrolling slides things across it.
export default function TableScene() {
  return (
    <div className="table-scene" aria-hidden="true">
      <svg className="table-grain" width="100%" height="100%" preserveAspectRatio="none">
        <defs>
          {/* Growth lines at two spacings, so the grain never looks ruled */}
          <pattern id="oak-lines-a" width="2400" height="13" patternUnits="userSpaceOnUse">
            <rect y="0" width="2400" height="1.3" fill="#5a3214" fillOpacity="0.3" />
            <rect y="7" width="2400" height="0.7" fill="#5a3214" fillOpacity="0.16" />
          </pattern>
          <pattern id="oak-lines-b" width="2400" height="37" patternUnits="userSpaceOnUse">
            <rect y="3" width="2400" height="3" fill="#4a280f" fillOpacity="0.16" />
            <rect y="21" width="2400" height="1.2" fill="#fff1d6" fillOpacity="0.16" />
          </pattern>
          {/* Low, stretched noise bends the straight lines into flowing grain */}
          <filter id="oak-warp" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.0014 0.012" numOctaves="3" seed="8" />
            <feDisplacementMap in="SourceGraphic" scale="80" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          {/* Broad light and dark streaks in the timber */}
          <filter id="oak-tone" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.0012 0.02" numOctaves="3" seed="11" />
            <feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.16  0 0 0 0 0.06  1.3 0 0 0 -0.55" />
          </filter>
          <filter id="oak-pores" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.015 0.7" numOctaves="2" seed="3" />
            <feColorMatrix values="0 0 0 0 0.2  0 0 0 0 0.1  0 0 0 0 0.04  1.5 0 0 0 -0.74" />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#oak-tone)" />
        <g filter="url(#oak-warp)">
          <rect x="-5%" y="-5%" width="110%" height="110%" fill="url(#oak-lines-a)" />
          <rect x="-5%" y="-5%" width="110%" height="110%" fill="url(#oak-lines-b)" />
        </g>
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
