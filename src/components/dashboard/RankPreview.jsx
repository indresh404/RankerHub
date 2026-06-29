import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Lock, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { systemBadges } from "../../constants";
import Card from "../ui/Card";

export const RankPreview = () => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);

  // Extract metrics dynamically from the live Firestore user document
  const commits = userData?.githubStats?.commits || 0;
  const streak = userData?.streak || 0;
  const codingVersePoints = userData?.points?.codingVersePoints || 0;

  // Calculate dynamic progress mapping for the 4 badges (same as Achievements.jsx)
  const badgeProgress = {
    b1: { unlocked: true, progress: 100, current: 1, target: 1 },
    b2: {
      unlocked: commits >= 100,
      progress: Math.min(100, Math.round((commits / 100) * 100)),
      current: commits,
      target: 100,
    },
    b3: {
      unlocked: streak >= 10,
      progress: Math.min(100, Math.round((streak / 10) * 100)),
      current: streak,
      target: 10,
    },
    b4: {
      unlocked: codingVersePoints >= 100,
      progress: Math.min(100, Math.round((codingVersePoints / 100) * 100)),
      current: codingVersePoints,
      target: 100,
    },
  };

  useEffect(() => {
    // Simulate loading delay for consistency
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [userData]);

  const unlockedCount = Object.values(badgeProgress).filter(
    (b) => b.unlocked,
  ).length;

  return (
    <Card className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white my-0">
            Achievement Preview
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {unlockedCount} of 4 badges unlocked
          </p>
        </div>
        <Link
          to="/dashboard/achievements"
          className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 group cursor-pointer"
        >
          View all{" "}
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Achievements List */}
      <div className="flex-1 mt-6 space-y-3">
        {loading ? (
          <div className="h-full flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : systemBadges.length > 0 ? (
          systemBadges.map((badge) => {
            const info = badgeProgress[badge.id] || {
              unlocked: false,
              progress: 0,
            };

            return (
              <div
                key={badge.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200/40 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Badge Icon */}
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${badge.color} flex items-center justify-center text-lg flex-shrink-0 ${
                      !info.unlocked ? "brightness-75 saturate-50" : ""
                    }`}
                  >
                    {badge.icon}
                  </div>

                  {/* Badge Info */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-slate-200 block leading-tight">
                      {badge.name}
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 truncate">
                        {info.current} / {info.target}
                      </span>
                      <div className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${info.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lock / Unlock Status */}
                <div className="flex-shrink-0 ml-2">
                  {info.unlocked ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Lock className="w-5 h-5 text-slate-400 dark:text-slate-600" />
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-xs text-center text-slate-400 py-10">
            No achievements yet
          </p>
        )}
      </div>
    </Card>
  );
};

export default RankPreview;
