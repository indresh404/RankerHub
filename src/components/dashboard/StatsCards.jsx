import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, GitPullRequest, Flame, Award, ArrowUp } from "lucide-react";
import {
  query,
  collection,
  where,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import Card from "../ui/Card";
import { staggerContainer } from "../../utils/motion";

export const StatsCards = () => {
  const { userData } = useAuth();
  const [rank, setRank] = useState("Loading...");

  // Optimized rank count query
  useEffect(() => {
    if (!userData || !userData.points) return;

    const fetchRank = async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("points.totalPoints", ">", userData.points.totalPoints),
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
  const gitCommits = userData?.githubStats?.commits || 0;
  const streak = userData?.streak ?? 0;

  const stats = [
    {
      title: "Current Rank",
      value: rank,
      subtext: rank === "Loading..." ? "Calculating..." : "Live platform rank",
      trend: "up",
      icon: Trophy,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "GitHub Commits",
      value: gitCommits.toLocaleString(),
      subtext: "Verified contribution commits",
      trend: "up",
      icon: GitPullRequest,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Active Streak",
      value: `${streak} Day${streak !== 1 ? "s" : ""}`,
      subtext: streak > 5 ? "You're on fire! 🦉🔥" : "Daily streak active",
      trend: "stable",
      icon: Flame,
      color: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    },
    {
      title: "Global Points",
      value: totalPoints.toLocaleString(),
      subtext: `Rank points: ${userData?.points?.gitRankPoints || 0} Git + ${userData?.points?.referralPoints || 0} Ref`,
      trend: "up",
      icon: Award,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    },
  ];

  return (
    <motion.div
      variants={staggerContainer(0.1, 0)}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
    >
      {stats.map((stat, idx) => {
        const IconComponent = stat.icon;
        return (
          <Card
            key={idx}
            className="flex items-center justify-between p-6 relative overflow-hidden group border-slate-200/50 dark:border-slate-800/50 hover:shadow-lg transition-all duration-300"
          >
            {/* Background Accent Gradient Hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/0 via-indigo-600/0 to-blue-600/0 group-hover:to-indigo-500/5 dark:group-hover:to-indigo-500/5 transition-all duration-300 pointer-events-none" />

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {stat.title}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none">
                  {stat.value}
                </span>
                {stat.trend === "up" && (
                  <span className="flex items-center text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                    <ArrowUp className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {stat.subtext}
              </p>
            </div>

            <div
              className={`p-3.5 rounded-xl border ${stat.color} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300`}
            >
              <IconComponent className="w-6 h-6" />
            </div>
          </Card>
        );
      })}
    </motion.div>
  );
};

export default StatsCards;
