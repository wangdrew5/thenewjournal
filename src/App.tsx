import { lazy, Suspense, useEffect } from "react";
import { Link, Navigate, Route, BrowserRouter, Routes, useLocation } from "react-router-dom";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from "framer-motion";
import PageHead from "./components/PageHead";
import NavBar from "./components/NavBar";
import GlowField from "./components/GlowField";
import TableScene from "./components/table/TableScene";
import GalleryWall from "./components/gallerywall/GalleryWall";
import Gallery from "./pages/Gallery";
import Home from "./pages/Home";
import About from "./pages/About";
import Partners from "./pages/Partners";
import { JournalProvider } from "./lib/JournalContext";
import EnterOverlay from "./components/EnterOverlay";

const PublicationViewer = lazy(() => import("./pages/PublicationViewer"));

// The editor is a developer tool: it is only bundled and routed under `npm run dev`.
const Preview = import.meta.env.DEV ? lazy(() => import("./pages/Preview")) : null;

// The public pages sit on a table in daylight; the editor keeps its dark lanterns.
// Issue readers bring their own full-screen backdrop, so neither is drawn there.
const TABLE_PAGES = ["/", "/about", "/partners", "/preview"];

function Backdrop() {
  const pathname = useLocation().pathname.replace(/\/$/, "") || "/";
  const table = TABLE_PAGES.includes(pathname);
  useEffect(() => {
    if (table) document.documentElement.dataset.scene = "table";
    else delete document.documentElement.dataset.scene;
    // The editor is always the dark table, whichever mode the pages use.
    if (pathname === "/preview") document.documentElement.dataset.page = "editor";
    else delete document.documentElement.dataset.page;
  }, [table, pathname]);
  if (pathname.startsWith("/publication/")) return null;
  if (pathname === "/gallery") return <GalleryWall />;
  return table ? <TableScene /> : <GlowField />;
}

function AnimatedRoutes() {
  const location = useLocation();
  const reduced = useReducedMotion();
  // Individual leaves share one mounted reader so page turns and audio keep their state.
  const scene = location.pathname.match(/^\/publication\/[^/]+/)?.[0] ?? location.pathname;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [scene]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={scene}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduced ? 0 : 0.12, ease: "easeInOut" }}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route
            path="/preview"
            element={Preview ? <Suspense fallback={null}><Preview /></Suspense> : <Navigate to="/" replace />}
          />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/about" element={<About />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/publication/:pubId/:slug?" element={<Suspense fallback={null}><PublicationViewer /></Suspense>} />
          <Route path="*" element={<main className="plain-reader"><h1>Page not found</h1><Link to="/">Return to the journal</Link></main>} />
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
          <PageHead />
          <Backdrop />
          <NavBar />
          <AnimatedRoutes />
          <EnterOverlay />
        </BrowserRouter>
      </JournalProvider>
    </MotionConfig>
  );
}
