import { Route, BrowserRouter, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import NavBar from "./components/NavBar";
import GlowField from "./components/GlowField";
import Home from "./pages/Home";
import About from "./pages/About";
import PublicationViewer from "./pages/PublicationViewer";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/publication/:pubId" element={<PublicationViewer />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <GlowField />
      <NavBar />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
