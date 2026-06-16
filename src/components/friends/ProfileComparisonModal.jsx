import React, { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Users, Trophy, GitPullRequest, Flame, Award, Crown, Download, History, Trash2, AlertCircle, GitCommit, Star, GitFork, TrendingUp, Medal, ShieldCheck } from "lucide-react";
import Card from "../ui/Card";
import GradientButton from "../ui/GradientButton";
import Toast from "../ui/Toast";
import { exportComparisonAsPng } from "../../services/comparisonExporter";

const METRIC_CONFIG = [
  { key: "totalPoints", label: "Total XP", icon: Trophy, color: "text-amber-500" },
  { key: "gitRankPoints", label: "GitRank Score", icon: Medal, color: "text-blue-500" },
  { key: "commits", label: "Total Commits", icon: GitCommit, color: "text-emerald-500" },
  { key: "streak", label: "Current Streak", icon: Flame, color: "text-orange-500" },
  { key: "repos", label: "Repositories", icon: GitFork, color: "text-violet-500" },
  { key: "stars", label: "Stars Earned", icon: Star, color: "text-yellow-500" },
  { key: "followers", label: "Followers", icon: Users, color: "text-pink-500" },
  { key: "globalRank", label: "Global Rank", icon: TrendingUp, color: "text-cyan-500", lowerIsBetter: true },
];

const getMetricValue = (user, key) => {
  if (!user) return 0;
  switch (key) {
    case "totalPoints": return user.points?.totalPoints || 0;
    case "gitRankPoints": return user.points?.gitRankPoints || 0;
    case "commits": return user.githubStats?.commits || 0;
    case "streak": return user.streak || 0;
    case "repos": return user.githubStats?.repos || 0;
    case "stars": return user.githubStats?.stars || 0;
    case "followers": return user.githubStats?.followers || 0;
    case "globalRank": return user.globalRank || 999999;
    default: return 0;
  }
};

const formatMetric = (value, key) => {
  if (key === "globalRank") return value === 999999 ? "Unranked" : `#${value.toLocaleString()}`;
  return value.toLocaleString();
};

const determineWinner = (aVal, bVal, lowerIsBetter) => {
  if (aVal === bVal) return "tie";
  if (lowerIsBetter) return aVal < bVal ? "left" : "right";
  return aVal > bVal ? "left" : "right";
};

const getWinnerScore = (user) => {
  return (user?.points?.gitRankPoints || 0) * 0.5 +
         (user?.points?.totalPoints || 0) * 0.3 +
         (user?.githubStats?.commits || 0) * 0.1 +
         (user?.streak || 0) * 0.1;
};

const countUnlockedBadges = (user) => {
  if (!user) return 0;
  const gitRankPoints = user.points?.gitRankPoints || 0;
  const streak = user.streak || 0;
  const codingVersePoints = user.points?.codingVersePoints || 0;
  const referralPoints = user.points?.referralPoints || 0;

  let count = 1; // b1 Pioneer always unlocked
  if (gitRankPoints >= 100) count++;
  if (streak >= 10) count++;
  if (codingVersePoints >= 100) count++;
  if (referralPoints >= 1000) count++;
  return count;
};

