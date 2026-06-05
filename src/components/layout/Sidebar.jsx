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
  ChevronLeft,
  ChevronRight,
  Info,
  HelpCircle,
  Award,
  UsersRound
} from "lucide-react";
import { Github } from "../ui/Icons";
import ThemeToggle from "../ui/ThemeToggle";
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
  UsersRound
};

const isLinkActive = (pathname, path) => {
  if (path === "/dashboard") return pathname === path;
  return pathname === path || pathname.startsWith(`${path}/`);
};

export const Sidebar = ({ isCollapsed, toggleCollapse }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout process error:", error);
    }
  };

  return (
    <>
      <motion.aside
        animate={{ width: isCollapsed ? 76 : 260 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden md:flex flex-col h-screen fixed left-0 top-0 z-40 border-r border-slate-800/50 bg-slate-950 backdrop-blur-xl transition-colors duration-300 text-slate-400"
      >
        {/* Sidebar Header / Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/50">
          <Link to="/" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-slate-900 border border-slate-800/50 shadow-md">
              <img src={logo} alt="RankerHub Logo" className="w-full h-full object-cover" />
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-montserrat font-extrabold text-xl bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-blue-400 tracking-tight"
                >
                  RankerHub
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {/* Collapse Button */}
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg border border-slate-800/50 hover:bg-slate-800/60 text-slate-500 hover:text-slate-200 cursor-pointer"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          {sidebarLinks.map((link) => {
            const IconComponent = iconMap[link.icon] || Home;
            const isActive = isLinkActive(location.pathname, link.path);

            return (
              <Link
                key={link.path}
                to={link.path}
                className="block relative"
              >
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`
                    flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors duration-200 group
                    ${isActive 
                      ? "text-white bg-gradient-to-r from-violet-600 to-indigo-600 shadow-[0_4px_15px_rgba(124,58,237,0.25)]" 
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"}
                  `}
                >
                  <IconComponent className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-violet-400 transition-colors"}`} />
                  
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="truncate"
                    >
                      {link.label}
                    </motion.span>
                  )}

                  {/* Hover Glow Background indicator */}
                  {!isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 group-hover:h-1/2 rounded-full bg-violet-600 transition-all duration-300" />
                  )}
                </motion.div>
              </Link>
            );
          })}


        </div>

        {/* Sidebar Footer / Theme & Logout */}
        <div className="p-3 border-t border-slate-800/50 space-y-2">
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between px-3"} py-2`}>
            {!isCollapsed && (
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Theme
              </span>
            )}
            <ThemeToggle className="w-9 h-9" />
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors duration-200 cursor-pointer group"
          >
            <LogOut className="w-5 h-5 flex-shrink-0 text-red-400 group-hover:text-red-300" />
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="truncate"
              >
                Logout
              </motion.span>
            )}
          </button>
        </div>
      </motion.aside>

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

export default Sidebar;
