import React from "react";
import { motion } from "framer-motion";
import {
  GitCommit,
  ArrowUpRight,
  Code,
  GitMerge,
  Award,
  Flame,
} from "lucide-react";
import { activityFeed } from "../../data/activities";
import Card from "../ui/Card";
import { staggerContainer, fadeUp } from "../../utils/motion";

const iconMap = {
  commit: {
    icon: GitCommit,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/25",
  },
  rank_up: {
    icon: ArrowUpRight,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/25",
  },
  challenge: {
    icon: Code,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/25",
  },
  pr_merge: {
    icon: GitMerge,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/25",
  },
  badge: {
    icon: Award,
    color: "text-pink-500 bg-pink-500/10 border-pink-500/25",
  },
  streak: {
    icon: Flame,
    color: "text-orange-500 bg-orange-500/10 border-orange-500/25",
  },
};

export const ActivityFeed = () => {
  return (
    <Card className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
            Recent Activity
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Live events across the community
          </p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-violet-500 dark:text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
          Rank Points (+XP)
        </span>
      </div>

      {/* Timeline items */}
      <div className="flex-1 mt-6 relative pl-6 pr-2 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-200 dark:before:bg-slate-800 overflow-y-auto max-h-[350px] scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {" "}
        <motion.div
          variants={staggerContainer(0.08, 0.05)}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {activityFeed.map((activity) => {
            const config = iconMap[activity.type] || iconMap.commit;
            const Icon = config.icon;

            return (
              <motion.div
                key={activity.id}
                variants={fadeUp()}
                className="relative flex items-start justify-between gap-3 group"
              >
                {/* Timeline Node Icon */}
                <div
                  className={`absolute -left-[23px] top-0.5 p-1 rounded-lg border bg-white dark:bg-slate-900 shadow-sm transition-transform duration-200 group-hover:scale-110 ${config.color}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="space-y-0.5">
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">
                    {activity.time}
                  </span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                    <span className="font-extrabold text-slate-950 dark:text-white mr-1">
                      {activity.user}
                    </span>
                    {activity.detail}
                  </p>
                  <span className="inline-flex text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    {activity.project}
                  </span>
                </div>

                {/* Points indicator */}
                <div className="flex-shrink-0 text-right">
                  <span className="inline-flex items-center text-xs font-extrabold text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/15 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                    +{activity.points} XP
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </Card>
  );
};

export default ActivityFeed;
