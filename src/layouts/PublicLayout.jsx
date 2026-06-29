import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import PublicNavbar from "../components/layout/PublicNavbar";
import PublicFooter from "../components/layout/PublicFooter";

export const PublicLayout = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden flex flex-col">
      {/* Background Premium Animated Blobs (optimized with radial gradients instead of expensive blur filters) */}
      <div className="absolute top-10 left-10 w-72 h-72 md:w-96 md:h-96 bg-blob-purple pointer-events-none animate-blob -z-10 transform-gpu" />
      <div className="absolute top-1/3 right-10 w-72 h-72 md:w-96 md:h-96 bg-blob-indigo pointer-events-none animate-blob [animation-delay:2s] -z-10 transform-gpu" />
      <div className="absolute bottom-10 left-1/3 w-72 h-72 md:w-96 md:h-96 bg-blob-blue pointer-events-none animate-blob [animation-delay:4s] -z-10 transform-gpu" />

      {/* Sticky Public Header */}
      <PublicNavbar />

      {/* Main Content View */}
      <main
        className={
          isHome
            ? "flex-1 w-full min-w-0 relative z-10"
            : "flex-1 max-w-7xl min-w-0 w-full mx-auto p-4 pt-28 md:p-6 md:pt-32 lg:p-8 lg:pt-32 relative z-10"
        }
      >
        <Outlet />
      </main>

      {/* Public Footer */}
      <PublicFooter />
    </div>
  );
};

export default PublicLayout;
