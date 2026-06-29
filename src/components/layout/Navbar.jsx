import MobileSearchInput from "../ui/MobileSearchInput";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Search, Menu, X, Check, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "../ui/ThemeToggle";
import { mockNotifications } from "../../data/activities";
import { useAuth } from "../../context/AuthContext";
import { searchLeaderboard } from "../../utils/searchUtils";

export const Navbar = ({ toggleMobile, isMobileOpen }) => {
  const { user, userData } = useAuth();
  const [notifications, setNotifications] = useState(mockNotifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);
  const greeting = (() => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good morning";
    if (hours < 18) return "Good afternoon";
    return "Good evening";
  })();
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  const hasSearchQuery = searchQuery.trim().length > 0;
  const searchResults = useMemo(() => {
    if (!hasSearchQuery) return [];
    return searchLeaderboard(searchQuery).slice(0, 5);
  }, [hasSearchQuery, searchQuery]);

  const handleSearchChange = (e) => {
    const nextQuery = e.target.value;
    setSearchQuery(nextQuery);
    setShowSearchResults(nextQuery.trim().length > 0);
  };

  // Close notifications dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsMobileSearchOpen(false);
      setShowSearchResults(false);
      // Navigate to GitRank page with search query
      navigate(`/gitrank?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const handleSearchResultClick = (user) => {
    setSearchQuery("");
    setShowSearchResults(false);
    // Navigate to user profile or GitRank with username filter
    navigate(`/gitrank?search=${encodeURIComponent(user.username)}`);
  };

  return (
    <nav className="sticky top-0 z-30 h-16 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md shadow-sm transition-all duration-300 px-4 md:px-6 flex items-center justify-between relative">
      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {isMobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute inset-0 bg-white dark:bg-slate-950 px-4 flex items-center gap-3 z-50 md:hidden"
          >
            <MobileSearchInput onClose={() => setIsMobileSearchOpen(false)} />
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchOpen(false);
                setSearchQuery("");
              }}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left side: Mobile Toggle & Greeting */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobile}
          className="md:hidden p-2 rounded-xl border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
        >
          {isMobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>

        {/* Animated Greeting */}
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden sm:block"
        >
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block leading-none">
            Welcome back
          </span>
          <span className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5 block">
            {greeting},{" "}
            <span className="text-violet-600 dark:text-violet-400 font-extrabold">
              {userData?.name ||
                user?.displayName ||
                userData?.githubUsername ||
                "Developer"}
            </span>{" "}
            👋
          </span>
        </motion.div>
      </div>

      {/* Middle: Search bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="max-w-xs md:max-w-md w-full mx-4 relative hidden md:block"
        ref={searchRef}
      >
        <Search className="w-4.5 h-4.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 z-10" />
        <input
          type="text"
          placeholder="Search leaderboard, languages or challenges..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {showSearchResults && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-2 w-full rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-lg overflow-hidden z-50"
            >
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
                {searchResults.map((user) => (
                  <button
                    key={user.username}
                    type="button"
                    onClick={() => handleSearchResultClick(user)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 group"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        @{user.username}
                        {" • "}
                        {user.language}
                        {" • "}#{user.rank}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                        {user.points} pts
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* View All Results */}
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="w-full px-4 py-3 text-sm text-violet-600 dark:text-violet-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold transition-colors border-t border-slate-100 dark:border-slate-800"
                >
                  View all results for "{searchQuery}"
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Right side: Actions, Theme, Notifications, Profile */}
      <div className="flex items-center gap-3">
        {/* Search toggle for small screens */}
        <button
          onClick={() => setIsMobileSearchOpen(true)}
          className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition cursor-pointer"
        >
          <Search className="w-5 h-5" />
        </button>

        <ThemeToggle />

        {/* Notifications Dropdown Wrapper */}
        <div className="relative" ref={notificationRef}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-700 dark:text-slate-300 w-10 h-10 flex items-center justify-center cursor-pointer hover:shadow-sm relative"
          >
            <Bell className="w-5 h-5" />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-violet-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-950"
                >
                  {unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Notifications Dropdown Panel */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 md:w-96 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-xl overflow-hidden z-50 text-slate-800 dark:text-slate-200"
              >
                {/* Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark all read
                    </button>
                  )}
                </div>

                {/* Items list */}
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-4 transition-colors relative group flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 ${
                          !n.read ? "bg-violet-50/20 dark:bg-violet-500/5" : ""
                        }`}
                      >
                        {/* Red/Green status light */}
                        {!n.read && (
                          <span className="absolute top-4 left-2 w-1.5 h-1.5 rounded-full bg-violet-600" />
                        )}
                        <div className="flex-1 space-y-1 pl-1">
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-xs text-slate-900 dark:text-white leading-tight">
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                              {n.time}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                            {n.description}
                          </p>
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => deleteNotification(n.id)}
                            className="p-1 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                      <p className="text-sm font-semibold">All caught up!</p>
                      <p className="text-xs mt-1">No notifications to show</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="p-3 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-center">
                    <button
                      onClick={() => setNotifications([])}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:underline cursor-pointer flex items-center justify-center gap-1 mx-auto"
                    >
                      Clear all notifications
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Avatar */}
        <Link
          to="/dashboard/profile"
          className="flex items-center gap-2 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl overflow-hidden ring-2 ring-violet-500/20 group-hover:ring-violet-500/50 transition-all duration-200">
            <img
              src={
                userData?.avatar ||
                user?.photoURL ||
                "https://avatars.githubusercontent.com/u/9919?v=4"
              }
              alt="User Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
