import { Link, NavLink } from "react-router-dom";
import { motion } from "framer-motion";

const INSTAGRAM_URL = "#";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function NavBar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-3">
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `rounded-full border px-4 py-2 text-sm font-medium tracking-wide transition-all duration-300 ${
                isActive
                  ? "border-cyan/60 bg-cyan/10 text-cyan glow-ring [--glow-color:var(--color-cyan)]"
                  : "border-white/15 text-white/80 hover:border-cyan/50 hover:text-cyan hover:bg-white/5"
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
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/80 transition-colors duration-300 hover:border-pink/60 hover:text-pink hover:bg-pink/10"
          >
            <InstagramIcon />
          </motion.a>
        </div>

        <Link
          to="/"
          className="font-display text-glow-white text-base font-semibold tracking-tight text-white sm:text-lg"
        >
          the new journal
        </Link>
      </nav>
    </header>
  );
}
