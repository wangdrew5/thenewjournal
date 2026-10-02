import { useId } from "react";

// Decorative gallery sculpture used on Gallery edition covers. It is brand
// artwork, separate from contributor work and its attribution.
export default function IssueArtwork() {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      className="issue-artwork gallery-artwork"
      viewBox="0 0 600 650"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-wall`} x2="0" y2="1">
          <stop stopColor="#f9f9f7" />
          <stop offset="1" stopColor="#e4e3df" />
        </linearGradient>
        <linearGradient id={`${id}-plinth`} x2="1" y2=".3">
          <stop stopColor="#fefefe" />
          <stop offset="1" stopColor="#cccac5" />
        </linearGradient>
        <filter id={`${id}-shadow`}>
          <feGaussianBlur stdDeviation="15" />
        </filter>
      </defs>
      <rect width="600" height="650" fill={`url(#${id}-wall)`} />
      <path d="M0 470 600 420V650H0Z" fill="#e9e8e4" />
      <ellipse
        cx="322"
        cy="531"
        rx="151"
        ry="26"
        fill="#292723"
        opacity=".14"
        filter={`url(#${id}-shadow)`}
      />
      <path d="m191 441 166-32 62 45-159 39Z" fill="#fdfdfc" />
      <path d="m191 441 69 52v72l-69-50Z" fill="#d8d6d0" />
      <path d="m260 493 159-39v66l-159 45Z" fill={`url(#${id}-plinth)`} />
      <g
        className="gallery-chair"
        fill="none"
        stroke="#282a28"
        strokeWidth="10"
        strokeLinejoin="round"
      >
        <path d="m255 392 75-15 43 24-71 18Z" fill="#343734" />
        <path d="m255 392-10-146 76-14 9 145" />
        <path d="m248 282 75-15m-73 40 75-15m-72 40 75-15" strokeWidth="5" />
        <path
          d="m258 395-11 58m56-33 1 41m26-82 16 45m27-23 17 43"
          strokeWidth="7"
        />
      </g>
      <rect x="437" y="354" width="50" height="28" fill="#fff" />
      <path d="M445 363h24m-24 5h31m-31 5h18" stroke="#999" strokeWidth="1" />
      <path d="M47 64h43M47 64v43M553 64h-43M553 64v43" stroke="#d4d3ce" />
    </svg>
  );
}
