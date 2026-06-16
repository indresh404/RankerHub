import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { searchLeaderboard } from "../../utils/searchUtils";

const MobileSearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, query]);

  const hasQuery = query.trim().length > 0;
  const results = useMemo(() => {
    if (!hasQuery) return [];
    return searchLeaderboard(query).slice(0, 5);
  }, [hasQuery, query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onClose();
      setQuery("");
      setShowResults(false);
      navigate(`/gitrank?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleResultClick = (user) => {
    setQuery("");
    setShowResults(false);
    onClose();
    navigate(`/gitrank?search=${encodeURIComponent(user.username)}`);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute inset-0 bg-white dark:bg-slate-950 px-4 flex items-center gap-3 z-50 md:hidden"
    >
      <form onSubmit={handleSubmit} className="flex-1 relative">
        <Search className="w-4.5 h-4.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search leaderboard, focus, or challenges..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(e.target.value.trim().length > 0);
          }}
          autoFocus
          className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition-all"
        />

        <AnimatePresence>
          {showResults && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-2 left-0 right-0 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-lg overflow-hidden z-50"
            >
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
                {results.map((user) => (
                  <button
                    key={user.username}
                    type="button"
                    onClick={() => handleResultClick(user)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3"
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
                        @{user.username}{" • "}{user.language}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {query.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    if (query.trim()) {
                      navigate(`/gitrank?search=${encodeURIComponent(query.trim())}`);
                      setQuery("");
                      setShowResults(false);
                      onClose();
                    }
                  }}
                  className="w-full px-4 py-3 text-sm text-violet-600 dark:text-violet-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold transition-colors border-t border-slate-100 dark:border-slate-800"
                >
                  View all results for &quot;{query}&quot;
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </form>
      <button
        type="button"
        onClick={() => {
          setQuery("");
          setShowResults(false);
          onClose();
        }}
        className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition cursor-pointer"
      >
        <X className="w-5 h-5" />
      </button>
    </motion.div>
  );
};

export default MobileSearch;
