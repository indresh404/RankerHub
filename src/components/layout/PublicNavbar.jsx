import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Github } from "../ui/Icons";
import ThemeToggle from "../ui/ThemeToggle";
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

  // Compute activeIndex from location, but allow scroll observer to override
  const locationBasedIndex = useMemo(() => getInitialIndex(location), [location]);
  const [scrollBasedIndex, setScrollBasedIndex] = useState(null);
  
  // Use scroll-based index if available, otherwise use location-based
  const activeIndex = scrollBasedIndex !== null ? scrollBasedIndex : locationBasedIndex;
  
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const isScrollingRef = useRef(false);
  const prevPathnameRef = useRef(location.pathname);

  const buttonRefs = useRef([]);
  const activePillRef = useRef(null);
  const navRef = useRef(null);
  const glareRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileExpanded && navRef.current && !navRef.current.contains(event.target)) {
        setMobileExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileExpanded]);

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
    // Reset scroll-based tracking when leaving home page
    if (prevPathnameRef.current === "/" && location.pathname !== "/") {
      setScrollBasedIndex(null);
    }
    prevPathnameRef.current = location.pathname;

    // Small timeout to allow layout stability (fonts, etc.)
    const timer = setTimeout(() => {
      updatePill(activeIndex, true);
    }, 50);
    return () => clearTimeout(timer);
  }, [activeIndex, location.pathname]);

  // Intersection Observer to track visible sections on scroll
  useEffect(() => {
    // Only observe on home page
    if (location.pathname !== "/") return;

    const sections = [
      { id: "features", index: 1 },
      { id: "how-it-works", index: 2 },
    ];

    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px", // Trigger when section is in upper portion of viewport
      threshold: 0,
    };

    const observerCallback = (entries) => {
      // Only update if not programmatically scrolling
      if (isScrollingRef.current) return;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const section = sections.find((s) => s.id === entry.target.id);
          if (section) {
            setScrollBasedIndex(section.index);
            // Update URL hash without triggering navigation
            window.history.replaceState(null, null, `#${section.id}`);
          }
        }
      });

      // Handle when scrolled to top (no sections intersecting)
      const anyIntersecting = entries.some((entry) => entry.isIntersecting);
      if (!anyIntersecting && window.scrollY < 100) {
        setScrollBasedIndex(0);
        window.history.replaceState(null, null, "/");
      }
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all sections
    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [location.pathname]);

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
      // Set flag to prevent intersection observer from interfering
      isScrollingRef.current = true;
      
      element.scrollIntoView({ behavior: "smooth" });
      
      // Clear flag after scroll completes
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 1000);
    }
  };

  const handleNavClick = (index, item) => {
    setMobileExpanded(false);

    if (item.hash) {
      if (location.pathname === "/") {
        // Update URL hash first
        window.history.pushState(null, null, `#${item.hash}`);
        // Update scroll-based index
        setScrollBasedIndex(index);
        // Then scroll
        handleScrollToSection(item.hash);
      } else {
        navigate(`/#${item.hash}`);
      }
    } else if (item.modal) {
      navigate(item.path);
    } else if (item.path === "/") {
      if (location.pathname === "/") {
        // Clear hash and scroll to top
        window.history.pushState(null, null, "/");
        setScrollBasedIndex(0);
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
              <img src={logo} alt="RankerHub Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-caesar text-lg tracking-widest text-slate-900 dark:text-white">
              RankerHub
            </span>
          </Link>

          <div className="liquid-divider"></div>

          {/* Navigation Links with Active Sliding Pill */}
          <div className="nav-items">
            <div ref={activePillRef} className="active-pill" id="active-pill"></div>
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

            <ThemeToggle className="!w-9 !h-9" />

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
                <img src={logo} alt="RankerHub Logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-caesar text-base tracking-widest text-slate-900 dark:text-white">
                RankerHub
              </span>
            </Link>

            <div className="flex items-center gap-1">
              {/* Theme Toggle always accessible */}
            <ThemeToggle className="!w-9 !h-9" />

              {/* Hamburger Button */}
              <button
                className="theme-btn"
                onClick={() => setMobileExpanded(!mobileExpanded)}
                aria-label="Toggle Navigation Menu"
              >
                {mobileExpanded ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
