import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, BrowserRouter, Routes, useLocation } from "react-router-dom";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from "framer-motion";
import NavBar from "./components/NavBar";
import GlowField from "./components/GlowField";
import Home from "./pages/Home";
import About from "./pages/About";
import Partners from "./pages/Partners";
import PublicationViewer from "./pages/PublicationViewer";
import { JournalProvider } from "./lib/JournalContext";
import EnterOverlay from "./components/EnterOverlay";

// The editor is a developer tool: it is only bundled and routed under `npm run dev`.
const Preview = import.meta.env.DEV ? lazy(() => import("./pages/Preview")) : null;

// Issue readers bring their own full-screen backdrop, so the lanterns would only
// burn blur and flicker work out of sight behind them.
function Backdrop() {
  return useLocation().pathname.startsWith("/publication/") ? null : <GlowField />;
}

function AnimatedRoutes() {
  const location = useLocation();
  const reduced = useReducedMotion();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduced ? 0 : 0.2, ease: "easeInOut" }}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route
            path="/preview"
            element={Preview ? <Suspense fallback={null}><Preview /></Suspense> : <Navigate to="/" replace />}
          />
          <Route path="/about" element={<About />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/publication/:pubId" element={<PublicationViewer />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <JournalProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || undefined}>
          <Backdrop />
          <NavBar />
          <AnimatedRoutes />
          <EnterOverlay />
        </BrowserRouter>
      </JournalProvider>
    </MotionConfig>
  );
}