export const ProfileComparisonModal = ({
  isOpen,
  onClose,
  currentUser,
  compareUser,
  loading,
  error,
  onSelectUser,
  recentComparisons,
  onClearRecent,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [exporting, setExporting] = useState(false);
  const comparisonRef = useRef(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchError(null);
    const query = searchQuery.trim();
    if (!query) return;

    const currentUsername = currentUser?.githubUsername || currentUser?.username;
    if (query.toLowerCase() === currentUsername?.toLowerCase()) {
      setSearchError("You cannot compare with yourself.");
      return;
    }

    await onSelectUser(query);
    setSearchQuery("");
  };

  const addToast = (message, type = "success") => {
    setToasts((prev) => [...prev, { id: Date.now() + Math.random(), message, type }]);
  };

  const handleExport = async () => {
    if (!comparisonRef.current) return;
    setExporting(true);
    try {
      const currentName = currentUser?.githubUsername || currentUser?.name || "user";
      const compareName = compareUser?.githubUsername || compareUser?.name || "friend";
      await exportComparisonAsPng(comparisonRef.current, `rankerhub-compare-${currentName}-vs-${compareName}.png`);
      addToast("Comparison image downloaded!", "success");
    } catch (err) {
      addToast(err.message || "Failed to export image", "error");
    } finally {
      setExporting(false);
    }
  };

  const overallWinner = useMemo(() => {
    if (!compareUser) return null;
    const leftScore = getWinnerScore(currentUser);
    const rightScore = getWinnerScore(compareUser);
    if (Math.abs(leftScore - rightScore) < 0.01) return "tie";
    return leftScore > rightScore ? "left" : "right";
  }, [currentUser, compareUser]);

  const leftBadges = countUnlockedBadges(currentUser);
  const rightBadges = countUnlockedBadges(compareUser);

  const leftWins = useMemo(() => {
    if (!compareUser) return 0;
    let wins = 0;
    METRIC_CONFIG.forEach((m) => {
      const left = getMetricValue(currentUser, m.key);
      const right = getMetricValue(compareUser, m.key);
      const winner = determineWinner(left, right, m.lowerIsBetter);
      if (winner === "left") wins++;
    });
    return wins;
  }, [currentUser, compareUser]);

  const rightWins = useMemo(() => {
    if (!compareUser) return 0;
    let wins = 0;
    METRIC_CONFIG.forEach((m) => {
      const left = getMetricValue(currentUser, m.key);
      const right = getMetricValue(compareUser, m.key);
      const winner = determineWinner(left, right, m.lowerIsBetter);
      if (winner === "right") wins++;
    });
    return wins;
  }, [currentUser, compareUser]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900/90 dark:bg-slate-950/90 border border-slate-800/80 rounded-3xl shadow-2xl overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 p-6 md:p-8 text-slate-100 flex flex-col gap-6"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 p-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2 pr-10">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Users className="w-3 h-3" />
            Social Benchmarking
          </span>
          <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-400 to-blue-400 my-0">
            Compare with Friend
          </h2>
          <p className="text-sm text-slate-400 font-medium my-0">
            Select another RankerHub developer to see a side-by-side breakdown of stats, ranks, and achievements.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by GitHub username or RankerHub handle..."
              className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-800 bg-slate-950/40 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-white transition-all"
            />
          </div>
          <GradientButton type="submit" disabled={loading} className="px-6 py-3 text-sm">
            {loading ? "Searching..." : "Compare"}
          </GradientButton>
        </form>

        {(error || searchError) && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error || searchError}</span>
          </div>
        )}

        {/* Recent Comparisons */}
        {recentComparisons.length > 0 && !compareUser && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                <History className="w-4 h-4" /> Recent Comparisons
              </h3>
              <button
                onClick={onClearRecent}
                className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentComparisons.map((u) => (
                <button
                  key={u.username}
                  onClick={() => onSelectUser(u.username)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-violet-500/30 hover:bg-slate-800 transition-all text-xs font-semibold text-slate-300"
                >
                  <img src={u.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                  @{u.username}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Comparison Content */}
        {compareUser && (
          <div className="space-y-6">
            {/* Export Button */}
            <div className="flex justify-end">
              <GradientButton
                onClick={handleExport}
                disabled={exporting}
                variant="secondary"
                className="px-4 py-2 text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                {exporting ? "Exporting..." : "Save as Image"}
              </GradientButton>
            </div>

            {/* Comparison Card — export target */}
            <div ref={comparisonRef} className="space-y-6 bg-slate-900/90 p-6 rounded-2xl border border-slate-800/50">
              {/* Profile Headers */}
              <div className="grid grid-cols-3 gap-4 items-center">
                {/* Left Profile */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-violet-500/20 shadow-xl">
                    <img
                      src={currentUser?.avatar || currentUser?.photoURL || "https://avatars.githubusercontent.com/u/9919?v=4"}
                      alt={currentUser?.name || "You"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-black text-white my-0">{currentUser?.name || "You"}</h3>
                    <span className="text-xs font-bold text-slate-400">@{currentUser?.githubUsername || currentUser?.username || "user"}</span>
                  </div>
                  {overallWinner === "left" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Crown className="w-3 h-3" /> Overall Winner
                    </span>
                  )}
                </div>

                {/* VS */}
                <div className="flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-slate-700 dark:text-slate-600">VS</span>
                  <div className="flex items-center gap-2 mt-2 text-xs font-bold text-slate-500">
                    <span className="text-emerald-400">{leftWins}</span>
                    <span className="text-slate-600">—</span>
                    <span className="text-red-400">{rightWins}</span>
                  </div>
                </div>

                {/* Right Profile */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-violet-500/20 shadow-xl">
                    <img
                      src={compareUser?.avatar || compareUser?.photoURL || "https://avatars.githubusercontent.com/u/9919?v=4"}
                      alt={compareUser?.name || "Friend"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-black text-white my-0">{compareUser?.name || "Friend"}</h3>
                    <span className="text-xs font-bold text-slate-400">@{compareUser?.githubUsername || compareUser?.username || "friend"}</span>
                  </div>
                  {overallWinner === "right" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Crown className="w-3 h-3" /> Overall Winner
                    </span>
                  )}
                </div>
              </div>

              {/* Badges Row */}
              <div className="grid grid-cols-3 gap-4 items-center p-3 rounded-xl bg-slate-950/40 border border-slate-800/30">
                <div className={`text-center ${leftBadges >= rightBadges ? "text-emerald-400" : "text-red-400"}`}>
                  <span className="block text-lg font-black">{leftBadges} / 5</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Badges</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Award className="w-4 h-4 text-violet-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Achievements</span>
                </div>
                <div className={`text-center ${rightBadges >= leftBadges ? "text-emerald-400" : "text-red-400"}`}>
                  <span className="block text-lg font-black">{rightBadges} / 5</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Badges</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="space-y-3">
                {METRIC_CONFIG.map((metric) => {
                  const leftVal = getMetricValue(currentUser, metric.key);
                  const rightVal = getMetricValue(compareUser, metric.key);
                  const winner = determineWinner(leftVal, rightVal, metric.lowerIsBetter);
                  const Icon = metric.icon;

                  return (
                    <div
                      key={metric.key}
                      className="grid grid-cols-3 gap-4 items-center p-3 rounded-xl bg-slate-950/40 border border-slate-800/30"
                    >
                      <div className={`text-right ${winner === "left" ? "text-emerald-400" : winner === "tie" ? "text-slate-300" : "text-red-400"}`}>
                        <span className="block text-lg font-black">{formatMetric(leftVal, metric.key)}</span>
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        <Icon className={`w-4 h-4 ${metric.color}`} />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{metric.label}</span>
                      </div>

                      <div className={`text-left ${winner === "right" ? "text-emerald-400" : winner === "tie" ? "text-slate-300" : "text-red-400"}`}>
                        <span className="block text-lg font-black">{formatMetric(rightVal, metric.key)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Trust Score Row */}
              <div className="grid grid-cols-3 gap-4 items-center p-3 rounded-xl bg-slate-950/40 border border-slate-800/30">
                <div className={`text-center ${(currentUser?.points?.trustScore ?? 0) >= (compareUser?.points?.trustScore ?? 0) ? "text-emerald-400" : "text-red-400"}`}>
                  <span className="block text-lg font-black">{currentUser?.points?.trustScore ?? "—"}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Trust Score</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-violet-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quality</span>
                </div>
                <div className={`text-center ${(compareUser?.points?.trustScore ?? 0) >= (currentUser?.points?.trustScore ?? 0) ? "text-emerald-400" : "text-red-400"}`}>
                  <span className="block text-lg font-black">{compareUser?.points?.trustScore ?? "—"}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Trust Score</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-2 border-t border-slate-800/50">
                <span className="text-[10px] font-bold text-slate-500">
                  RankerHub — {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Toasts */}
        <div className="fixed bottom-6 right-5 z-50 flex flex-col gap-2 w-80">
          <AnimatePresence>
            {toasts.map((toast) => (
              <Toast
                key={toast.id}
                message={toast.message}
                type={toast.type}
                onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              />
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileComparisonModal;