import { Link, NavLink } from "react-router-dom";
import { motion } from "framer-motion";

const INSTAGRAM_URL = "#";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function NavBar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7 sm:px-10">
        <Link
          to="/"
          className="font-display text-glow-white text-xl font-bold tracking-tight text-white sm:text-2xl"
        >
          The New Journal
        </Link>

        <div className="flex items-center gap-7">
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `rounded-full px-2 py-1 text-base font-medium tracking-wide transition-all duration-300 ${
                isActive
                  ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]"
                  : "text-white/80 hover:text-white hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]"
              }`
            }
          >
            About
          </NavLink>

          <motion.a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Instagram"
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors duration-300 hover:text-white hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]"
          >
            <InstagramIcon />
          </motion.a>
        </div>
      </nav>
    </header>
  );
}
