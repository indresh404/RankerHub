import React, { useState, useMemo } from "react";
import { 
  Search, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  GitPullRequest, 
  Calendar, 
  Clock, 
  Sparkles,
  CheckCircle
} from "lucide-react";
import { Github } from "../components/ui/Icons";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import axios from "axios";
import { TokenManager } from "../utils/tokenManager";

// Cache helper functions declared outside the component to keep the component pure
const getCachedData = (owner, repo, expirationMs) => {
  try {
    const cacheKey = `repo_health_${owner.toLowerCase()}_${repo.toLowerCase()}`;
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    const entry = JSON.parse(cached);
    if (Date.now() - entry.timestamp < expirationMs) {
      return entry.data;
    }
  } catch (e) {
    console.warn("Failed to read from cache", e);
  }
  return null;
};

const setCachedData = (owner, repo, data) => {
  try {
    const cacheKey = `repo_health_${owner.toLowerCase()}_${repo.toLowerCase()}`;
    localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
    console.warn("Failed to write to cache", e);
  }
};

export const RepoHealth = () => {
  const { user } = useAuth();
  const [repoUrl, setRepoUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const [healthData, setHealthData] = useState(null);
  const [rateLimitWarning, setRateLimitWarning] = useState(false);

  // Helper to parse repo owner and name from standard GitHub URLs
  const parseRepo = (url) => {
    try {
      // Handle shortform like "facebook/react"
      if (url.includes("/") && !url.startsWith("http") && url.split("/").length === 2) {
        const parts = url.split("/");
        return { owner: parts[0].trim(), repo: parts[1].trim() };
      }
      const u = new URL(url.startsWith("http") ? url : `https://${url}`);
      const parts = u.pathname.split("/").filter(Boolean);
      if ((u.hostname === "github.com" || u.hostname === "www.github.com") && parts.length >= 2) {
        return { owner: parts[0], repo: parts[1] };
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleScan = async (e, customUrl = null) => {
    if (e) e.preventDefault();
    setError("");
    setRateLimitWarning(false);

    const targetUrl = customUrl || repoUrl;
    const parsed = parseRepo(targetUrl);
    if (!parsed) {
      setError("Please enter a valid GitHub repository URL (e.g., https://github.com/facebook/react) or format (owner/repo).");
      return;
    }

    const { owner, repo } = parsed;
    const cacheExpiration = 10 * 60 * 1000; // 10 minutes cache
    const cachedData = getCachedData(owner, repo, cacheExpiration);

    if (cachedData && !customUrl) {
      setHealthData(cachedData);
      return;
    }

    setIsScanning(true);

    // Fetch token if authenticated
    const token = TokenManager.get(user?.uid) || sessionStorage.getItem(`gh_token_${user?.uid}`);
    const headers = token ? { Authorization: `token ${token}` } : {};

    try {
      // 1. Fetch Repository Base Metadata
      const repoRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      const repoMeta = repoRes.data;

      // Execute subsequent queries concurrently to minimize loading times
      const statsPromises = [
        axios.get(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100`, { headers }).catch(e => {
          console.warn("Contributors fetch failed:", e);
          return { data: [] };
        }),
        axios.get(`https://api.github.com/repos/${owner}/${repo}/releases?per_page=30`, { headers }).catch(e => {
          console.warn("Releases fetch failed:", e);
          return { data: [] };
        }),
        axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=50`, { headers }).catch(e => {
          console.warn("PRs fetch failed:", e);
          return { data: [] };
        }),
        axios.get(`https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=50`, { headers }).catch(e => {
          console.warn("Issues fetch failed:", e);
          return { data: [] };
        }),
        axios.get(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=50`, { headers }).catch(e => {
          console.warn("Commits fetch failed:", e);
          return { data: [] };
        }),
      ];

      const [contributorsRes, releasesRes, pullsRes, issuesRes, commitsRes] = await Promise.all(statsPromises);

      let releases = releasesRes.data || [];
      // If no official releases, check tags
      if (releases.length === 0) {
        try {
          const tagsRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/tags?per_page=30`, { headers });
          releases = tagsRes.data || [];
        } catch {
          releases = [];
        }
      }

      // Calculate Bus Factor / Maintainer dependency
      const contributors = contributorsRes.data || [];
      const totalCommitsSum = contributors.reduce((sum, c) => sum + (c.contributions || 0), 0);
      let cumulativeCommits = 0;
      let busFactor = 0;
      
      const sortedContributors = [...contributors].sort((a, b) => b.contributions - a.contributions);
      for (const contrib of sortedContributors) {
        cumulativeCommits += contrib.contributions || 0;
        busFactor++;
        if (cumulativeCommits >= totalCommitsSum * 0.5) {
          break;
        }
      }
      // If no contributors, Bus Factor is 0
      if (contributors.length === 0) busFactor = 0;

      // Parse PR metrics
      const pulls = pullsRes.data || [];
      const openPRs = pulls.filter(p => p.state === "open").length;
      const closedPRs = pulls.filter(p => p.state === "closed");
      const mergedPRs = closedPRs.filter(p => p.pull_request?.merged_at || p.merged_at);
      const unmergedClosedPRs = closedPRs.filter(p => !(p.pull_request?.merged_at || p.merged_at));
      
      const prMergeRate = closedPRs.length > 0 
        ? Math.round((mergedPRs.length / closedPRs.length) * 100)
        : 100; // default to 100 if no closed PRs

      // Parse average merge time
      let totalMergeTimeHours = 0;
      let mergedCount = 0;
      mergedPRs.forEach(pr => {
        const created = new Date(pr.created_at);
        const merged = new Date(pr.pull_request?.merged_at || pr.merged_at || pr.closed_at);
        const diffMs = merged - created;
        if (diffMs > 0) {
          totalMergeTimeHours += diffMs / (1000 * 60 * 60);
          mergedCount++;
        }
      });
      const avgPRMergeTimeDays = mergedCount > 0 
        ? parseFloat((totalMergeTimeHours / mergedCount / 24).toFixed(1))
        : 0;

      // Parse Issue metrics (filtering out PRs from the issues endpoint)
      const rawIssues = issuesRes.data || [];
      const issues = rawIssues.filter(i => !i.pull_request);
      const openIssues = issues.filter(i => i.state === "open").length;
      const closedIssues = issues.filter(i => i.state === "closed");
      
      const issueResolutionRate = (openIssues + closedIssues.length) > 0
        ? Math.round((closedIssues.length / (openIssues + closedIssues.length)) * 100)
        : 100;

      let totalResolveTimeHours = 0;
      let resolvedCount = 0;
      closedIssues.forEach(issue => {
        const created = new Date(issue.created_at);
        const closed = new Date(issue.closed_at);
        const diffMs = closed - created;
        if (diffMs > 0) {
          totalResolveTimeHours += diffMs / (1000 * 60 * 60);
          resolvedCount++;
        }
      });
      const avgIssueResolveTimeDays = resolvedCount > 0
        ? parseFloat((totalResolveTimeHours / resolvedCount / 24).toFixed(1))
        : 0;

      // Calculate Release Frequency (releases or tags in the last 12 months)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      let releasesLastYear = 0;
      let latestReleaseDate = null;

      if (releases.length > 0) {
        releases.forEach(rel => {
          // Releases have created_at or published_at; tags don't. Fallback to commit details if it's a tag, 
          // but for simplicity, we approximate tag date from release structure or assume recent.
          const relDate = new Date(rel.published_at || rel.created_at || new Date());
          if (relDate >= oneYearAgo) {
            releasesLastYear++;
          }
          if (!latestReleaseDate || relDate > latestReleaseDate) {
            latestReleaseDate = relDate;
          }
        });
      }

      // Group commits by week to draw the activity chart
      const commits = commitsRes.data || [];
      const weeklyCommits = Array.from({ length: 8 }, (_, idx) => {
        const start = new Date();
        start.setDate(start.getDate() - (idx + 1) * 7);
        const end = new Date();
        end.setDate(end.getDate() - idx * 7);
        const label = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return { start, end, count: 0, label };
      }).reverse();

      commits.forEach(commit => {
        const date = new Date(commit.commit?.author?.date || commit.commit?.committer?.date || new Date());
        const weekIdx = weeklyCommits.findIndex(w => date >= w.start && date < w.end);
        if (weekIdx !== -1) {
          weeklyCommits[weekIdx].count += 1;
        }
      });

      // Calculate individual scores out of 25
      const busFactorScore = Math.min(25, busFactor >= 5 ? 25 : busFactor === 4 ? 20 : busFactor === 3 ? 15 : busFactor === 2 ? 10 : 5);
      const prScore = Math.round((prMergeRate / 100) * 25);
      const issueScore = Math.round((issueResolutionRate / 100) * 25);
      
      let releaseScore = 5;
      if (releasesLastYear >= 12) releaseScore = 25;
      else if (releasesLastYear >= 6) releaseScore = 20;
      else if (releasesLastYear >= 2) releaseScore = 15;
      else if (releasesLastYear === 1) releaseScore = 10;
      else {
        // Tag recency fallback
        const lastPush = new Date(repoMeta.pushed_at);
        const nowTime = new Date();
        const diffMonths = (nowTime.getTime() - lastPush.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (diffMonths <= 1) releaseScore = 12;
        else if (diffMonths <= 3) releaseScore = 8;
      }

      const totalScore = busFactorScore + prScore + issueScore + releaseScore;

      const responseData = {
        name: repoMeta.name,
        fullName: repoMeta.full_name,
        description: repoMeta.description || "No description provided.",
        stars: repoMeta.stargazers_count,
        forks: repoMeta.forks_count,
        watchers: repoMeta.subscribers_count || repoMeta.watchers_count,
        createdAt: repoMeta.created_at,
        pushedAt: repoMeta.pushed_at,
        busFactor,
        contributorsCount: contributors.length,
        topContributors: sortedContributors.slice(0, 5).map(c => ({
          login: c.login,
          avatarUrl: c.avatar_url,
          commits: c.contributions,
          percent: totalCommitsSum > 0 ? Math.round((c.contributions / totalCommitsSum) * 100) : 0
        })),
        pr: {
          open: openPRs,
          closed: closedPRs.length,
          merged: mergedPRs.length,
          unmergedClosed: unmergedClosedPRs.length,
          rate: prMergeRate,
          avgTime: avgPRMergeTimeDays
        },
        issue: {
          open: openIssues,
          closed: closedIssues.length,
          rate: issueResolutionRate,
          avgTime: avgIssueResolveTimeDays
        },
        releases: {
          totalCount: releases.length,
          countLastYear: releasesLastYear,
          latestDate: latestReleaseDate ? latestReleaseDate.toISOString() : null
        },
        weeklyCommits,
        scores: {
          busFactor: busFactorScore,
          pr: prScore,
          issue: issueScore,
          release: releaseScore,
          total: totalScore
        }
      };

      setHealthData(responseData);
      setCachedData(owner, repo, responseData);

    } catch (err) {
      console.error("Health scanner error:", err);
      const status = err.response?.status;
      if (status === 403 || status === 429) {
        setRateLimitWarning(true);
        setError("GitHub API rate limit exceeded. Log in with GitHub or wait before trying again.");
      } else if (status === 404) {
        setError("Repository not found. Please verify the URL or path and check if it is public.");
      } else {
        setError(err.message || "Failed to scan repository. Please check your network and try again.");
      }
    } finally {
      setIsScanning(false);
    }
  };

  const sustainabilityTier = useMemo(() => {
    if (!healthData) return null;
    const score = healthData.scores.total;
    if (score >= 90) return { label: "Excellent - High Sustainability", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", desc: "Outstanding maintenance, robust collaborative base, and active release schedule." };
    if (score >= 70) return { label: "Healthy - Moderate Sustainability", color: "text-blue-500 bg-blue-500/10 border-blue-500/20", desc: "Consistent contributions, good resolution rates, and low developer concentration risk." };
    if (score >= 50) return { label: "Stagnant - Moderate Risk", color: "text-amber-500 bg-amber-500/10 border-amber-500/20", desc: "Slow issue/PR responses or high maintainer concentration. Proceed with caution." };
    return { label: "Critical - High Risk", color: "text-red-500 bg-red-500/10 border-red-500/20", desc: "Dependent on a single contributor, low activity levels, or lack of maintenance." };
  }, [healthData]);

  // Handle preset clicks for demonstrations
  const handlePresetClick = (repoPath) => {
    setRepoUrl(repoPath);
    handleScan(null, repoPath);
  };

  // SVGs charts configurations
  const commitsMaxVal = useMemo(() => {
    if (!healthData) return 4;
    return Math.max(...healthData.weeklyCommits.map(d => d.count), 4);
  }, [healthData]);

  const commitsPoints = useMemo(() => {
    if (!healthData) return [];
    const chartWidth = 500;
    const chartHeight = 160;
    const paddingX = 35;
    const paddingY = 20;

    return healthData.weeklyCommits.map((d, i) => {
      const x = paddingX + (i / (healthData.weeklyCommits.length - 1)) * (chartWidth - 2 * paddingX);
      const y = chartHeight - paddingY - (d.count / commitsMaxVal) * (chartHeight - 2 * paddingY);
      return { x, y };
    });
  }, [healthData, commitsMaxVal]);

  const commitsPath = useMemo(() => {
    if (commitsPoints.length === 0) return "";
    return `M ${commitsPoints[0].x} ${commitsPoints[0].y} ` + commitsPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
  }, [commitsPoints]);

  const commitsArea = useMemo(() => {
    if (commitsPoints.length === 0) return "";
    const chartHeight = 160;
    const paddingY = 20;
    return `${commitsPath} L ${commitsPoints[commitsPoints.length - 1].x} ${chartHeight - paddingY} L ${commitsPoints[0].x} ${chartHeight - paddingY} Z`;
  }, [commitsPoints, commitsPath]);

  return (
    <div className="space-y-8 animate-fade-in pb-20 overflow-x-hidden">
      <SectionHeader 
        title="Repository Health Dashboard" 
        subtitle="Evaluate repository activity, maintainer dependency (Bus Factor), and sustainability health indicators."
        icon={TrendingUp}
        badge="Sustainability Insights"
      />

      {/* Input / Scanner Bar */}
      <Card className="p-3 sm:p-5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-slate-200/50 dark:border-slate-800/50">
        <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Github className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="e.g., facebook/react or https://github.com/vuejs/core"
              className="w-full pl-12 pr-4 py-3 sm:py-4 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isScanning || !repoUrl.trim()}
            className="px-6 py-3 sm:py-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-500 hover:via-indigo-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all whitespace-nowrap"
          >
            {isScanning ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Analyze Health</span>
              </>
            )}
          </button>
        </form>

        {/* Preset Repositories for quick demonstration */}
        <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-semibold text-slate-400 dark:text-slate-500">
          <span>Popular Repositories:</span>
          {["facebook/react", "vuejs/core", "rust-lang/rust", "golang/go"].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handlePresetClick(p)}
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-violet-500/10 hover:text-violet-500 dark:hover:bg-violet-500/20 dark:hover:text-violet-400 rounded-md transition-all cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>
      </Card>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Scan Error</p>
            <p className="mt-0.5">{error}</p>
            {rateLimitWarning && !user && (
              <p className="mt-2 text-xs text-red-500/80">
                Tip: Authenticated users get 5000 requests/hour from GitHub instead of the guest 60 requests/hour. Try logging in!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Health Data Dashboard */}
      {healthData && (
        <div className="space-y-6">
          
          {/* Top Row: Overall Score & Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Score Radial Ring */}
            <Card className="p-6 flex flex-col items-center justify-center text-center lg:col-span-1">
              <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Sustainability Score</h3>
              
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="text-slate-200 dark:text-slate-800"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className={`transition-all duration-1000 ease-out ${
                      healthData.scores.total >= 90 ? "text-emerald-500" :
                      healthData.scores.total >= 70 ? "text-blue-500" :
                      healthData.scores.total >= 50 ? "text-amber-500" : "text-red-500"
                    }`}
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * healthData.scores.total) / 100}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-5xl font-black ${
                    healthData.scores.total >= 90 ? "text-emerald-500" :
                    healthData.scores.total >= 70 ? "text-blue-500" :
                    healthData.scores.total >= 50 ? "text-amber-500" : "text-red-500"
                  }`}>
                    {healthData.scores.total}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">/ 100</span>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                  {healthData.fullName}
                </h4>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${sustainabilityTier.color}`}>
                  {sustainabilityTier.label}
                </div>
              </div>
            </Card>

            {/* Overall Rating & Breakdown */}
            <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Sustainability Assessment</h3>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">
                  {sustainabilityTier.desc}
                </p>

                {/* Score breakdown metrics list */}
                <div className="mt-6 space-y-3.5">
                  {[
                    { label: "Bus Factor / Maintainer Dependency (Commit Concentration)", score: healthData.scores.busFactor, color: "bg-purple-500" },
                    { label: "Issue Resolution Rate (Closed vs Open issues)", score: healthData.scores.issue, color: "bg-blue-500" },
                    { label: "PR Merge Rate (Merged pull requests efficiency)", score: healthData.scores.pr, color: "bg-pink-500" },
                    { label: "Release Frequency & Recency (Longevity of updates)", score: healthData.scores.release, color: "bg-emerald-500" },
                  ].map((metric, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                        <span>{metric.label}</span>
                        <span>{metric.score} / 25 pts</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${(metric.score / 25) * 100}%` }}
                          className={`h-full ${metric.color} rounded-full transition-all duration-300`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-slate-400 dark:text-slate-500">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
                  Grade based on real-time activity metrics.
                </span>
                <span>
                  Last Commit: {new Date(healthData.pushedAt).toLocaleDateString()}
                </span>
              </div>
            </Card>

          </div>

          {/* Grid: 4 Core Health Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 1: Bus Factor */}
            <Card className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Maintainer Risk</span>
                  <h4 className="text-lg font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Users className="w-5 h-5 text-purple-500" /> Bus Factor: {healthData.busFactor}
                  </h4>
                </div>
                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                  healthData.busFactor >= 5 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                  healthData.busFactor >= 3 ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                  healthData.busFactor === 2 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                  "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse"
                }`}>
                  {healthData.busFactor >= 5 ? "Robust" : healthData.busFactor >= 3 ? "Healthy" : healthData.busFactor === 2 ? "Moderate Risk" : "Critical Risk"}
                </span>
              </div>

              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                {healthData.busFactor === 1 
                  ? "A single contributor accounts for over 50% of the project's commit history. This project carries an extremely high maintainer concentration risk."
                  : healthData.busFactor === 2
                  ? "Just 2 contributors account for over 50% of the commits. A sudden decrease in their activity could trigger maintenance bottlenecks."
                  : `Commits are distributed. It takes at least ${healthData.busFactor} core maintainers to cover 50% of the repository's commit activity, indicating healthy collaboration.`}
              </p>

              {/* Top Contributors distribution list */}
              {healthData.topContributors.length > 0 && (
                <div className="space-y-3.5 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 dark:border-slate-800/60 pb-1.5">Top Contributors Shares</span>
                  <div className="space-y-2.5">
                    {healthData.topContributors.map((contrib) => (
                      <div key={contrib.login} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <img src={contrib.avatarUrl} alt={contrib.login} className="w-5 h-5 rounded-full ring-1 ring-violet-500/20" />
                          <span className="font-semibold text-slate-600 dark:text-slate-300">@{contrib.login}</span>
                        </div>
                        <div className="flex items-center gap-3 w-40 justify-end">
                          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${contrib.percent}%` }} />
                          </div>
                          <span className="font-extrabold text-slate-500 text-[10px] w-8 text-right">{contrib.percent}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Card 2: PR Merge Rate */}
            <Card className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Collaborative Velocity</span>
                  <h4 className="text-lg font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <GitPullRequest className="w-5 h-5 text-pink-500" /> PR Merge Rate: {healthData.pr.rate}%
                  </h4>
                </div>
                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                  healthData.pr.rate >= 75 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                  healthData.pr.rate >= 50 ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                  "bg-amber-500/10 text-amber-500 border-amber-500/20"
                }`}>
                  {healthData.pr.rate >= 75 ? "Welcoming" : healthData.pr.rate >= 50 ? "Moderate" : "Selective"}
                </span>
              </div>

              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                Represents the percentage of resolved pull requests that successfully merged.
                {healthData.pr.avgTime > 0 && ` On average, accepted PRs take ${healthData.pr.avgTime} days to merge.`}
              </p>

              {/* Status Visual Split Bar */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 dark:border-slate-800/60 pb-1.5">PR Status Distribution</span>
                
                <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800/80">
                  <div className="bg-emerald-500" style={{ width: `${(healthData.pr.merged / (healthData.pr.open + healthData.pr.closed)) * 100 || 0}%` }} title="Merged" />
                  <div className="bg-red-500" style={{ width: `${(healthData.pr.unmergedClosed / (healthData.pr.open + healthData.pr.closed)) * 100 || 0}%` }} title="Closed (Unmerged)" />
                  <div className="bg-blue-500 animate-pulse" style={{ width: `${(healthData.pr.open / (healthData.pr.open + healthData.pr.closed)) * 100 || 0}%` }} title="Open" />
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 pt-1">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Merged ({healthData.pr.merged})</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Closed ({healthData.pr.unmergedClosed})</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Open ({healthData.pr.open})</span>
                </div>
              </div>

              {healthData.pr.avgTime > 0 && (
                <div className="pt-2 flex items-center gap-2 text-xs font-bold text-slate-400">
                  <Clock className="w-4 h-4 text-pink-500" />
                  <span>Avg. PR processing time: <span className="text-slate-600 dark:text-slate-200">{healthData.pr.avgTime} days</span></span>
                </div>
              )}
            </Card>

            {/* Card 3: Issue Resolution */}
            <Card className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Support Health</span>
                  <h4 className="text-lg font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Activity className="w-5 h-5 text-blue-500" /> Issue Resolution: {healthData.issue.rate}%
                  </h4>
                </div>
                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                  healthData.issue.rate >= 80 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                  healthData.issue.rate >= 50 ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                  "bg-amber-500/10 text-amber-500 border-amber-500/20"
                }`}>
                  {healthData.issue.rate >= 80 ? "Active Responses" : healthData.issue.rate >= 50 ? "Steady" : "Lagging Support"}
                </span>
              </div>

              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                Represents the percentage of total issues that have been closed.
                {healthData.issue.avgTime > 0 && ` Resolved issues are handled in an average of ${healthData.issue.avgTime} days.`}
              </p>

              {/* Status Visual Split Bar */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 dark:border-slate-800/60 pb-1.5">Issue Distribution</span>
                
                <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800/80">
                  <div className="bg-emerald-500" style={{ width: `${(healthData.issue.closed / (healthData.issue.open + healthData.issue.closed)) * 100 || 0}%` }} title="Closed" />
                  <div className="bg-blue-500 animate-pulse" style={{ width: `${(healthData.issue.open / (healthData.issue.open + healthData.issue.closed)) * 100 || 0}%` }} title="Open" />
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 pt-1">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Closed Issues ({healthData.issue.closed})</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Open Issues ({healthData.issue.open})</span>
                </div>
              </div>

              {healthData.issue.avgTime > 0 && (
                <div className="pt-2 flex items-center gap-2 text-xs font-bold text-slate-400">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>Avg. Issue resolution time: <span className="text-slate-600 dark:text-slate-200">{healthData.issue.avgTime} days</span></span>
                </div>
              )}
            </Card>

            {/* Card 4: Release Frequency */}
            <Card className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Longevity & Updates</span>
                  <h4 className="text-lg font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Calendar className="w-5 h-5 text-emerald-500" /> Releases (1yr): {healthData.releases.countLastYear}
                  </h4>
                </div>
                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                  healthData.releases.countLastYear >= 12 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                  healthData.releases.countLastYear >= 4 ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                  "bg-amber-500/10 text-amber-500 border-amber-500/20"
                }`}>
                  {healthData.releases.countLastYear >= 12 ? "Frequent Updates" : healthData.releases.countLastYear >= 4 ? "Quarterly Updates" : "Sparse Updates"}
                </span>
              </div>

              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                Measures the frequency of official software releases or package version updates published to tags.
              </p>

              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 dark:border-slate-800/60 pb-1.5">Release Timeline Info</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200/20 dark:border-slate-800/20 flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Releases/Tags</span>
                    <span className="text-base font-extrabold text-slate-700 dark:text-slate-200 mt-0.5">{healthData.releases.totalCount}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200/20 dark:border-slate-800/20 flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Latest Version Published</span>
                    <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 mt-1 truncate">
                      {healthData.releases.latestDate 
                        ? new Date(healthData.releases.latestDate).toLocaleDateString()
                        : "No release dated"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-slate-400">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Status: <span className="text-slate-600 dark:text-slate-200">{healthData.releases.countLastYear >= 12 ? "Active Release Cycles" : "Stagnant / Passive Cycles"}</span></span>
              </div>
            </Card>

          </div>

          {/* Commits Trend Chart */}
          <Card className="p-6">
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-800 dark:text-slate-200 my-0 flex items-center gap-1.5">
                <TrendingUp className="w-5 h-5 text-indigo-500" /> Commit Activity Trend
              </h4>
              <p className="text-[11px] text-slate-400 font-semibold mb-4">
                Repository commit history across the 50 most recent commits (mapped into weekly intervals).
              </p>
            </div>

            <div className="w-full flex items-center justify-center pt-4">
              <svg viewBox="0 0 500 160" className="w-full h-auto overflow-visible">
                {/* Horizontal grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                  const chartHeight = 160;
                  const paddingY = 20;
                  const y = chartHeight - paddingY - r * (chartHeight - 2 * paddingY);
                  return (
                    <line
                      key={i}
                      x1={35}
                      y1={y}
                      x2={500 - 35}
                      y2={y}
                      className="stroke-slate-100 dark:stroke-slate-800/40"
                      strokeDasharray="4 4"
                    />
                  );
                })}

                {/* Gradient area under line */}
                {commitsArea && (
                  <path d={commitsArea} className="fill-indigo-500/5 dark:fill-indigo-500/5" />
                )}

                {/* Connection Line */}
                {commitsPath && (
                  <path
                    d={commitsPath}
                    fill="none"
                    className="stroke-indigo-500"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Value Dots */}
                {commitsPoints.map((p, i) => (
                  <circle
                    key={`c-${i}`}
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    className="fill-white dark:fill-slate-900 stroke-indigo-500"
                    strokeWidth="2.5"
                  />
                ))}

                {/* Week Labels */}
                {healthData.weeklyCommits.map((d, i) => {
                  const chartWidth = 500;
                  const paddingX = 35;
                  const x = paddingX + (i / (healthData.weeklyCommits.length - 1)) * (chartWidth - 2 * paddingX);
                  return (
                    <text
                      key={i}
                      x={x}
                      y={160 - 4}
                      textAnchor="middle"
                      className="fill-slate-400 dark:fill-slate-500 font-bold text-[9px]"
                    >
                      {d.label}
                    </text>
                  );
                })}
              </svg>
            </div>
          </Card>

        </div>
      )}
    </div>
  );
};

export default RepoHealth;
