import React from "react";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import MobileSidebar from "../components/layout/MobileSidebar";
import { useSidebar } from "../hooks/useSidebar";

export const DashboardLayout = () => {
  const {
    isCollapsed,
    isMobileOpen,
    toggleCollapse,
    toggleMobile,
    closeMobile,
  } = useSidebar();

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 relative flex">
      {/* Background Premium Animated Blobs (optimized with radial gradients instead of expensive blur filters) */}
      <div className="absolute top-10 left-10 w-72 h-72 md:w-96 md:h-96 bg-blob-purple pointer-events-none animate-blob -z-10 transform-gpu" />
      <div className="absolute top-1/3 right-10 w-72 h-72 md:w-96 md:h-96 bg-blob-indigo pointer-events-none animate-blob [animation-delay:2s] -z-10 transform-gpu" />
      <div className="absolute bottom-10 left-1/3 w-72 h-72 md:w-96 md:h-96 bg-blob-blue pointer-events-none animate-blob [animation-delay:4s] -z-10 transform-gpu" />

      {/* Collapsible Sidebar (Desktop) */}
      <Sidebar isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />

      {/* Drawer Sidebar (Mobile) */}
      <MobileSidebar isOpen={isMobileOpen} close={closeMobile} />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 min-h-screen transition-[padding-left] duration-300 ease-in-out ${
          isCollapsed ? "md:pl-[76px]" : "md:pl-[260px]"
        }`}
      >
        {/* Navbar */}
        <Navbar toggleMobile={toggleMobile} isMobileOpen={isMobileOpen} />

        {/* Page Container */}
        <motion.main
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto"
          style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
};

export default DashboardLayout;
