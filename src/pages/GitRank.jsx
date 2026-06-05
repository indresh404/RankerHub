import React, { useState, useEffect, useMemo } from "react";
import { Search, Filter, Star, Trophy, RefreshCw, GitCommit, Calendar, BookOpen, AlertCircle, CheckCircle2, Users, Medal } from "lucide-react";
import { collection, query, doc, where, orderBy, limit, startAfter, onSnapshot, getDocs, runTransaction } from "firebase/firestore";
import { useSearchParams } from "react-router-dom";
import { TableVirtuoso } from "react-virtuoso"; 
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import GradientButton from "../components/ui/GradientButton";
import axios from "axios";

export const GitRank = () => {
  const { user, userData, fetchGitHubStats, login } = useAuth();

  // ============================================================
  // ISSUE #194: URL Parameter Sync for State Persistence
  // ============================================================
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("search") || "";
  const selectedLanguage = searchParams.get("lang") || "All";

  // Active Tab for Referral Leaderboard (Issue #310) - Now synced with URL
  const activeTab = searchParams.get("tab") || "gitrank";

  const handleSearchChange = (e) => {
    const val = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    if (val) newParams.set("search", val);
    else newParams.delete("search");
    // Use replace: true so we don't bloat the browser history with every keystroke
    setSearchParams(newParams, { replace: true });
  };

  const handleLanguageChange = (lang) => {
    const newParams = new URLSearchParams(searchParams);
    if (lang !== "All") newParams.set("lang", lang);
    else newParams.delete("lang");
    setSearchParams(newParams);
  };

  const handleTabChange = (tabName) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", tabName);
    setSearchParams(newParams);
  };
  
  // Pagination States
  const [lastVisible, setLastVisible] = useState(null); 
  const [hasMore, setHasMore] = useState(true); 
  const [loadingMore, setLoadingMore] = useState(false); 

  // Real-time leaderboard state
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Syncing state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState("");
  const [syncError, setSyncError] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Charts data state
  const [events, setEvents] = useState([]);
  const [repos, setRepos] = useState([]);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [chartRateLimitError, setChartRateLimitError] = useState("");

  const languages = ["All", "TypeScript", "Rust", "Go", "Python", "Kotlin", "Ruby", "JavaScript"];

  // 1. Real-time Leaderboard Listener (Server-Side Filtered)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingUsers(true);

    // Build the query dynamically based on Active Tab
    const constraints = [
      where("onboardingStatus", "==", "complete"),
    ];

    if (activeTab === "gitrank") {
      constraints.push(orderBy("points.gitRankPoints", "desc"));
      constraints.push(orderBy("githubStats.commits", "desc"));
    } else {
      constraints.push(orderBy("points.referralPoints", "desc"));
    }
    
    constraints.push(orderBy("githubUsername", "asc"));

    // DB level language filter
    if (selectedLanguage !== "All") {
      constraints.push(where("githubStats.primaryLanguage", "==", selectedLanguage));
    }

    constraints.push(limit(50));

    const q = query(collection(db, "users"), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const users = [];
        snapshot.forEach((doc) => {
          users.push(doc.data());
        });

        const ranked = users.map((u, i) => ({
          ...u,
          rank: i + 1
        }));

        setUsersList(ranked);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === 50); 
        setLoadingUsers(false);
      },
      (error) => {
        console.error("Leaderboard subscription error:", error);
        setLoadingUsers(false);
      }
    );

    return () => unsubscribe();
  }, [selectedLanguage, activeTab]); 

  // Pagination Function (Fetch next 50)
  const loadMoreUsers = async () => {
    if (!lastVisible || !hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const constraints = [
        where("onboardingStatus", "==", "complete"),
      ];

      if (activeTab === "gitrank") {
        constraints.push(orderBy("points.gitRankPoints", "desc"));
        constraints.push(orderBy("githubStats.commits", "desc"));
      } else {
        constraints.push(orderBy("points.referralPoints", "desc"));
      }
      
      constraints.push(orderBy("githubUsername", "asc"));

      if (selectedLanguage !== "All") {
        constraints.push(where("githubStats.primaryLanguage", "==", selectedLanguage));
      }

      constraints.push(startAfter(lastVisible));
      constraints.push(limit(50));

      const nextQuery = query(collection(db, "users"), ...constraints);
      const snapshot = await getDocs(nextQuery);

      if (snapshot.empty) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }

      const newUsers = [];
      snapshot.forEach((doc) => {
        newUsers.push(doc.data());
      });

      const currentLength = usersList.length;
      const rankedNewUsers = newUsers.map((u, i) => ({
        ...u,
        rank: currentLength + i + 1
      }));

      setUsersList((prevUsers) => [...prevUsers, ...rankedNewUsers]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 50);
    } catch (error) {
      console.error("Error fetching more users:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // 2. Fetch GitHub Events/Repos for Charts (Authenticated Only)
  useEffect(() => {
    if (!userData?.githubUsername) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadingCharts(false);
      return;
    }

    const fetchAnalytics = async () => {
      setLoadingCharts(true);
      setChartRateLimitError("");
      const token = sessionStorage.getItem(`gh_token_${user?.uid}`);
      const headers = token ? { Authorization: `token ${token}` } : {};
      const now = Date.now();
      const fifteenMinutes = 15 * 60 * 1000;

      const isRateLimited = (err) => {
        const status = err?.response?.status;
        return status === 403 || status === 429;
      };

      const getFromCache = (key) => {
        const cached = localStorage.getItem(key);
        if (!cached) return null;
        try {
          const entry = JSON.parse(cached);
          const age = now - entry.timestamp;
          return age < fifteenMinutes ? entry.data : null;
        } catch {
          return null;
        }
      };

      const saveToCache = (key, data) => {
        try {
          localStorage.setItem(key, JSON.stringify({ data, timestamp: now }));
        } catch {
          console.warn("Failed to save to localStorage");
        }
      };

      let hasRateLimitError = false;

      try {
        const eventsRes = await axios.get(
          `https://api.github.com/users/${userData.githubUsername}/events`,
          { headers }
        );
        setEvents(eventsRes.data || []);
        saveToCache(`events_${userData.githubUsername}`, eventsRes.data);
      } catch (err) {
        if (isRateLimited(err)) {
          hasRateLimitError = true;
          const cached = getFromCache(`events_${userData.githubUsername}`);
          if (cached) {
            setEvents(cached);
            console.log("Using cached events data");
          } else {
            setEvents([]);
          }
        } else {
          console.warn("Failed to fetch events for charts:", err);
          const cached = getFromCache(`events_${userData.githubUsername}`);
          if (cached) {
            setEvents(cached);
          }
        }
      }

      try {
        const reposRes = await axios.get(
          `https://api.github.com/users/${userData.githubUsername}/repos?per_page=100&type=owner`,
          { headers }
        );
        setRepos(reposRes.data || []);
        saveToCache(`repos_${userData.githubUsername}`, reposRes.data);
      } catch (err) {
        if (isRateLimited(err)) {
          hasRateLimitError = true;
          const cached = getFromCache(`repos_${userData.githubUsername}`);
          if (cached) {
            setRepos(cached);
            console.log("Using cached repos data");
          } else {
            setRepos([]);
          }
        } else {
          console.warn("Failed to fetch repos for charts:", err);
          const cached = getFromCache(`repos_${userData.githubUsername}`);
          if (cached) {
            setRepos(cached);
          }
        }
      }

      if (hasRateLimitError) {
        setChartRateLimitError(
          "GitHub API rate limit reached. Displaying cached data. Please wait a few minutes and reload the page for fresh data."
        );
      }

      setLoadingCharts(false);
    };

    fetchAnalytics();
  }, [userData, user]);

  // 3. Sync GitHub Data Handler
  const handleSync = async () => {
    if (!user || !userData) return;
    setIsSyncing(true);
    setSyncSuccess("");
    setSyncError("");

    try {
      const ghStats = await fetchGitHubStats(user.uid, userData.githubUsername);
      const userRef = doc(db, "users", user.uid);

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw new Error("User document does not exist in Firestore!");
        }

        const liveData = userDoc.data();
        const currentReferralPoints = liveData.points?.referralPoints || 0;
        const currentCodingVersePoints = liveData.points?.codingVersePoints || 0;
        const currentStreakPoints = liveData.points?.streakPoints || 0;

        const newGitRankPoints = ghStats.gitRankPoints;
        const newTotalPoints = newGitRankPoints + currentReferralPoints + currentCodingVersePoints + currentStreakPoints;

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
          "lastSync": new Date().toISOString()
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
      const lastSyncTime = new Date(userData.lastSync).getTime();
      const now = Date.now();
      const cooldownMs = 5 * 60 * 1000; // 5 minutes
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

  const formatCooldown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Filter leaderboard lists (Only Search is client side now)
  const filteredData = useMemo(() => {
    return usersList.filter((u) => {
      const name = u.name || "";
      const username = u.githubUsername || "";
      return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             username.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [usersList, searchTerm]);

  // Grab Top 3 Contributors
  const topContributors = useMemo(() => {
    return usersList.slice(0, 3);
  }, [usersList]);

  // Chart Parsing
  const weeklyActivityData = useMemo(() => {
    const weeks = Array.from({ length: 8 }, (_, idx) => {
      const start = new Date();
      start.setDate(start.getDate() - (idx + 1) * 7);
      const end = new Date();
      end.setDate(end.getDate() - idx * 7);
      const label = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return { start, end, commits: 0, prs: 0, reviews: 0, label };
    }).reverse();

    events.forEach((event) => {
      const eventDate = new Date(event.created_at);
      const weekIdx = weeks.findIndex((w) => eventDate >= w.start && eventDate < w.end);
      if (weekIdx !== -1) {
        if (event.type === "PushEvent") {
          weeks[weekIdx].commits += event.payload?.size || event.payload?.commits?.length || 1;
        } else if (event.type === "PullRequestEvent" && event.payload?.action === "opened") {
          weeks[weekIdx].prs += 1;
        } else if (event.type === "PullRequestReviewEvent") {
          weeks[weekIdx].reviews += 1;
        }
      }
    });

    return weeks;
  }, [events]);

  const languageChartData = useMemo(() => {
    if (!repos.length) return []; 
    
    const counts = {};
    repos.forEach((r) => {
      if (r.language) {
        counts[r.language] = (counts[r.language] || 0) + 1;
      }
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.keys(counts)
      .map((name) => ({
        name,
        count: counts[name],
        percent: Math.round((counts[name] / total) * 100),
        color:
          name === "TypeScript"
            ? "#3178c6"
            : name === "JavaScript"
            ? "#f1e05a"
            : name === "Python"
            ? "#3572A5"
            : name === "Go"
            ? "#00ADD8"
            : name === "Rust"
            ? "#dea584"
            : name === "Kotlin"
            ? "#A97BFF"
            : "#a855f7"
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [repos]);

  const repositoryContributionData = useMemo(() => {
    if (!events.length) return [];

    const counts = {};
    events.forEach((e) => {
      if (e.type === "PushEvent" && e.repo?.name) {
        const nameOnly = e.repo.name.split("/")[1] || e.repo.name;
        counts[nameOnly] = (counts[nameOnly] || 0) + (e.payload?.size || 1);
      }
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.keys(counts)
      .map((name) => ({
        name,
        commits: counts[name],
        percent: Math.round((counts[name] / total) * 100)
      }))
      .sort((a, b) => b.commits - a.commits)
      .slice(0, 5);
  }, [events]);

  const maxVal = Math.max(
    ...weeklyActivityData.map((d) => d.commits),
    ...weeklyActivityData.map((d) => d.prs),
    ...weeklyActivityData.map((d) => d.reviews),
    4
  );
  const chartWidth = 500;
  const chartHeight = 160;
  const paddingX = 35;
  const paddingY = 20;

  const pointsCommits = weeklyActivityData.map((d, i) => {
    const x = paddingX + (i / (weeklyActivityData.length - 1)) * (chartWidth - 2 * paddingX);
    const y = chartHeight - paddingY - (d.commits / maxVal) * (chartHeight - 2 * paddingY);
    return { x, y };
  });

  const pointsPrs = weeklyActivityData.map((d, i) => {
    const x = paddingX + (i / (weeklyActivityData.length - 1)) * (chartWidth - 2 * paddingX);
    const y = chartHeight - paddingY - (d.prs / maxVal) * (chartHeight - 2 * paddingY);
    return { x, y };
  });

  const pointsReviews = weeklyActivityData.map((d, i) => {
    const x = paddingX + (i / (weeklyActivityData.length - 1)) * (chartWidth - 2 * paddingX);
    const y = chartHeight - paddingY - (d.reviews / maxVal) * (chartHeight - 2 * paddingY);
    return { x, y };
  });

  const generateSvgPath = (points) => {
    if (!points.length) return "";
    return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ");
  };

  const pathCommits = generateSvgPath(pointsCommits);
  const areaCommits = pointsCommits.length
    ? `${pathCommits} L ${pointsCommits[pointsCommits.length - 1].x} ${chartHeight - paddingY} L ${pointsCommits[0].x} ${chartHeight - paddingY} Z`
    : "";

  const pathPrs = generateSvgPath(pointsPrs);
  const areaPrs = pointsPrs.length
    ? `${pathPrs} L ${pointsPrs[pointsPrs.length - 1].x} ${chartHeight - paddingY} L ${pointsPrs[0].x} ${chartHeight - paddingY} Z`
    : "";

  const pathReviews = generateSvgPath(pointsReviews);
  const areaReviews = pointsReviews.length
    ? `${pathReviews} L ${pointsReviews[pointsReviews.length - 1].x} ${chartHeight - paddingY} L ${pointsReviews[0].x} ${chartHeight - paddingY} Z`
    : "";

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

              {/* Sync Actions */}
              <div className="w-full flex flex-col items-center gap-2">
                <GradientButton
                  onClick={handleSync}
                  disabled={isSyncing || cooldownSeconds > 0}
                  className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/10"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                  {isSyncing
                    ? "Syncing..."
                    : cooldownSeconds > 0
                    ? `Retry in ${formatCooldown(cooldownSeconds)}`
                    : "Sync Data"}
                </GradientButton>

                {userData?.lastSync && (
                  <span className="text-[10px] sm:text-xs text-slate-400 font-medium">
                    Last sync: {new Date(userData.lastSync).toLocaleString()}
                  </span>
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

          {/* Rate limit error for charts */}
          {chartRateLimitError && (
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{chartRateLimitError}</span>
            </div>
          )}

          {/* User GitHub Graphs & Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card className="!p-3 sm:!p-5 flex flex-col justify-between">
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white mt-0 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-4.5 h-4.5 text-violet-500" /> Recent Activity Trend
                </h4>
                <p className="text-[11px] text-slate-400 font-semibold mb-4">
                  Contributions over the last 8 weeks.
                </p>
              </div>

              {loadingCharts ? (
                <div className="h-[160px] flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="w-full flex items-center justify-center">
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
                    {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                      const y = chartHeight - paddingY - r * (chartHeight - 2 * paddingY);
                      return (
                        <line
                          key={i}
                          x1={paddingX}
                          y1={y}
                          x2={chartWidth - paddingX}
                          y2={y}
                          className="stroke-slate-100 dark:stroke-slate-800/40"
                          strokeDasharray="4 4"
                        />
                      );
                    })}

                    {areaCommits && (
                      <path d={areaCommits} className="fill-blue-500/5 dark:fill-blue-500/5" />
                    )}
                    {pathCommits && (
                      <path
                        d={pathCommits}
                        fill="none"
                        className="stroke-blue-500"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {areaPrs && (
                      <path d={areaPrs} className="fill-violet-500/5 dark:fill-violet-500/5" />
                    )}
                    {pathPrs && (
                      <path
                        d={pathPrs}
                        fill="none"
                        className="stroke-violet-500"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {areaReviews && (
                      <path d={areaReviews} className="fill-pink-500/5 dark:fill-pink-500/5" />
                    )}
                    {pathReviews && (
                      <path
                        d={pathReviews}
                        fill="none"
                        className="stroke-pink-500"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {pointsCommits.map((p, i) => (
                      <circle
                        key={`c-${i}`}
                        cx={p.x}
                        cy={p.y}
                        r="3.5"
                        className="fill-white stroke-blue-500"
                        strokeWidth="2"
                      />
                    ))}
                    {pointsPrs.map((p, i) => (
                      <circle
                        key={`p-${i}`}
                        cx={p.x}
                        cy={p.y}
                        r="3.5"
                        className="fill-white stroke-violet-500"
                        strokeWidth="2"
                      />
                    ))}

                    {weeklyActivityData.map((d, i) => {
                      const x = paddingX + (i / (weeklyActivityData.length - 1)) * (chartWidth - 2 * paddingX);
                      return (
                        <text
                          key={i}
                          x={x}
                          y={chartHeight - 4}
                          textAnchor="middle"
                          className="fill-slate-400 font-bold text-[9px]"
                        >
                          {d.label}
                        </text>
                      );
                    })}
                  </svg>
                </div>
              )}

              <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-slate-400 mt-2">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> Commits
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-violet-500" /> PRs
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-pink-500" /> Reviews
                </span>
              </div>
            </Card>

            <Card className="!p-3 sm:!p-5 flex flex-col justify-between">
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white mt-0 mb-1 flex items-center gap-1.5">
                  <BookOpen className="w-4.5 h-4.5 text-violet-500" /> Languages Distribution
                </h4>
                <p className="text-[11px] text-slate-400 font-semibold mb-4">
                  Programming languages across your repositories.
                </p>
              </div>

              {loadingCharts ? (
                <div className="h-[160px] flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : languageChartData.length === 0 ? (
                <div className="h-[160px] flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <BookOpen className="w-8 h-8 opacity-20" />
                  <span className="text-[11px] font-semibold">No language data found</span>
                </div>
              ) : (
                <div className="space-y-3.5 flex-1 flex flex-col justify-center">
                  {languageChartData.map((lang, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: lang.color }}
                          />
                          {lang.name}
                        </span>
                        <span>
                          {lang.count} repo{lang.count !== 1 ? "s" : ""} ({lang.percent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${lang.percent}%`, backgroundColor: lang.color }}
                          className="h-full rounded-full transition-all duration-300"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="!p-3 sm:!p-5 flex flex-col justify-between">
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white mt-0 mb-1 flex items-center gap-1.5">
                  <GitCommit className="w-4.5 h-4.5 text-violet-500" /> Recent Repos Activity
                </h4>
                <p className="text-[11px] text-slate-400 font-semibold mb-4">
                  Top repositories by commit activity.
                </p>
              </div>

              {loadingCharts ? (
                <div className="h-[160px] flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : repositoryContributionData.length === 0 ? (
                <div className="h-[160px] flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <GitCommit className="w-8 h-8 opacity-20" />
                  <span className="text-[11px] font-semibold">No recent activity found</span>
                </div>
              ) : (
                <div className="space-y-3.5 flex-1 flex flex-col justify-center">
                  {repositoryContributionData.map((repo, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                        <span className="truncate max-w-[200px]">{repo.name}</span>
                        <span>{repo.commits} commits</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${repo.percent}%` }}
                          className="h-full bg-violet-600 rounded-full transition-all duration-300"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : (
        <Card className="p-6 sm:p-8 text-center max-w-xl mx-auto space-y-6 bg-gradient-to-br from-violet-600/10 via-transparent to-blue-500/10 border-violet-500/20 backdrop-blur-md">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-violet-500/25">
            <Trophy className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              Connect to GitRank Engine
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Log in with GitHub to view your real-time commits, pull requests, and review analytics. Claim your points and secure a spot on the live leaderboard!
            </p>
          </div>
          <GradientButton
            onClick={login}
            className="w-full sm:w-auto px-8 py-3 text-sm font-bold flex items-center justify-center gap-2 mx-auto"
          >
            Authenticate with GitHub
          </GradientButton>
        </Card>
      )}

      {/* 2. Top 3 Contributors Grid (Dynamically adjust based on active tab) */}
      {!loadingUsers && topContributors.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topContributors.map((u, idx) => {
            const isCurrentUser = user && u.uid === user.uid;
            const displayName = isCurrentUser ? (userData?.name || u.name) : u.name;
            const displayAvatar = isCurrentUser ? (userData?.avatar || user?.photoURL || u.avatar) : u.avatar;

            return (
            <Card
              key={u.uid}
              className={`
                relative overflow-hidden flex flex-col items-center justify-between text-center p-6 border
                ${
                  idx === 0
                    ? "bg-gradient-to-b from-amber-500/10 via-slate-50/0 to-slate-50/0 dark:from-amber-500/5 dark:via-slate-900/0 dark:to-slate-900/0 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                    : "border-slate-200/50 dark:border-slate-800/50"
                }
              `}
            >
              {idx === 0 && (
                <div className="absolute top-4 right-4 flex items-center justify-center p-1.5 rounded-full bg-amber-500 text-white shadow-md">
                  <Star className="w-4 h-4 fill-white" />
                </div>
              )}

              <div className="flex flex-col items-center space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Leaderboard #{u.rank}
                </span>

                <div className="w-16 h-16 rounded-2xl overflow-hidden ring-4 ring-violet-500/10 shadow-md">
                  <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                </div>

                <div>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                    {displayName}
                  </h4>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    @{u.githubUsername}
                  </span>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-300/10 dark:border-slate-700/10">
                  {u.githubStats?.primaryLanguage || "JavaScript"}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 w-full flex items-center justify-around text-xs">
                {activeTab === "gitrank" ? (
                  <>
                    <div>
                      <span className="block font-black text-slate-900 dark:text-white leading-none">
                        {u.githubStats?.commits || 0}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase mt-1 block">Commits</span>
                    </div>
                    <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800" />
                    <div>
                      <span className="block font-black text-violet-600 dark:text-violet-400 leading-none">
                        {u.points?.gitRankPoints?.toLocaleString() || 0}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase mt-1 block">Git Points</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="block font-black text-slate-900 dark:text-white leading-none">
                        {Math.floor((u.points?.referralPoints || 0) / 100)}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase mt-1 block">Valid Invites</span>
                    </div>
                    <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800" />
                    <div>
                      <span className="block font-black text-emerald-600 dark:text-emerald-400 leading-none">
                        {u.points?.referralPoints?.toLocaleString() || 0}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase mt-1 block">Referral Pts</span>
                    </div>
                  </>
                )}
              </div>
            </Card>
            );
          })}
        </div>
      )}

      {/* 3. Leaderboard Table / Search & Filters Controls */}
      <Card className="!p-3 sm:!p-6">
        
        {/* NEW TAB SYSTEM FOR REFERRAL LEADERBOARD */}
        <div className="flex items-center gap-2 mb-6 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-fit">
          <button
            onClick={() => handleTabChange("gitrank")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "gitrank"
                ? "bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            GitRank Leaderboard
          </button>
          <button
            onClick={() => handleTabChange("referrals")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "referrals"
                ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Top Recruiters
          </button>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-none">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div className="flex gap-1.5">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`
                    px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer whitespace-nowrap
                    ${
                      selectedLanguage === lang
                        ? "bg-violet-600 border-violet-600 text-white shadow-sm"
                        : "border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                    }
                  `}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-hidden w-full">
          {loadingUsers ? (
            <div className="py-20 text-center text-slate-400">
              <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-bold">Synchronizing Live Standings...</p>
            </div>
          ) : filteredData.length > 0 ? (
            <TableVirtuoso
              useWindowScroll
              data={filteredData}
              components={{
                Table: (props) => <table {...props} className="w-full text-left mt-4 border-collapse min-w-[640px]" />,
                TableHead: React.forwardRef((props, ref) => <thead {...props} ref={ref} />),
                TableRow: (props) => <tr {...props} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group" />,
                TableBody: React.forwardRef((props, ref) => <tbody {...props} ref={ref} className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm" />),
              }}
              fixedHeaderContent={() => (
                <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-white dark:bg-slate-950 z-10 relative shadow-sm">
                  <th className="py-3 px-2 sm:px-4">Rank</th>
                  <th className="py-3 px-2 sm:px-4">Developer</th>
                  <th className="py-3 px-2 sm:px-4">Language</th>
                  
                  {/* DYNAMIC COLUMNS BASED ON ACTIVE TAB */}
                  {activeTab === "gitrank" ? (
                    <>
                      <th className="py-3 px-2 sm:px-4 text-center">Commits</th>
                      <th className="py-3 px-2 sm:px-4 text-center">PRs</th>
                      <th className="py-3 px-2 sm:px-4 text-center">Reviews</th>
                      <th className="py-3 px-2 sm:px-4 text-right">Git Points</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3 px-2 sm:px-4 text-center">Invites Sent</th>
                      <th className="py-3 px-2 sm:px-4 text-center">Recruiter Status</th>
                      <th className="py-3 px-2 sm:px-4 text-right">Referral Points</th>
                    </>
                  )}
                </tr>
              )}
              itemContent={(index, u) => {
                const isCurrentUser = user && u.uid === user.uid;
                const displayName = isCurrentUser ? (userData?.name || u.name) : u.name;
                const displayAvatar = isCurrentUser ? (userData?.avatar || user?.photoURL || u.avatar) : u.avatar;

                return (
                <>
                  <td className="py-3 sm:py-4 px-2 sm:px-4 font-bold text-slate-500">#{u.rank}</td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-extrabold text-slate-900 dark:text-white block group-hover:text-violet-500 transition-colors truncate text-xs sm:text-sm">{displayName}</span>
                        <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold block truncate">@{u.githubUsername}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4">
                    <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/10 dark:border-slate-800/10">{u.githubStats?.primaryLanguage || "JS"}</span>
                  </td>
                  
                  {/* DYNAMIC ROW CONTENT BASED ON ACTIVE TAB */}
                  {activeTab === "gitrank" ? (
                    <>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-center font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">{u.githubStats?.commits || 0}</td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-center font-bold text-violet-600 dark:text-violet-400 text-xs sm:text-sm">{u.githubStats?.prs || 0}</td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-center font-bold text-pink-600 dark:text-pink-400 text-xs sm:text-sm">{u.githubStats?.reviews || 0}</td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-right font-black text-slate-900 dark:text-white text-xs sm:text-sm">{u.points?.gitRankPoints?.toLocaleString() || 0}</td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-center font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">{Math.floor((u.points?.referralPoints || 0) / 100)}</td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-center">
                        {(u.points?.referralPoints || 0) >= 1000 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                            <Medal className="w-3 h-3" /> Ambassador
                          </span>
                        ) : (
                          <span className="text-[10px] sm:text-xs font-bold text-slate-400">Recruiter</span>
                        )}
                      </td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-right font-black text-emerald-500 dark:text-emerald-400 text-xs sm:text-sm">{u.points?.referralPoints?.toLocaleString() || 0}</td>
                    </>
                  )}
                </>
                );
              }}
            />
          ) : (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <p className="text-sm font-bold">No results found</p>
              <p className="text-xs mt-1">Try adjusting your search criteria or filtering by a different language</p>
            </div>
          )}
        </div>
      </Card>

      {/* Pagination Controls */}
      {hasMore && (
        <div className="flex justify-center w-full mt-8 mb-4">
          <button onClick={loadMoreUsers} disabled={loadingMore} className="px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-violet-500/30 flex items-center gap-2">
            {loadingMore ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Loading...</> : "Load More"}
          </button>
        </div>
      )}
      
      {!hasMore && usersList.length > 0 && (
        <div className="text-center text-slate-500 dark:text-slate-400 mt-6 pb-4 text-sm font-medium">
          You've reached the end of the leaderboard! 🏆
        </div>
      )}
    </div>
  );
};

export default GitRank;