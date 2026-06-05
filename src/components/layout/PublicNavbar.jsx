import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Github } from "../ui/Icons";
import { useTheme } from "../../hooks/useTheme";
import { Menu, X } from "lucide-react";
import logo from "../../assets/logo.png";

const getInitialIndex = (location) => {
  const path = location.pathname;
  const hash = location.hash;

  if (hash === "#how-it-works") return 2;
  if (hash === "#features") return 1;
  if (path === "/about") return 3;
  return 0; // Default to Home
};

export const PublicNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();

  const activeIndex = getInitialIndex(location);
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const buttonRefs = useRef([]);
  const activePillRef = useRef(null);
  const navRef = useRef(null);
  const glareRef = useRef(null);

  // Function to update the pill position and width
  const updatePill = (index, smooth = true) => {
    const btn = buttonRefs.current[index];
    const activePill = activePillRef.current;
    if (!btn || !activePill) return;

    if (!smooth) {
      activePill.style.transition = "none";
    } else {
      activePill.style.transition =
        "transform 0.48s cubic-bezier(0.25, 1, 0.33, 1.15), width 0.48s cubic-bezier(0.25, 1, 0.33, 1.15), background 0.4s ease, box-shadow 0.4s ease";
    }

    activePill.style.width = `${btn.offsetWidth}px`;
    activePill.style.transform = `translateX(${btn.offsetLeft}px)`;
  };

  // Recalculate pill on activeIndex change
  useEffect(() => {
    // Small timeout to allow layout stability (fonts, etc.)
    const timer = setTimeout(() => {
      updatePill(activeIndex, true);
    }, 50);
    return () => clearTimeout(timer);
  }, [activeIndex]);

  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      updatePill(activeIndex, false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeIndex]);

  // Track cursor movement for liquid glare
  useEffect(() => {
    const navEl = navRef.current;
    const glareEl = glareRef.current;
    if (!navEl || !glareEl) return;

    const handleMouseMove = (e) => {
      const rect = navEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      glareEl.style.setProperty("--x", `${x}px`);
      glareEl.style.setProperty("--y", `${y}px`);
    };

    navEl.addEventListener("mousemove", handleMouseMove);
    return () => navEl.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleScrollToSection = (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleNavClick = (index, item) => {
    setMobileExpanded(false);

    if (item.hash) {
      if (location.pathname === "/") {
        handleScrollToSection(item.hash);
      } else {
        navigate(`/#${item.hash}`);
      }
    } else if (item.modal) {
      navigate(item.path);
    } else if (item.path === "/") {
      if (location.pathname === "/") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        navigate("/");
      }
    } else {
      navigate(item.path);
    }
  };

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Features", path: "/", hash: "features" },
    { label: "How it Works", path: "/", hash: "how-it-works" },
    { label: "About Us", path: "/about" },
  ];

  return (
    <div className="liquid-nav-container">
      <nav
        ref={navRef}
        className={`liquid-nav ${mobileExpanded ? "expanded" : ""}`}
        id="nav"
      >
        <div className="liquid-glare-container">
          <div ref={glareRef} className="liquid-glare" id="glare"></div>
        </div>

        {/* Desktop View Elements */}
        <div className="hidden md:flex items-center w-full">
          {/* Logo and Brand */}
          <Link
            to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="nav-logo-link"
          >
            <div className="w-[32px] h-[32px] rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
              <img
                src={logo}
                alt="RankerHub Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-caesar text-lg tracking-widest text-slate-900 dark:text-white">
              RankerHub
            </span>
          </Link>

          <div className="liquid-divider"></div>

          {/* Navigation Links with Active Sliding Pill */}
          <div className="nav-items">
            <div
              ref={activePillRef}
              className="active-pill"
              id="active-pill"
            ></div>
            {navItems.map((item, idx) => (
              <button
                key={idx}
                ref={(el) => (buttonRefs.current[idx] = el)}
                className={`nav-btn ${activeIndex === idx ? "active" : ""}`}
                onClick={() => handleNavClick(idx, item)}
              >
                <div className="btn-content">
                  <span>{item.label}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="liquid-divider"></div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/indresh404/RankerHub.git"
              target="_blank"
              rel="noopener noreferrer"
              className="theme-btn"
              title="GitHub Repository"
            >
              <Github className="w-5 h-5" />
            </a>

            <button
              className="theme-btn"
              onClick={toggleTheme}
              aria-label="Dark Mode Toggle"
            >
              <div className="theme-icon-wrapper">
                <svg
                  className="sun"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
                <svg
                  className="moon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              </div>
            </button>

            <Link to="/login" className="nav-static-btn">
              Sign In
            </Link>
          </div>
        </div>

        {/* Mobile View Elements */}
        <div className="md:hidden w-full flex flex-col">
          <div className="mobile-header-row">
            {/* Logo */}
            <Link
              to="/"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                setMobileExpanded(false);
              }}
              className="nav-logo-link"
            >
              <div className="w-[30px] h-[30px] rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
                <img
                  src={logo}
                  alt="RankerHub Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-caesar text-base tracking-widest text-slate-900 dark:text-white">
                RankerHub
              </span>
            </Link>

            <div className="flex items-center gap-1">
              {/* Theme Toggle always accessible */}
              <button
                className="theme-btn"
                onClick={toggleTheme}
                aria-label="Dark Mode Toggle"
              >
                <div className="theme-icon-wrapper">
                  <svg
                    className="sun"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                  <svg
                    className="moon"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                </div>
              </button>

              {/* Hamburger Button */}
              <button
                className="theme-btn"
                onClick={() => setMobileExpanded(!mobileExpanded)}
                aria-label="Toggle Navigation Menu"
              >
                {mobileExpanded ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Expanded Menu Dropdown */}
          <div className="mobile-menu-content">
            <div className="w-full h-[1px] bg-slate-200/20 dark:bg-slate-800/20 my-1"></div>
            {navItems.map((item, idx) => (
              <button
                key={idx}
                className={`nav-btn ${activeIndex === idx ? "active" : ""}`}
                onClick={() => handleNavClick(idx, item)}
              >
                <span>{item.label}</span>
              </button>
            ))}
            <div className="w-full h-[1px] bg-slate-200/20 dark:bg-slate-800/20 my-1"></div>
            <div className="flex items-center justify-between px-2 gap-2">
              <a
                href="https://github.com/indresh404/RankerHub.git"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-static-btn flex-1 justify-center border border-slate-200/10"
              >
                GitHub
              </a>
              <Link
                to="/login"
                onClick={() => setMobileExpanded(false)}
                className="nav-static-btn flex-1 justify-center border border-slate-200/10"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default PublicNavbar;
