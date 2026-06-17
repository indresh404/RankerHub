import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search as SearchIcon, 
  Filter, 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck, 
  RefreshCw, 
  GitPullRequest, 
  AlertCircle, 
  Info,
  Layers,
  ArrowRight
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import GradientButton from "../components/ui/GradientButton";

// Supported Languages and GitHub API filters
const LANGUAGES = [
  { id: "javascript", label: "JavaScript", color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/25" },
  { id: "typescript", label: "TypeScript", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25" },
  { id: "python", label: "Python", color: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25" },
  { id: "go", label: "Go", color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25" },
  { id: "rust", label: "Rust", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25" },
  { id: "java", label: "Java", color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25" },
  { id: "cpp", label: "C++", color: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/25" },
  { id: "ruby", label: "Ruby", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25" }
];

// Difficulty definitions mapped to GitHub Labels
const DIFFICULTIES = [
  { id: "easy", label: "Beginner", githubLabel: "good first issue", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/25" },
  { id: "medium", label: "Intermediate", githubLabel: "help wanted", color: "text-amber-500 bg-amber-500/10 border-amber-500/25" },
  { id: "hard", label: "Advanced", githubLabel: "bug", color: "text-rose-500 bg-rose-500/10 border-rose-500/25" }
];

// High-quality static fallbacks when API is rate-limited
const STATIC_FALLBACK_ISSUES = [
  {
    id: 101,
    title: "Implement automated dark mode preferences detection",
    html_url: "https://github.com/facebook/react/issues",
    repository: { name: "react", owner: { login: "facebook" }, stargazers_count: 224000 },
    created_at: new Date().toISOString(),
    labels: [{ name: "good first issue", color: "0e8a16" }, { name: "component: dark-mode", color: "fbca04" }],
    user: { login: "gaearon", avatar_url: "https://github.com/identicons/gaearon.png" }
  },
  {
    id: 102,
    title: "Refactor core caching utilities to support multiple adapters",
    html_url: "https://github.com/django/django/issues",
    repository: { name: "django", owner: { login: "django" }, stargazers_count: 76000 },
    created_at: new Date().toISOString(),
    labels: [{ name: "help wanted", color: "128A0C" }, { name: "cleanup", color: "0052cc" }],
    user: { login: "tiangolo", avatar_url: "https://github.com/identicons/tiangolo.png" }
  },
  {
    id: 103,
    title: "Resolve memory leaks in WebSocket listener cleanup cycles",
    html_url: "https://github.com/nestjs/nest/issues",
    repository: { name: "nest", owner: { login: "nestjs" }, stargazers_count: 61000 },
    created_at: new Date().toISOString(),
    labels: [{ name: "bug", color: "d93f0b" }, { name: "p2", color: "8f8f8f" }],
    user: { login: "kamilmysliwiec", avatar_url: "https://github.com/identicons/kamilmysliwiec.png" }
  }
];

export const Matchmaker = () => {
  const { user, ghAccessToken } = useAuth();

  // Selected State
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [selectedDifficulty, setSelectedDifficulty] = useState("easy");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("explore"); // explore | bookmarks

  // API State
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rateLimited, setRateLimited] = useState(false);

  // Bookmarks State (Stored locally)
  const safeLoadBookmarks = (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      localStorage.removeItem(key);
      return [];
    }
  };

  const [bookmarks, setBookmarks] = useState(() => {
    const userKey = `matchmaker_bookmarks_${user?.uid || "guest"}`;
    if (user?.uid) {
      const saved = safeLoadBookmarks(userKey);
      if (saved.length === 0) {
        const guestSaved = safeLoadBookmarks("matchmaker_bookmarks_guest");
        if (guestSaved.length > 0) {
          localStorage.setItem(userKey, JSON.stringify(guestSaved));
          localStorage.removeItem("matchmaker_bookmarks_guest");
          return guestSaved;
        }
      }
      return saved;
    }
    return safeLoadBookmarks(userKey);
  });

  // Save Bookmarks to localStorage when updated
  useEffect(() => {
    const key = `matchmaker_bookmarks_${user?.uid || "guest"}`;
    try {
      localStorage.setItem(key, JSON.stringify(bookmarks));
    } catch {
      console.warn("Failed to save bookmarks to localStorage");
    }
  }, [bookmarks, user]);

  // GitHub Search API Caller
  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError("");
    setRateLimited(false);

    // Retrieve authentication token if available
    const headers = ghAccessToken ? { Authorization: `token ${ghAccessToken}` } : {};

    // Get current parameters
    const difficultyObj = DIFFICULTIES.find(d => d.id === selectedDifficulty) || DIFFICULTIES[0];
    
    // Construct Query String
    let queryParts = [
      "is:issue",
      "state:open",
      `label:"${difficultyObj.githubLabel}"`,
      `language:${selectedLanguage}`
    ];
    if (searchQuery.trim()) {
      queryParts.push(searchQuery.trim());
    }
    const qString = encodeURIComponent(queryParts.join(" "));

    try {
      const response = await axios.get(
        `https://api.github.com/search/issues?q=${qString}&sort=created&order=desc&per_page=15`,
        { headers }
      );
      
      const parsedIssues = (response.data?.items || []).map(item => {
        // Parse repo owner/name from repository_url
        const parts = item.repository_url.split("/repos/");
        const repoFullName = parts[1] || "";
        const [owner, repoName] = repoFullName.split("/");

        return {
          id: item.id,
          title: item.title,
          html_url: item.html_url,
          created_at: item.created_at,
          labels: item.labels || [],
          user: item.user || {},
          repository: {
            name: repoName || "Unknown Repo",
            owner: { login: owner || "Unknown Owner" },
            stargazers_count: 0
          }
        };
      });

      setIssues(parsedIssues);
    } catch (err) {
      console.error("Failed to query GitHub Issues:", err);
      const status = err?.response?.status;
      if (status === 403 || status === 429) {
        setRateLimited(true);
        setIssues(STATIC_FALLBACK_ISSUES);
        setError("GitHub API rate limit exceeded. Displaying placeholder recommendation issues.");
      } else {
        setError("An error occurred while fetching issues. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedLanguage, selectedDifficulty, searchQuery, user, ghAccessToken]);

  // Load issues on initial component mounting
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchIssues();
  }, [fetchIssues]);

  // Toggle bookmark function
  const toggleBookmark = (issue) => {
    setBookmarks(prev => {
      const isBookmarked = prev.some(item => item.id === issue.id);
      if (isBookmarked) {
        return prev.filter(item => item.id !== issue.id);
      } else {
        return [...prev, issue];
      }
    });
  };

  const isBookmarked = (issueId) => bookmarks.some(item => item.id === issueId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <SectionHeader 
        title="Open-Source Issue Matchmaker"
        subtitle="Find open-source bugs and good first issues matching your skillset. Save issues and start contributing."
        badge="Recommendation Engine"
        badgeColor="bg-violet-500/10 text-violet-500 dark:text-violet-400 border border-violet-500/20"
      />

      {/* Explorer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Filters Panel */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-violet-500" /> Filters
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Interactive</span>
            </div>

            {/* Custom search query */}
            <div className="space-y-2">
              <label htmlFor="issue-search-input" className="block text-xs font-bold text-slate-400 uppercase">Search Keywords</label>
              <div className="relative">
                <input
                  id="issue-search-input"
                  type="text"
                  placeholder="e.g. documentation, theme..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchIssues()}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/40 text-slate-850 dark:text-slate-100 font-medium"
                />
                <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Language Selection */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-slate-400 uppercase">Languages</label>
              <div className="grid grid-cols-1 gap-1.5">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.id}
                    id={`lang-btn-${lang.id}`}
                    onClick={() => setSelectedLanguage(lang.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold text-left border transition-all duration-300 flex items-center justify-between cursor-pointer ${
                      selectedLanguage === lang.id
                        ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/20"
                        : "bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 border-slate-200/50 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <span>{lang.label}</span>
                    {selectedLanguage === lang.id && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Selection */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-slate-400 uppercase">Difficulty</label>
              <div className="grid grid-cols-1 gap-1.5">
                {DIFFICULTIES.map(diff => (
                  <button
                    key={diff.id}
                    id={`diff-btn-${diff.id}`}
                    onClick={() => setSelectedDifficulty(diff.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold text-left border transition-all duration-300 flex items-center justify-between cursor-pointer ${
                      selectedDifficulty === diff.id
                        ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/20"
                        : "bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 border-slate-200/50 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <span>{diff.label}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold ${diff.color}`}>
                      {diff.id}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Refresh Action */}
            <GradientButton
              id="matchmaker-refresh-btn"
              onClick={fetchIssues}
              disabled={loading}
              className="w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Query GitHub
            </GradientButton>
          </Card>
        </div>

        {/* Right Dashboard Results View */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200/60 dark:border-slate-800/60 pb-px gap-6">
            <button
              id="tab-explore"
              onClick={() => setActiveTab("explore")}
              className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === "explore"
                  ? "border-violet-500 text-slate-900 dark:text-white font-extrabold"
                  : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              Explore Feed
            </button>
            <button
              id="tab-bookmarks"
              onClick={() => setActiveTab("bookmarks")}
              className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "bookmarks"
                  ? "border-violet-500 text-slate-900 dark:text-white font-extrabold"
                  : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              Bookmarked ({bookmarks.length})
            </button>
          </div>

          {/* Messages and Notifications */}
          {rateLimited && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold">
              <Info className="w-4.5 h-4.5 flex-shrink-0" />
              <span>GitHub API rate limit reached. Displaying simulated backup challenges. Verify your auth connection later.</span>
            </div>
          )}

          {error && !rateLimited && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold">
              <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Cards container */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-20 flex flex-col items-center justify-center space-y-3"
                >
                  <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Auditing open-source arena...</span>
                </motion.div>
              ) : activeTab === "explore" ? (
                // Explore list
                issues.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-16 text-center text-slate-400 space-y-2 bg-slate-900/5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800"
                  >
                    <Layers className="w-10 h-10 mx-auto opacity-25 text-violet-500 animate-pulse" />
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">No active issues found</h4>
                    <p className="text-xs max-w-xs mx-auto leading-relaxed font-medium">Try broadening your custom keywords filter or choosing another programming language.</p>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 gap-4"
                  >
                    {issues.map((issue) => (
                      <Card 
                        key={issue.id} 
                        className="p-5 border-slate-200/60 dark:border-slate-850 hover:border-violet-500/30 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                      >
                        <div className="space-y-2 flex-1 min-w-0">
                          {/* Top Row: Owner / Repo */}
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <GitPullRequest className="w-3.5 h-3.5 text-violet-500" />
                            <span className="hover:underline cursor-pointer">{issue.repository?.owner?.login}</span>
                            <span>/</span>
                            <span className="text-slate-550 dark:text-slate-350 hover:underline cursor-pointer font-extrabold">{issue.repository?.name}</span>
                          </div>

                          {/* Issue Title */}
                          <a 
                            href={issue.html_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block font-black text-sm text-slate-900 dark:text-white hover:text-violet-500 dark:hover:text-violet-400 leading-snug transition-colors line-clamp-2 my-0"
                          >
                            {issue.title}
                          </a>

                          {/* Label Badges */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {issue.labels.slice(0, 4).map((label, labelIdx) => (
                              <span
                                key={labelIdx}
                                className="px-2 py-0.5 rounded text-[8px] font-bold border"
                                style={{
                                  backgroundColor: `#${label.color}15`,
                                  color: `#${label.color}`,
                                  borderColor: `#${label.color}35`
                                }}
                              >
                                {label.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Right Details / CTA */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0">
                          <div className="flex items-center gap-2">
                            {issue.user?.avatar_url && (
                              <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                                <img src={issue.user.avatar_url} alt={issue.user.login} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <span className="text-[11px] font-bold text-slate-400">@{issue.user?.login}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              id={`bookmark-btn-${issue.id}`}
                              onClick={() => toggleBookmark(issue)}
                              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                                isBookmarked(issue.id)
                                  ? "bg-violet-500/10 text-violet-500 border-violet-500/35"
                                  : "bg-slate-50 dark:bg-slate-950/40 text-slate-400 border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-900"
                              }`}
                              title={isBookmarked(issue.id) ? "Remove Bookmark" : "Bookmark Issue"}
                            >
                              {isBookmarked(issue.id) ? <BookmarkCheck className="w-4 h-4 stroke-[2.5]" /> : <Bookmark className="w-4 h-4" />}
                            </button>

                            <a
                              id={`open-issue-btn-${issue.id}`}
                              href={issue.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl bg-violet-600 hover:bg-violet-750 text-white shadow-lg shadow-violet-600/15 transition-all flex items-center justify-center"
                              title="Open on GitHub"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </motion.div>
                )
              ) : (
                // Bookmarks list
                bookmarks.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-16 text-center text-slate-400 space-y-2 bg-slate-900/5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800"
                  >
                    <Bookmark className="w-10 h-10 mx-auto opacity-25 text-violet-500 animate-pulse" />
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Your bookmark list is empty</h4>
                    <p className="text-xs max-w-xs mx-auto leading-relaxed font-medium">Bookmark issues in the Explore tab to save them for easy reference while developing.</p>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 gap-4"
                  >
                    {bookmarks.map((issue) => (
                      <Card 
                        key={issue.id} 
                        className="p-5 border-slate-200/60 dark:border-slate-850 hover:border-violet-500/30 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-2 flex-1 min-w-0">
                          {/* Top Row: Owner / Repo */}
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <GitPullRequest className="w-3.5 h-3.5 text-violet-500" />
                            <span>{issue.repository?.owner?.login}</span>
                            <span>/</span>
                            <span className="text-slate-550 dark:text-slate-350 font-extrabold">{issue.repository?.name}</span>
                          </div>

                          {/* Issue Title */}
                          <a 
                            href={issue.html_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block font-black text-sm text-slate-900 dark:text-white hover:text-violet-500 dark:hover:text-violet-400 leading-snug transition-colors line-clamp-2 my-0"
                          >
                            {issue.title}
                          </a>

                          {/* Label Badges */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {issue.labels.slice(0, 4).map((label, labelIdx) => (
                              <span
                                key={labelIdx}
                                className="px-2 py-0.5 rounded text-[8px] font-bold border"
                                style={{
                                  backgroundColor: `#${label.color}15`,
                                  color: `#${label.color}`,
                                  borderColor: `#${label.color}35`
                                }}
                              >
                                {label.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Right Details / CTA */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0">
                          <div className="flex items-center gap-2">
                            {issue.user?.avatar_url && (
                              <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                                <img src={issue.user.avatar_url} alt={issue.user.login} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <span className="text-[11px] font-bold text-slate-400">@{issue.user?.login}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              id={`bookmark-remove-btn-${issue.id}`}
                              onClick={() => toggleBookmark(issue)}
                              className="p-2 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/35 transition-all cursor-pointer"
                              title="Remove Bookmark"
                            >
                              <BookmarkCheck className="w-4 h-4 stroke-[2.5]" />
                            </button>

                            <a
                              id={`open-bookmarked-issue-btn-${issue.id}`}
                              href={issue.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl bg-violet-600 hover:bg-violet-750 text-white shadow-lg shadow-violet-600/15 transition-all flex items-center justify-center"
                              title="Open on GitHub"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Matchmaker;
