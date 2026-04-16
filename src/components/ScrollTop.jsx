// src/components/ScrollTop.jsx
import { useEffect, useState } from "react";

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollToTop}
      className="btn"
      style={{
        position: "fixed",
        bottom: "20px",
        left: "20px",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.3s ease-in-out",
        zIndex: 1000,
      }}
      aria-label="Scroll to top"
    >
      ↑ Top
    </button>
  );
}

export default ScrollToTopButton;