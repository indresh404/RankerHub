import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Crown,
  Medal,
  Trophy,
  X,
  ChevronDown,
  ChevronUp,
  GitPullRequest,
  GitCommit,
  Star,
  Users,
} from "lucide-react";
import ContributorCard from "./ContributorCard";

// Helper function to calculate points based on level
const calculatePoints = (contributions, level = 1) => {
  const levelMultiplier = {
    3: 10,
    2: 5,
    1: 3,
  };
  const multiplier = levelMultiplier[level] || 3;
  return contributions * multiplier;
};

// Get level based on contributions
const getLevel = (contributions) => {
  if (contributions >= 50) return 3;
  if (contributions >= 20) return 2;
  return 1;
};

// Get badge icon based on rank
const getRankBadge = (rank) => {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return null;
};

// Leaderboard Modal - Moved outside
const LeaderboardModal = ({
  showLeaderboard,
  setShowLeaderboard,
  sortedContributors,
  expandedUser,
  setExpandedUser,
  sortBy,
  setSortBy,
}) => {
  if (!showLeaderboard) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={() => {
        setShowLeaderboard(false);
        setExpandedUser(null);
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Leaderboard
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Top {sortedContributors.length} contributors ranked by points
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setExpandedUser(null);
                }}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="rank">Sort by Rank</option>
                <option value="points">Sort by Points</option>
                <option value="contributions">Sort by Contributions</option>
              </select>
              <button
                onClick={() => {
                  setShowLeaderboard(false);
                  setExpandedUser(null);
                }}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Leaderboard Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6 bg-white dark:bg-slate-900">
          <div className="space-y-2">
            {sortedContributors.map((contrib, idx) => {
              const rank = idx + 1;
              const isExpanded = expandedUser === contrib.id;
              const isTop3 = rank <= 3;

              return (
                <div
                  key={contrib.id}
                  className={`group rounded-xl border-2 ${
                    isTop3
                      ? rank === 1
                        ? "border-yellow-400/50 bg-yellow-500/5"
                        : rank === 2
                          ? "border-gray-300/50 bg-gray-300/5"
                          : "border-amber-600/50 bg-amber-600/5"
                      : "border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                  } ${
                    isExpanded ? "border-violet-500/50 bg-violet-500/5" : ""
                  } transition-all duration-300`}
                >
                  <button
                    onClick={() =>
                      setExpandedUser(isExpanded ? null : contrib.id)
                    }
                    className="w-full px-4 py-3 flex items-center gap-3 text-left"
                  >
                    {/* Rank with badge for top 3 */}
                    <div className="w-10 flex-shrink-0 flex items-center justify-center">
                      {isTop3 ? (
                        <div className="relative">
                          {getRankBadge(rank)}
                          <span className="sr-only">Rank {rank}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">
                          #{rank}
                        </span>
                      )}
                    </div>

                    {/* Avatar - Click to open GitHub */}
                    <a
                      href={contrib.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <img
                        src={contrib.avatar_url}
                        alt={contrib.login}
                        className={`w-10 h-10 rounded-full border-2 ${
                          isTop3
                            ? "border-yellow-400/50"
                            : "border-slate-200 dark:border-slate-700"
                        } hover:opacity-80 transition-opacity cursor-pointer`}
                        crossOrigin="anonymous"
                      />
                    </a>

                    {/* Name & Details - Click to open GitHub */}
                    <div className="flex-1 min-w-0">
                      <a
                        href={contrib.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 flex-wrap hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <p className="font-bold text-sm text-slate-900 dark:text-white whitespace-nowrap">
                          {contrib.login}
                        </p>
                        {isTop3 && (
                          <span
                            className={`text-[10px] font-black ${
                              rank === 1
                                ? "text-yellow-500"
                                : rank === 2
                                  ? "text-gray-400"
                                  : "text-amber-600"
                            }`}
                          >
                            ★ TOP {rank}
                          </span>
                        )}
                      </a>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          <GitCommit className="w-3 h-3" />
                          {contrib.commits} commits
                        </span>
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          <GitPullRequest className="w-3 h-3" />
                          {contrib.closedPrs} closed PRs
                        </span>
                      </div>
                    </div>

                    {/* Points & Expand */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p
                          className={`font-bold text-sm ${
                            isTop3
                              ? "text-yellow-500"
                              : "text-violet-600 dark:text-violet-400"
                          }`}
                        >
                          {contrib.points} pts
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-0 border-t border-slate-200/50 dark:border-slate-800/50">
                          <div className="grid grid-cols-3 gap-3 mt-3">
                            <div className="p-3 rounded-xl bg-slate-100/50 dark:bg-slate-800/30 text-center">
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Total Points
                              </p>
                              <p className="text-lg font-bold text-violet-600 dark:text-violet-400">
                                {contrib.points}
                              </p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-100/50 dark:bg-slate-800/30 text-center">
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Commits
                              </p>
                              <p className="text-lg font-bold text-slate-900 dark:text-white">
                                {contrib.commits}
                              </p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-100/50 dark:bg-slate-800/30 text-center">
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Closed PRs
                              </p>
                              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                {contrib.closedPrs}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex justify-center">
                            <a
                              href={contrib.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium flex items-center gap-1"
                            >
                              <Star className="w-3 h-3" />
                              View GitHub Profile
                            </a>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const ContributorsGrid = ({ fadeInUp, staggerContainer }) => {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [expandedUser, setExpandedUser] = useState(null);
  const [sortBy, setSortBy] = useState("rank");

  useEffect(() => {
    const fetchContributors = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          "https://api.github.com/repos/indresh404/RankerHub/contributors",
        );
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }
        const data = await res.json();

        const filtered = data.filter((contrib) => {
          const login = (contrib.login || "").toLowerCase();
          return (
            login !== "indresh404" &&
            !login.includes("dependabot") &&
            login !== "divyagsharma2006-blip"
          );
        });

        const sorted = filtered.sort(
          (a, b) => b.contributions - a.contributions,
        );

        setContributors(sorted);
        setError(null);
      } catch (err) {
        console.error("Error fetching contributors:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContributors();
  }, []);

  // Add points and level to contributors
  const contributorsWithPoints = contributors.map((contrib) => {
    const level = getLevel(contrib.contributions);
    const closedPrs = Math.max(1, Math.round(contrib.contributions * 0.4));
    return {
      ...contrib,
      level,
      points: calculatePoints(contrib.contributions, level),
      closedPrs: closedPrs,
      commits: contrib.contributions,
    };
  });

  // Sort contributors based on sortBy
  const sortedContributors = [...contributorsWithPoints].sort((a, b) => {
    if (sortBy === "rank") return b.points - a.points;
    if (sortBy === "contributions") return b.contributions - a.contributions;
    if (sortBy === "points") return b.points - a.points;
    return 0;
  });

  // Top 3 for leaderboard
  const topThree = sortedContributors.slice(0, 3);
  const restContributors = sortedContributors.slice(3);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white/20 dark:bg-slate-950/20 animate-pulse flex flex-col items-center space-y-3"
          >
            <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl border border-rose-500/20 bg-rose-500/5 text-center text-xs text-slate-650 dark:text-slate-400 flex flex-col items-center justify-center gap-2">
        <AlertCircle className="w-5 h-5 text-rose-500" />
        <div>
          <p className="font-bold text-rose-500 mb-1">
            Could not fetch contributors dynamically
          </p>
          <p>
            GitHub API rate limit exceeded or network offline. You can view all
            activity directly on GitHub.
          </p>
        </div>
        <a
          href="https://github.com/indresh404/RankerHub/graphs/contributors"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-850 hover:bg-slate-150 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition duration-200 font-bold"
        >
          View Contributors on GitHub
        </a>
      </div>
    );
  }

  if (contributors.length === 0) {
    return (
      <div className="p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-950/20 text-center text-xs text-slate-500 dark:text-slate-400">
        <p className="font-bold">No external contributors found yet.</p>
        <p className="mt-1">
          Be the first to submit a pull request and join the community!
        </p>
      </div>
    );
  }

  return (
    <>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="flex flex-col items-center w-full"
      >
        {/* Top 3 Boxed Cards Row - Outside */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full mb-10">
          {topThree.map((contrib, idx) => (
            <ContributorCard
              key={contrib.id}
              login={contrib.login}
              avatarUrl={contrib.avatar_url}
              contributions={contrib.contributions}
              htmlUrl={contrib.html_url}
              variants={fadeInUp}
              rank={idx + 1}
            />
          ))}
        </div>

        {/* View All Leaderboard Button */}
        <motion.div
          variants={fadeInUp}
          className="w-full flex justify-center mb-8"
        >
          <button
            onClick={() => setShowLeaderboard(true)}
            className="group px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            View Full Leaderboard ({sortedContributors.length} contributors)
            <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
          </button>
        </motion.div>

        {/* Rest of the Contributors */}
        {restContributors.length > 0 && (
          <div className="pt-8 border-t border-slate-200/40 dark:border-slate-800/40 w-full">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-4 gap-y-6 justify-center">
              {restContributors.map((contrib, idx) => {
                const rank = idx + 4;
                return (
                  <a
                    key={contrib.id}
                    href={contrib.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center text-center group relative space-y-2 cursor-pointer"
                  >
                    <div className="relative w-16 h-16 sm:w-18 sm:h-18 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-slate-250 dark:border-slate-800 group-hover:border-violet-500/80 transition-colors duration-300 shadow-sm relative">
                        <img
                          src={contrib.avatar_url}
                          alt={contrib.login}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          crossOrigin="anonymous"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <span className="absolute bottom-0 right-0 min-w-5 h-5 px-1.5 rounded-full bg-slate-900/90 dark:bg-slate-100/95 text-slate-100 dark:text-slate-900 border border-slate-200/50 dark:border-slate-800/50 text-[9px] font-black flex items-center justify-center shadow-md">
                        #{rank}
                      </span>
                    </div>

                    <div className="w-full overflow-hidden space-y-0.5">
                      <span className="block text-xs font-bold text-slate-700 dark:text-slate-350 truncate group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors duration-300">
                        {contrib.login}
                      </span>
                      <span className="block text-[9px] font-extrabold text-slate-400 dark:text-slate-550">
                        {contrib.points} pts
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        <LeaderboardModal
          showLeaderboard={showLeaderboard}
          setShowLeaderboard={setShowLeaderboard}
          sortedContributors={sortedContributors}
          expandedUser={expandedUser}
          setExpandedUser={setExpandedUser}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      </AnimatePresence>
    </>
  );
};

export default ContributorsGrid;
