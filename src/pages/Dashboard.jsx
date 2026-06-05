import React, { useState, useEffect } from "react";
import LottiePlayer from "../components/ui/LottiePlayer";
import { Award, ShieldCheck } from "lucide-react";
import { query, collection, where, getCountFromServer } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import trophyAnimation from "../assets/animations/trophy.json";
import SectionHeader from "../components/ui/SectionHeader";
import Card from "../components/ui/Card";
import StatsCards from "../components/dashboard/StatsCards";
import StreakCard from "../components/dashboard/StreakCard";
import RankPreview from "../components/dashboard/RankPreview";
import ActivityFeed from "../components/dashboard/ActivityFeed";

const heatmapColors = [
  "bg-slate-100 dark:bg-slate-800/40",
  "bg-violet-500/10 dark:bg-violet-500/10",
  "bg-violet-500/30 dark:bg-violet-500/30",
  "bg-violet-500/60 dark:bg-violet-500/50",
  "bg-violet-600 dark:bg-violet-600"
];

export const Dashboard = () => {
  const { userData } = useAuth();
  const [rank, setRank] = useState("Loading...");
  
  // Initialize with 168 empty cells (24 weeks * 7 days)
  const [heatmapCells, setHeatmapCells] = useState(
    Array.from({ length: 168 }, () => 0)
  );

  // 1. Fetch REAL GitHub Contributions for Heatmap with Caching
  useEffect(() => {
    const fetchHeatmap = async () => {
      const username = userData?.githubUsername;
      if (!username) return;

      const cacheKey = `heatmap_${username}`;
      const cached = localStorage.getItem(cacheKey);
      const now = Date.now();

      let data = null;

      try {
        const res = await fetch(
          `https://github-contributions-api.jogruber.de/v4/${username}?y=last`
        );

        if (!res.ok) {
          throw new Error(`API Error: ${res.status}`);
        }

        data = await res.json();
        const cacheEntry = { data, timestamp: now };
        localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
      } catch (err) {
        if (cached) {
          const cacheEntry = JSON.parse(cached);
          const cacheAge = now - cacheEntry.timestamp;
          const fifteenMinutes = 15 * 60 * 1000;

          if (cacheAge < fifteenMinutes || err.message.includes("API")) {
            data = cacheEntry.data;
            console.log("Using cached heatmap data");
          }
        }

        if (!data) {
          console.error("Heatmap fetch error (Falling back to empty grid):", err);
          setHeatmapCells(Array.from({ length: 168 }, () => 0));
          return;
        }
      }

      if (data) {
        const contributions = data.contributions || [];
        const last168 = contributions.slice(-168);

        const cells = last168.map((day) => {
          const c = day.count;
          if (c === 0) return 0;
          if (c <= 2) return 1;
          if (c <= 5) return 2;
          if (c <= 9) return 3;
          return 4;
        });

        if (cells.length < 168) {
          const padding = Array.from({ length: 168 - cells.length }, () => 0);
          setHeatmapCells([...padding, ...cells]);
        } else {
          setHeatmapCells(cells);
        }
      }
    };

    fetchHeatmap();
  }, [userData?.githubUsername]);

  // 2. Fetch Dynamic Leaderboard Rank
  useEffect(() => {
    if (!userData || !userData.points) return;
    const fetchRank = async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("points.totalPoints", ">", userData.points.totalPoints)
        );
        const snapshot = await getCountFromServer(q);
        const currentRank = snapshot.data().count + 1;
        setRank(`#${currentRank}`);
      } catch (err) {
        console.error("Error calculating dynamic rank:", err);
        setRank("#N/A");
      }
    };
    fetchRank();
  }, [userData]);

  const totalPoints = userData?.points?.totalPoints || 0;
  const devLevel = Math.floor(totalPoints / 250) + 1;
  const nextLevelPoints = devLevel * 250;
  const levelProgressPercent = Math.min(100, Math.floor((totalPoints / nextLevelPoints) * 100));

  const challenges = [
    {
      title: "Binary Tree Level Order Traversal",
      difficulty: "Medium",
      diffColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      points: "+10 CP",
      category: "Trees / BFS"
    },
    {
      title: "LRU Cache Implementation",
      difficulty: "Hard",
      diffColor: "bg-red-500/10 text-red-500 border-red-500/20",
      points: "+20 CP",
      category: "Design / DLL"
    }
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Overview Dashboard"
        subtitle="Track your progress, achievements, and rankings in real-time."
        badge="Live Metrics"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-6 p-8 bg-gradient-to-br from-violet-600/10 via-indigo-600/10 to-blue-600/10 border-violet-500/15">
          <div className="space-y-4 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-600/20 text-violet-700 dark:text-violet-400">
              <Award className="w-4 h-4 animate-bounce" /> Level {devLevel} Developer
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight my-0">
              Welcome back, {userData?.name || "Developer"}!
            </h2>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-md font-medium">
              You are currently ranked <span className="font-bold text-slate-800 dark:text-white">{rank}</span> globally. Complete daily arena challenges to boost your rank!
            </p>
            <div className="pt-2 flex items-center justify-center sm:justify-start gap-4">
              <div className="w-full max-w-[200px] h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${levelProgressPercent}%` }}
                />
              </div>
              <span className="text-xs font-bold text-slate-500">{totalPoints} / {nextLevelPoints} XP</span>
            </div>
          </div>
          <div className="w-44 h-44 flex-shrink-0 flex items-center justify-center">
            <LottiePlayer animationData={trophyAnimation} loop={true} className="w-full h-full" />
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-6">
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Skill Overview
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white my-0">
              Your Ranking Breakdown
            </h3>
            <div className="space-y-2.5 pt-2">
              {[
                { label: "GitRank (GitHub)", points: userData?.points?.gitRankPoints || 0, color: "bg-blue-500" },
                { label: "CodingVerse", points: userData?.points?.codingVersePoints || 0, color: "bg-purple-500" },
                { label: "Streak Points", points: userData?.points?.streakPoints || 0, color: "bg-orange-500" },
                { label: "Referral Points", points: userData?.points?.referralPoints || 0, color: "bg-emerald-500" }
              ].map((skill, idx) => {
                const maxPoints = Math.max(10, totalPoints);
                const percent = Math.min(100, Math.floor((skill.points / maxPoints) * 100)) || 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>{skill.label}</span>
                      <span>{skill.points} pts</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percent}%` }}
                        className={`h-full ${skill.color} rounded-full transition-all duration-300`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" />
            Rank points calculated from public data logs.
          </div>
        </Card>
      </div>

      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white my-0">
                Git Contribution Heatmap
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Rank Activity Sync
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Consistent contributions directly increase your GitRank rating points.
            </p>
          </div>
          <div className="my-6 grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto py-2 scrollbar-none">
            {heatmapCells.map((val, idx) => (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-sm border border-slate-200/5 dark:border-slate-800/5 hover:ring-2 hover:ring-violet-500/40 transition-all duration-150 ${heatmapColors[val]}`}
                title={`Activity Level: ${val}`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span>Less</span>
              <div className="flex gap-1">
                {heatmapColors.map((col, idx) => (
                  <div key={idx} className={`w-3 h-3 rounded-sm ${col}`} />
                ))}
              </div>
              <span>More</span>
            </div>
            <span>Activity logged from github.com/{userData?.githubUsername || "developer"}</span>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white my-0">
              Daily Arena Challenges
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Solve to boost your CodingVerse global rating points.
            </p>
          </div>
          <div className="my-4 space-y-3 flex-1">
            {challenges.map((challenge, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-slate-200/40 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col justify-between gap-2.5"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{challenge.category}</span>
                    <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full border ${challenge.diffColor}`}>
                      {challenge.difficulty}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 leading-tight">
                    {challenge.title}
                  </h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400">
                    {challenge.points}
                  </span>
                  <button
                    disabled
                    className="px-3 py-1 text-[10px] font-bold rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300/10 cursor-not-allowed"
                    title="Solve in CodingVerse"
                  >
                    Solve
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="text-[11px] text-center text-slate-400 font-semibold">
            Next challenges unlock in 8 hours.
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StreakCard />
        <RankPreview />
        <ActivityFeed />
      </div>
    </div>
  );
};

export default Dashboard;