import { useState, useEffect } from "react";

export const useSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    return saved ? JSON.parse(saved) : false;
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Automatically collapse sidebar on tablet/narrow screens, and reset mobile drawer on resize.
  // On wider (desktop) screens, do not override the user's persisted collapse preference.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);
  const toggleMobile = () => setIsMobileOpen((prev) => !prev);
  const closeMobile = () => setIsMobileOpen(false);

  return {
    isCollapsed,
    isMobileOpen,
    toggleCollapse,
    toggleMobile,
    closeMobile,
    setIsCollapsed,
  };
};
