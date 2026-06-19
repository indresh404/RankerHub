import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, HelpCircle, TrendingUp, TrendingDown, Activity, LineChart, Sparkles, RefreshCw } from "lucide-react";
import { calculateRankingBreakdown } from "../../utils/rankingBreakdown";

export const RankingBreakdown = ({ userData }) => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [activeTab, setActiveTab] = useState("breakdown"); // "breakdown" | "history"
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [tooltip, setTooltip] = useState(null);

  const breakdown = useMemo(() => calculateRankingBreakdown(userData), [userData]);

  // Fetch rank history when tab is clicked or userData changes
  useEffect(() => {
    if (!userData?.uid) return;
    let isMounted = true;
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const { getRankHistory } = await import("../../services/rankHistoryService");
        const data = await getRankHistory(userData.uid);
        if (isMounted) {
          setHistory(data);
        }
      } catch (err) {
        console.error("Error fetching rank history:", err);
      } finally {
        if (isMounted) {
          setLoadingHistory(false);
        }
      }
    };
    fetchHistory();
    return () => { isMounted = false; };
  }, [userData?.uid, userData?.points?.totalPoints, userData?.lastSync]);

  const handleSeedMockHistory = async () => {
    if (!userData?.uid) return;
    setSeeding(true);
    try {
      const { seedMockRankHistory, getRankHistory } = await import("../../services/rankHistoryService");
      await seedMockRankHistory(userData.uid, userData.points?.totalPoints || 0, userData.timezone);
      const data = await getRankHistory(userData.uid);
      setHistory(data);
    } catch (err) {
      console.error("Failed to seed mock history:", err);
    } finally {
      setSeeding(false);
    }
  };

  const categoryIcons = {
    "🐙 GitHub Contributions": "🐙",
    "💻 Coding Challenges": "💻",
    "🔥 Daily Streak": "🔥",
    "🤝 Referrals": "🤝"
  };

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const progressPercentage = breakdown.nextMilestone.points > 0
    ? (breakdown.totalPoints / breakdown.nextMilestone.points) * 100
    : 0;

  // Chronological history for the chart
  const chronologicalHistory = useMemo(() => {
    return [...history].reverse();
  }, [history]);

  // Compute rank changes for list
  const rankChanges = useMemo(() => {
    return history.map((item, index) => {
      if (index === history.length - 1) return 0; // Oldest has no previous
      const prevItem = history[index + 1];
      return prevItem.rank - item.rank; // positive means improved (smaller rank)
    });
  }, [history]);

  // Generate SVG path & bounds for rank history chart
  const chartData = useMemo(() => {
    if (chronologicalHistory.length < 2) return null;
    const chartWidth = 500;
    const chartHeight = 160;
    const paddingX = 40;
    const paddingY = 25;

    const ranks = chronologicalHistory.map((h) => h.rank);
    const maxRank = Math.max(...ranks);
    const minRank = Math.min(...ranks);

    // Add padding bounds for clean spacing (invert scale since Rank 1 is top)
    const range = maxRank - minRank;
    const yMin = Math.max(1, minRank - Math.ceil(range * 0.1 || 2));
    const yMax = maxRank + Math.ceil(range * 0.1 || 2);

    const points = chronologicalHistory.map((h, i) => {
      const x = paddingX + (i / (chronologicalHistory.length - 1)) * (chartWidth - 2 * paddingX);
      const y = paddingY + ((h.rank - yMin) / (yMax - yMin)) * (chartHeight - 2 * paddingY);
      return { x, y, date: h.date, rank: h.rank, totalPoints: h.totalPoints };
    });

    const path = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ");
    const area = `${path} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;

    return { points, path, area, chartWidth, chartHeight, paddingX, paddingY, yMin, yMax };
  }, [chronologicalHistory]);

  // Growth summary calculation
  const growthSummary = useMemo(() => {
    if (history.length < 2) return null;
    const current = history[0].rank;
    const oldest = history[history.length - 1].rank;
    const diff = oldest - current; // positive means rank went up
    return {
      diff,
      improved: diff > 0,
      oldestDate: history[history.length - 1].date,
      oldestRank: oldest,
      currentRank: current
    };
  }, [history]);

  return (
    <div className="space-y-6">
      {/* Header and Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-5.5 h-5.5 text-violet-500" />
          <h2 className="text-2xl font-black text-slate-900 dark:text-white my-0">
            Ratings & Performance Breakdown
          </h2>
        </div>

        {/* Premium segmented tab switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-full sm:w-auto self-start border border-slate-200/20">
          <button
            onClick={() => setActiveTab("breakdown")}
            className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "breakdown"
                ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            Points Breakdown
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "history"
                ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            Rank History & Insights
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "breakdown" ? (
          <motion.div
            key="breakdown"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Total Points Card */}
            <div className="bg-gradient-to-br from-violet-500/5 via-transparent to-blue-500/5 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider my-0">Total Points</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white my-1">
                      {breakdown.totalPoints.toLocaleString()} XP
                    </p>
                  </div>
                  {breakdown.rank && (
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider my-0">Current Rank</p>
                      <p className="text-3xl font-black text-violet-600 dark:text-violet-400 my-1">
                        {breakdown.rank}
                      </p>
                    </div>
                  )}
                </div>

                {/* Progress to Next Milestone */}
                {breakdown.nextMilestone.pointsNeeded > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-semibold">
                        Progress to next milestone ({breakdown.nextMilestone.points.toLocaleString()} XP)
                      </span>
                      <span className="font-bold text-violet-500">
                        {breakdown.nextMilestone.pointsNeeded.toLocaleString()} XP needed
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Points Breakdown Categories */}
            <div className="space-y-3">
              {breakdown.pointsBreakdown.length > 0 ? (
                breakdown.pointsBreakdown.map((category, index) => (
                  <motion.div
                    key={category.category}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border border-slate-200/50 dark:border-slate-800/50 rounded-xl overflow-hidden bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(category.category)}
                      className="w-full px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors border-none cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 text-left">
                        <span className="text-2xl">{categoryIcons[category.category]}</span>
                        <div>
                          <p className="font-extrabold text-slate-800 dark:text-slate-200 my-0">
                            {category.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3.5">
                        <span className="text-base font-black text-violet-600 dark:text-violet-400">
                          +{category.points.toLocaleString()} pts
                        </span>
                        {expandedCategory === category.category ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Details */}
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: expandedCategory === category.category ? "auto" : 0,
                        opacity: expandedCategory === category.category ? 1 : 0
                      }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 py-4 space-y-3 bg-slate-50/20 dark:bg-slate-950/10 border-t border-slate-200/30 dark:border-slate-800/30">
                        {category.details.map((detail, i) => (
                          <div key={i} className="flex items-center justify-between text-xs font-semibold">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500 dark:text-slate-400">
                                {detail.label}
                              </span>
                              {detail.note && (
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                  {detail.note}
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="text-slate-400">
                                {detail.value} × {detail.multiplier} =
                              </span>
                              <span className="ml-2 font-bold text-slate-800 dark:text-slate-200">
                                {detail.total.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </motion.div>
                ))
              ) : (
                <div className="bg-slate-50/50 dark:bg-slate-950/20 rounded-xl p-8 text-center border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                    Start earning points by completing challenges, contributing to GitHub, or logging in daily!
                  </p>
                </div>
              )}
            </div>

            {/* Tips Section */}
            <div className="bg-amber-500/5 dark:bg-amber-500/5 rounded-xl p-5 border border-amber-500/10">
              <p className="text-sm font-extrabold text-amber-600 dark:text-amber-400 mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-4.5 h-4.5 animate-pulse" /> Tips to boost your rating rank:
              </p>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 list-disc list-inside font-semibold leading-relaxed">
                <li>Contribute code to GitHub repositories (commits +2, PRs +5, reviews +10)</li>
                <li>Solve CodingVerse Arena challenges (easy +10, medium +100, hard +200)</li>
                <li>Maintain your daily check-in login streak (+10 per day, capped at 100 XP per cycle)</li>
                <li>Refer other developers to join using your referral code (+100 XP per successful invite)</li>
              </ul>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {loadingHistory ? (
              <div className="h-[200px] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center text-xl">
                  📈
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-white my-0">No Rank History Found</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mt-1 mx-auto leading-relaxed">
                    Historical rankings are saved daily as immutable snapshots when you sync your metrics or load your profile.
                  </p>
                </div>
                <button
                  onClick={handleSeedMockHistory}
                  disabled={seeding}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${seeding ? "animate-spin" : ""}`} />
                  Seed Mock History for Validation
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Growth Stats Overview Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {growthSummary && (
                    <div className="bg-gradient-to-br from-violet-500/5 to-indigo-500/5 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Growth Insight
                        </span>
                        <span className="block text-lg font-black text-slate-800 dark:text-white leading-tight">
                          {growthSummary.improved 
                            ? `Up ${growthSummary.diff} positions` 
                            : growthSummary.diff === 0 
                            ? "Rank holds stable" 
                            : `Down ${Math.abs(growthSummary.diff)} positions`}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Compared to {new Date(growthSummary.oldestDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                        growthSummary.improved 
                          ? "bg-emerald-500/10 text-emerald-500" 
                          : growthSummary.diff === 0 
                          ? "bg-slate-500/10 text-slate-500" 
                          : "bg-red-500/10 text-red-500"
                      }`}>
                        {growthSummary.improved ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      </div>
                    </div>
                  )}

                  <div className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Record High Rank
                      </span>
                      <span className="block text-lg font-black text-slate-800 dark:text-white leading-tight">
                        #{Math.min(...history.map(h => h.rank))}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Best recorded standing
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center text-lg">
                      🏆
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Total Points Growth
                      </span>
                      <span className="block text-lg font-black text-slate-800 dark:text-white leading-tight">
                        +{Math.max(0, history[0].totalPoints - history[history.length - 1].totalPoints)} XP
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        XP gained in active period
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-lg">
                      ⚡
                    </div>
                  </div>
                </div>

                {/* SVG Rank History Chart */}
                {chartData && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6 flex flex-col justify-between">
                    <div className="flex items-center gap-2 pb-4 mb-2 border-b border-slate-100 dark:border-slate-800">
                      <LineChart className="w-4.5 h-4.5 text-violet-500" />
                      <h4 className="font-extrabold text-slate-800 dark:text-white my-0">
                        Rank Progression Curve
                      </h4>
                    </div>

                    <div className="relative w-full h-[180px] bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 p-4 flex items-center justify-center">
                      <svg
                        viewBox={`0 0 ${chartData.chartWidth} ${chartData.chartHeight}`}
                        className="w-full h-auto overflow-visible"
                      >
                        {/* Horizontal Gridlines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                          const y = chartData.paddingY + r * (chartData.chartHeight - 2 * chartData.paddingY);
                          // Calculate the rank at this grid level
                          const gridRank = Math.round(chartData.yMin + r * (chartData.yMax - chartData.yMin));
                          return (
                            <g key={i}>
                              <line
                                x1={chartData.paddingX}
                                y1={y}
                                x2={chartData.chartWidth - chartData.paddingX}
                                y2={y}
                                className="stroke-slate-200/50 dark:stroke-slate-800/40"
                                strokeDasharray="4 4"
                              />
                              <text
                                x={chartData.paddingX - 10}
                                y={y + 3}
                                textAnchor="end"
                                className="fill-slate-400 font-bold text-[8px]"
                              >
                                #{gridRank}
                              </text>
                            </g>
                          );
                        })}

                        {/* Chart Line Paths */}
                        {chartData.area && (
                          <defs>
                            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.15" />
                              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                        )}
                        {chartData.area && (
                          <path d={chartData.area} fill="url(#chartGrad)" />
                        )}
                        {chartData.path && (
                          <path
                            d={chartData.path}
                            fill="none"
                            className="stroke-violet-500"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}

                        {/* Interactive dots */}
                        {chartData.points.map((p, i) => (
                          <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r={tooltip?.date === p.date ? "6" : "4.5"}
                            className="fill-white stroke-violet-500 cursor-pointer transition-all"
                            strokeWidth="2.5"
                            onMouseEnter={() => setTooltip(p)}
                            onMouseLeave={() => setTooltip(null)}
                          />
                        ))}

                        {/* X-axis date labels */}
                        {chronologicalHistory.map((d, i) => {
                          const x = chartData.paddingX + (i / (chronologicalHistory.length - 1)) * (chartData.chartWidth - 2 * chartData.paddingX);
                          const dateObj = new Date(d.date);
                          const dateLabel = dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" });
                          return (
                            <text
                              key={i}
                              x={x}
                              y={chartData.chartHeight - 6}
                              textAnchor="middle"
                              className="fill-slate-400 font-bold text-[8px]"
                            >
                              {dateLabel}
                            </text>
                          );
                        })}
                      </svg>

                      {/* Interactive absolute tooltip */}
                      {tooltip && (
                        <div
                          className="absolute bg-slate-950/95 text-white text-[10px] p-2.5 rounded-xl border border-slate-800 pointer-events-none shadow-2xl flex flex-col gap-0.5 z-10 transition-all duration-150 backdrop-blur-md"
                          style={{
                            left: `${(tooltip.x / chartData.chartWidth) * 100}%`,
                            top: `${(tooltip.y / chartData.chartHeight) * 100}%`,
                            transform: "translate(-50%, -120%)"
                          }}
                        >
                          <span className="font-bold text-[9px] text-slate-400">{new Date(tooltip.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span className="font-extrabold text-violet-400">Rank: #{tooltip.rank}</span>
                          <span className="text-slate-300 font-semibold">{tooltip.totalPoints} XP</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Immutable Snapshots List */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6 flex flex-col justify-between">
                  <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                    <Activity className="w-4.5 h-4.5 text-violet-500" />
                    <h4 className="font-extrabold text-slate-800 dark:text-white my-0">
                      Historical Snapshots Ledger
                    </h4>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          <th className="pb-3 pr-4">Snapshot Date</th>
                          <th className="pb-3 pr-4 text-center">Rank</th>
                          <th className="pb-3 pr-4 text-center">Change</th>
                          <th className="pb-3 text-right">Points Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {history.map((item, idx) => {
                          const change = rankChanges[idx];
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="py-3.5 pr-4 text-slate-800 dark:text-slate-300">
                                {new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="py-3.5 pr-4 text-center font-extrabold text-slate-900 dark:text-white">
                                #{item.rank}
                              </td>
                              <td className="py-3.5 pr-4 text-center">
                                {change > 0 ? (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                                    <TrendingUp className="w-3 h-3" /> +{change}
                                  </span>
                                ) : change < 0 ? (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-[10px]">
                                    <TrendingDown className="w-3 h-3" /> {change}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[11px] font-bold">—</span>
                                )}
                              </td>
                              <td className="py-3.5 text-right font-bold text-slate-800 dark:text-slate-200">
                                {item.totalPoints.toLocaleString()} XP
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RankingBreakdown;
