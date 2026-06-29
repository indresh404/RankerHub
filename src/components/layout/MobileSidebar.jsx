import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  LayoutDashboard,
  Sparkles,
  Code2,
  BookOpen,
  User,
  Settings,
  LogOut,
  X,
  Info,
  HelpCircle,
  Award,
  UsersRound,
  Search,
  Activity,
  TrendingUp,
} from "lucide-react";
import { Github } from "../ui/Icons";
import { sidebarLinks } from "../../constants";
import LogoutConfirmModal from "../ui/LogoutConfirmModal";
import logo from "../../assets/logo.png";
import { useAuth } from "../../context/AuthContext";

const iconMap = {
  Home,
  LayoutDashboard,
  Github,
  Sparkles,
  Code2,
  BookOpen,
  User,
  Settings,
  LogOut,
  Info,
  HelpCircle,
  Award,
  UsersRound,
  Search,
  Activity,
  TrendingUp,
};

const isLinkActive = (pathname, path) => {
  if (path === "/dashboard") return pathname === path;
  return pathname === path || pathname.startsWith(`${path}/`);
};

export const MobileSidebar = ({ isOpen, close }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    close();
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Mobile logout failure:", error);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />

            {/* Drawer Sidebar */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 bottom-0 left-0 w-72 max-w-[80vw] z-50 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/50 shadow-2xl flex flex-col md:hidden transition-colors duration-300 text-slate-600 dark:text-slate-400"
            >
              {/* Header */}
              <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800/50">
                <Link
                  to="/"
                  onClick={close}
                  className="flex items-center gap-2.5"
                >
                  <div className="w-[34px] h-[34px] rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 shadow-md">
                    <img
                      src={logo}
                      alt="RankerHub Logo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-montserrat font-extrabold text-lg bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-blue-400 tracking-tight">
                    RankerHub
                  </span>
                </Link>

                {/* Close button */}
                <button
                  onClick={close}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Links */}
              <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
                {sidebarLinks.map((link) => {
                  const IconComponent = iconMap[link.icon] || Home;
                  const isActive = isLinkActive(location.pathname, link.path);

                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={close}
                      className="block relative"
                    >
                      <div
                        className={`
                          flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors duration-205 group
                          ${
                            isActive
                              ? "text-white bg-gradient-to-r from-violet-600 to-indigo-600 shadow-[0_4px_15px_rgba(124,58,237,0.25)]"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/40"
                          }
                        `}
                      >
                        <IconComponent
                          className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400 dark:text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors"}`}
                        />
                        <span>{link.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Logout */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800/50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-red-500 dark:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-500/10 transition-colors cursor-pointer group"
                >
                  <LogOut className="w-5 h-5 text-red-500 dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300 transition-colors" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLogoutConfirm && (
          <LogoutConfirmModal
            onClose={() => setShowLogoutConfirm(false)}
            onConfirm={confirmLogout}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileSidebar;
