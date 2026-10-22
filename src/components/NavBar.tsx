import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { setColorMode, useColorMode } from "../lib/colorMode";

const INSTAGRAM_URL = "https://www.instagram.com/thenewjournalwa/";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `nav-link flex min-h-11 items-center rounded-full px-2 py-1 text-base font-medium tracking-wide transition-all duration-300 ${
    isActive
      ? "is-active text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]"
      : "text-white/80 hover:text-white hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]"
  }`;

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3" y="3" width="18" height="18" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ModeToggle() {
  const mode = useColorMode();
  const dark = mode === "dark";
  return (
    <button
      type="button"
      className="mode-toggle social-link flex h-11 w-11 items-center justify-center rounded-full text-white/80 transition-colors duration-300 hover:text-white"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={dark}
      onClick={() => setColorMode(dark ? "light" : "dark")}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
          </>
        ) : (
          <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
        )}
      </svg>
    </button>
  );
}

export default function NavBar() {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  // Issues are immersive: each reader brings its own minimal chrome.
  if (pathname.startsWith("/publication/")) return null;
  return (
    <header
      className={`site-header fixed inset-x-0 top-0 z-50 ${scrolled ? "is-scrolled" : ""}`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7 sm:px-10">
        <NavLink to="/" end aria-label="The New Journal home" className={navLinkClass}>
          tnj
        </NavLink>

        <div className="flex items-center gap-3 sm:gap-7">
          <NavLink to="/gallery" className={navLinkClass}>
            Gallery
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
          <NavLink to="/partners" className={navLinkClass}>
            Our partners
          </NavLink>
          <motion.a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            aria-label="The New Journal on Instagram"
            className="social-link flex h-11 w-11 items-center justify-center rounded-full text-white/80 transition-colors duration-300 hover:text-white hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]"
          >
            <InstagramIcon />
          </motion.a>
          <ModeToggle />
        </div>
      </nav>
    </header>
  );
}
