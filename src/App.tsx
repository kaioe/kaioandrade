import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CinematicThemeSwitcher from "@/components/ui/cinematic-theme-switcher";
import Home from "./pages/Home";
import FortressSurgicalRedirect from "./pages/FortressSurgicalRedirect";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects/fortresssurgical" element={<FortressSurgicalRedirect />} />
        </Routes>
      </Router>
      {/* Fixed theme switcher in top‑right corner */}
      <div className="fixed top-4 right-4 z-50" style={{ transform: "scale(0.66)", transformOrigin: "top right" }}>
        <CinematicThemeSwitcher />
      </div>
    </>
  );
}

export default App;
