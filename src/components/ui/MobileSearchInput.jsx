import { useState, useRef } from "react";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { searchLeaderboard } from "../../utils/searchUtils";

const MobileSearchInput = ({ onClose }) => {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const searchResults = query.trim().length > 0
    ? searchLeaderboard(query).slice(0, 5)
    : [];

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setShowResults(val.trim().length > 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/gitrank?search=${encodeURIComponent(query)}`);
      onClose();
    }
  };

  const handleResultClick = (user) => {
    navigate(`/gitrank?search=${encodeURIComponent(user.username)}`);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 relative">
      <Search className="w-4.5 h-4.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search leaderboard, focus, or challenges..."
        value={query}
        onChange={handleChange}
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition-all"
      />

      <AnimatePresence>
        {showResults && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 right-0 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-lg overflow-hidden z-50"
          >
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
              {searchResults.map((user) => (
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
                type="submit"
                className="w-full px-4 py-3 text-sm text-violet-600 dark:text-violet-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold transition-colors border-t border-slate-100 dark:border-slate-800"
              >
                View all results
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
};

export default MobileSearchInput;