import { useEffect } from "react";
import { Route, BrowserRouter, Routes, useLocation } from "react-router-dom";
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
import PublicationViewer from "./pages/PublicationViewer";
import Preview from "./pages/Preview";
import { JournalProvider } from "./lib/JournalContext";
import EnterOverlay from "./components/EnterOverlay";

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
          <Route path="/preview" element={<Preview />} />
          <Route path="/about" element={<About />} />
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
        <BrowserRouter>
          <GlowField />
          <NavBar />
          <AnimatedRoutes />
          <EnterOverlay />
        </BrowserRouter>
      </JournalProvider>
    </MotionConfig>
  );
}
