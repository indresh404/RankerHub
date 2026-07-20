import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  Trophy,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  collection,
  query,
  doc,
  where,
  orderBy,
  limit,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  getCountFromServer,
} from "firebase/firestore";
import { useSearchParams } from "react-router-dom";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import GradientButton from "../components/ui/GradientButton";

export const GitRank = () => {
  const { user, userData, fetchGitHubStats } = useAuth();

  // ============================================================
  // URL Parameter Sync for State Persistence & College Filter
  // ============================================================
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("search") || "";
  const selectedLanguage = searchParams.get("lang") || "All";
  const selectedCollege = searchParams.get("college") || "All";

  // Active Tab for Referral Leaderboard - Synced with URL
  const activeTab = searchParams.get("tab") || "gitrank";

  const [searchInput, setSearchInput] = useState(searchTerm);
  const searchDebounceRef = useRef(null);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      const newParams = new URLSearchParams(searchParams);
      if (val) newParams.set("search", val);
      else newParams.delete("search");
      setSearchParams(newParams, { replace: true });
    }, 300);
  };

  const handleLanguageChange = (lang) => {
    const newParams = new URLSearchParams(searchParams);
    if (lang !== "All") newParams.set("lang", lang);
    else newParams.delete("lang");
    setSearchParams(newParams);
  };

  // Real-time leaderboard state
  const [usersList, setUsersList] = useState([]);
  const [, setLoadingUsers] = useState(true);

  // Syncing state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState("");
  const [syncError, setSyncError] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Jump to My Rank Feature
  const [myRank, setMyRank] = useState(null);
  const [rankLoading, setRankLoading] = useState(false);
  const [rankError, setRankError] = useState("");
  const myRowRef = useRef(null);
  const searchInputRef = useRef(null);

  const handleJumpToMyRank = async () => {
    if (!user) return;
    setRankLoading(true);
    setRankError("");
    setMyRank(null);
    try {
      const userPoints =
        activeTab === "referrals"
          ? (userData?.points?.referralPoints ?? 0)
          : (userData?.points?.gitRankPoints ?? 0);

      if (userPoints === 0) {
        setRankError(
          "You haven't earned any points yet! Start contributing 🚀"
        );
        setRankLoading(false);
        return;
      }

      const pointsField =
        activeTab === "referrals"
          ? "points.referralPoints"
          : "points.gitRankPoints";

      const q = query(
        collection(db, "users"),
        where(pointsField, ">", userPoints)
      );
      const snapshot = await getCountFromServer(q);
      const rank = snapshot.data().count + 1;
      setMyRank(rank);

      setTimeout(() => {
        myRowRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 150);
    } catch (err) {
      console.error(err);
      setRankError("Could not fetch your rank. Please try again.");
    } finally {
      setRankLoading(false);
    }
  };

  const languages = [
    "All",
    "TypeScript",
    "Rust",
    "Go",
    "Python",
    "Kotlin",
    "Ruby",
    "JavaScript",
  ];

  // 1. Real-time Leaderboard Listener (Server-Side Filtered)
  useEffect(() => {
    let isMounted = true;

    const constraints = [where("onboardingStatus", "==", "complete")];

    if (activeTab === "gitrank") {
      constraints.push(orderBy("points.gitRankPoints", "desc"));
      constraints.push(orderBy("githubStats.commits", "desc"));
    } else {
      constraints.push(orderBy("points.referralPoints", "desc"));
    }

    constraints.push(orderBy("githubUsername", "asc"));

    if (selectedLanguage !== "All") {
      constraints.push(
        where("githubStats.primaryLanguage", "==", selectedLanguage)
      );
    }

    if (selectedCollege !== "All" && selectedCollege.trim() !== "") {
      constraints.push(where("college", "==", selectedCollege));
    }

    constraints.push(limit(50));

    const q = query(collection(db, "users"), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!isMounted) return;
        const usersData = snapshot.docs.map((doc, i) => ({
          id: doc.id,
          ...doc.data(),
          rank: i + 1,
        }));
        setUsersList(usersData);
        setLoadingUsers(false);
      },
      (error) => {
        console.error("Error fetching leaderboard:", error);
        if (isMounted) setLoadingUsers(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [activeTab, selectedLanguage, selectedCollege]);

  // 2. Sync GitHub Data Handler
  const handleSync = async () => {
    if (!user || !userData) return;
    setIsSyncing(true);
    setSyncSuccess("");
    setSyncError("");

    try {
      const ghStats = await fetchGitHubStats(
        user.uid,
        userData.githubUsername,
        userData.timezone
      );
      const userRef = doc(db, "users", user.uid);

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw new Error("User document does not exist in Firestore!");
        }

        const liveData = userDoc.data();
        const currentReferralPoints = liveData.points?.referralPoints || 0;
        const currentCodingVersePoints =
          liveData.points?.codingVersePoints || 0;
        const currentStreakPoints = liveData.points?.streakPoints || 0;

        const newGitRankPoints = ghStats.gitRankPoints;
        const newTotalPoints =
          newGitRankPoints +
          currentReferralPoints +
          currentCodingVersePoints +
          currentStreakPoints;

        transaction.update(userRef, {
          "githubStats.commits": ghStats.commits,
          "githubStats.prs": ghStats.prs,
          "githubStats.reviews": ghStats.reviews,
          "githubStats.repos": ghStats.publicRepos,
          "githubStats.stars": ghStats.stars,
          "githubStats.followers": ghStats.followers,
          "githubStats.primaryLanguage": ghStats.primaryLanguage,
          "points.gitRankPoints": newGitRankPoints,
          "points.totalPoints": newTotalPoints,
          "points.trustScore": ghStats.trustScore,
          lastSync: serverTimestamp(),
        });
      });

      setSyncSuccess("GitHub statistics updated in real time!");
      setTimeout(() => setSyncSuccess(""), 4000);
    } catch (err) {
      console.error("GitHub Sync error:", err);
      setSyncError("Failed to update: " + (err.message || "Unknown error"));
      setTimeout(() => setSyncError(""), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Cooldown effect for sync throttling
  useEffect(() => {
    if (!userData?.lastSync) return;

    const checkCooldown = () => {
      const getTimestamp = (val) => {
        if (!val) return 0;
        if (val.toMillis) return val.toMillis();
        if (val.seconds) return val.seconds * 1000;
        return new Date(val).getTime();
      };

      const lastSyncTime = getTimestamp(userData.lastSync);
      const now = Date.now();
      const cooldownMs = 5 * 60 * 1000;
      const elapsed = now - lastSyncTime;

      if (elapsed < cooldownMs) {
        setCooldownSeconds(Math.ceil((cooldownMs - elapsed) / 1000));
      } else {
        setCooldownSeconds(0);
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);

    return () => clearInterval(interval);
  }, [userData?.lastSync]);

  // Keyboard shortcut listener (/ to focus search)
  useEffect(() => {
    const handleSlashKey = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (e.key === "/" && tag !== "input" && tag !== "textarea") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleSlashKey);
    return () => document.removeEventListener("keydown", handleSlashKey);
  }, []);

  const formatCooldown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Filter leaderboard lists (Client-side search filter)
  const filteredData = useMemo(() => {
    return usersList.filter((u) => {
      const name = u.name || "";
      const username = u.githubUsername || "";
      return (
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [usersList, searchTerm]);

  return (
    <div className="space-y-6 sm:space-y-8 overflow-x-hidden">
      {/* Page Header */}
      <SectionHeader
        title="GitRank Rating Engine"
        subtitle="Real-time developers rankings and active contribution audits."
        badge="Engine Active"
      />

      {/* 1. Authenticated User's Real-time Panel */}
      {user ? (
        <div className="space-y-6">
          <Card className="!p-4 sm:!p-6 relative overflow-hidden bg-gradient-to-br from-violet-600/5 via-transparent to-blue-500/5 border-slate-200/60 dark:border-slate-800/60">
            <div className="flex flex-col items-center justify-between gap-5 sm:gap-6 lg:gap-8">
              {/* Profile details */}
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full text-center sm:text-left">
                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden ring-4 ring-violet-500/20 shadow-lg shrink-0">
                  <img
                    src={userData?.avatar || user.photoURL}
                    alt={userData?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 w-full">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white my-0 truncate">
                    {userData?.name || "Developer"}
                  </h3>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5 flex-wrap">
                    <span className="text-xs sm:text-sm font-semibold text-slate-400 truncate">
                      @{userData?.githubUsername || "github"}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0 hidden sm:block" />
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0 border sm:border-0 border-slate-200 dark:border-slate-700 px-2 sm:px-0 py-0.5 sm:py-0 rounded-md sm:rounded-none">
                      Real-time Synced
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Panel */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full text-center">
                <div className="px-2 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/30 dark:border-slate-800/30 flex flex-col items-center justify-center">
                  <span className="block font-black text-blue-500 text-lg sm:text-xl leading-none">
                    {userData?.githubStats?.commits || 0}
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 block">
                    Commits
                  </span>
                </div>
                <div className="px-2 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/30 dark:border-slate-800/30 flex flex-col items-center justify-center">
                  <span className="block font-black text-violet-500 text-lg sm:text-xl leading-none">
                    {userData?.githubStats?.prs || 0}
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 block">
                    PRs
                  </span>
                </div>
                <div className="px-2 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/30 dark:border-slate-800/30 flex flex-col items-center justify-center">
                  <span className="block font-black text-pink-500 text-lg sm:text-xl leading-none">
                    {userData?.githubStats?.reviews || 0}
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 block">
                    Reviews
                  </span>
                </div>
                <div className="px-2 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/30 dark:border-slate-800/30 flex flex-col items-center justify-center">
                  <span className="block font-black text-emerald-500 text-lg sm:text-xl leading-none">
                    {userData?.points?.gitRankPoints || 0}
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 block">
                    GitPoints
                  </span>
                </div>
              </div>

              {/* Sync Actions & Jump to My Rank Controls */}
              <div className="w-full flex flex-col items-center gap-3">
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <GradientButton
                    onClick={handleSync}
                    disabled={isSyncing || cooldownSeconds > 0}
                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/10"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`}
                    />
                    {isSyncing
                      ? "Syncing..."
                      : cooldownSeconds > 0
                      ? `Retry in ${formatCooldown(cooldownSeconds)}`
                      : "Sync Data"}
                  </GradientButton>

                  <button
                    onClick={handleJumpToMyRank}
                    disabled={rankLoading}
                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-violet-500/10 flex items-center justify-center gap-2"
                  >
                    <Trophy className="w-4 h-4" />
                    {rankLoading ? "Calculating..." : "Jump to My Rank"}
                  </button>
                </div>

                {/* Rank Calculation Status Messages */}
                {rankError && (
                  <p className="text-xs font-semibold text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg w-full text-center">
                    {rankError}
                  </p>
                )}
                {myRank !== null && (
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg w-full text-center">
                    Your Leaderboard Rank is: #{myRank}
                  </p>
                )}

                {cooldownSeconds > 0 && (
                  <div className="w-full">
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full transition-all duration-1000"
                        style={{ width: `${(cooldownSeconds / 300) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium text-center mt-1">
                      Cooldown: {formatCooldown(cooldownSeconds)} remaining
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sync Notifications */}
            {syncSuccess && (
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
                <span>{syncSuccess}</span>
              </div>
            )}
            {syncError && (
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
                <AlertCircle className="w-4 h-4" />
                <span>{syncError}</span>
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {/* Leaderboard Table Zone */}
      <Card className="!p-4 sm:!p-6 space-y-4">
        {/* Search Bar & Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search developers (Press '/' to focus)..."
              value={searchInput}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
                  selectedLanguage === lang
                    ? "bg-violet-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard Data List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-2">Rank</th>
                <th className="py-3 px-2">Developer</th>
                <th className="py-3 px-2">Points</th>
                <th className="py-3 px-2">Commits</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => {
                const isCurrentUser =
                  item.githubUsername === userData?.githubUsername;

                return (
                  <tr
                    key={item.githubUsername || item.uid}
                    ref={isCurrentUser ? myRowRef : null}
                    className={`border-b border-slate-100 dark:border-slate-800/50 transition-all ${
                      isCurrentUser
                        ? "bg-violet-500/10 font-bold border-l-4 border-l-violet-500"
                        : "hover:bg-slate-50/50 dark:hover:bg-slate-900/50"
                    }`}
                  >
                    <td className="py-3 px-2">#{item.rank}</td>
                    <td className="py-3 px-2 flex items-center gap-2">
                      <img
                        src={item.avatar || "https://github.com/ghost.png"}
                        alt={item.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="truncate max-w-[120px] sm:max-w-none">
                        {item.name || item.githubUsername}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-violet-500 font-bold">
                      {item.points?.gitRankPoints || 0}
                    </td>
                    <td className="py-3 px-2">
                      {item.githubStats?.commits || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default GitRank;