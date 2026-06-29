import React from "react";
import { motion } from "framer-motion";
import {
  Link2,
  GitPullRequest,
  Terminal,
  Flame,
  Trophy,
  X,
  CheckCircle2,
} from "lucide-react";
import Card from "./Card";

export const HowItWorksModal = ({ onClose }) => {
  const steps = [
    {
      num: "01",
      title: "Connect Your Profile",
      desc: "Link your GitHub account securely via OAuth in seconds. RankerHub reads only public contribution events — commits, pull requests, and code reviews — from the GitHub API. We never request write scopes or access to private source code.",
      details: [
        "OAuth login with read-only public scope",
        "Initial GitRank score calculated on onboarding",
        "Optional: enable private repo sync for full stats",
        "Referral bonus: +50 XP for new user, +100 XP for referrer",
      ],
      icon: Link2,
      color: "from-blue-600 to-cyan-500 text-blue-400",
    },
    {
      num: "02",
      title: "Earn GitRank Points",
      desc: "Your GitRank score is calculated using the formula: GitRank = (Commits × 2) + (PRs × 5) + (Reviews × 10). Sync your GitHub data anytime (5-min cooldown) to update your score in real time.",
      details: [
        "Commits: +2 XP each",
        "Pull Requests opened: +5 XP each",
        "Code Reviews submitted: +10 XP each",
        "Manual sync available with a 5-minute cooldown",
      ],
      icon: GitPullRequest,
      color: "from-violet-600 to-indigo-500 text-violet-400",
    },
    {
      num: "03",
      title: "Conquer CodingVerse Arenas",
      desc: "Solve algorithmic challenges in Java and Python — output prediction, MCQ theory, and code completion. Each correct answer earns XP based on difficulty. Incorrect attempts lock the question permanently.",
      details: [
        "Easy problems: +100 XP",
        "Medium problems: +150 XP",
        "Hard problems: +200 XP",
        "15 total questions, one attempt per question",
        "CodingVerse rank calculated from Firestore standings",
      ],
      icon: Terminal,
      color: "from-purple-600 to-pink-500 text-purple-400",
    },
    {
      num: "04",
      title: "Build Streaks in CodingOwl",
      desc: "Log in daily to build consecutive-day streaks with Oliver the Owl. Each consecutive day adds +10 Streak Points to your total. Miss a day and your streak resets to 1, but accumulated streak points are kept.",
      details: [
        "Consecutive daily login: +10 Streak XP / day",
        "Streak resets to 1 after missing a day",
        "Accumulated streak points are never lost",
        "Reach 10-day streak to unlock the Consistency badge",
      ],
      icon: Flame,
      color: "from-orange-600 to-red-500 text-orange-400",
    },
    {
      num: "05",
      title: "Climb Leaderboards & Mint Badges",
      desc: "Your Global Rank is determined by your Total XP — the sum of GitRank + CodingVerse + Streak + Referral points. Rankings are queried live from Firestore: your rank equals the count of users with higher Total XP, plus one.",
      details: [
        "Total XP = GitRank + CodingVerse + Streak + Referral",
        "Global rank: count of users above you + 1",
        "Language-specific and RankHer specialty leaderboards",
        "Unlock badges at 100+ GitRank, 10-day streak, 100+ CodingVerse XP",
      ],
      icon: Trophy,
      color: "from-amber-600 to-yellow-500 text-amber-400",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-md"
      />

      {/* Modal Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800 p-6 md:p-8 text-slate-800 dark:text-slate-100 flex flex-col gap-6"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2 pr-10">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
            Platform Lifecycle
          </span>
          <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 dark:from-violet-400 dark:via-indigo-400 dark:to-blue-400 my-0">
            How RankerHub Works
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium my-0">
            Follow these steps to synchronize your metrics, conquer challenges,
            and unlock verified achievements.
          </p>
        </div>

        {/* Steps Vertical Timeline Layout */}
        <div className="relative border-l border-slate-200 dark:border-slate-800/80 ml-4 md:ml-6 my-4 pl-6 md:pl-8 space-y-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="relative group">
                {/* Timeline Node (Icon Wrapper) */}
                <div
                  className={`absolute -left-[45px] md:-left-[53px] top-0 w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg shadow-indigo-500/5 group-hover:scale-105 transition-transform duration-300`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-500/10 px-2 py-0.5 rounded border border-violet-200 dark:border-violet-500/20 tracking-wider">
                      STEP {step.num}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white my-0 leading-tight">
                      {step.title}
                    </h3>
                  </div>

                  {/* Detailed Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold max-w-2xl my-0">
                    {step.desc}
                  </p>

                  {/* Point mapping details */}
                  {step.details && (
                    <ul className="mt-2 space-y-1 list-none p-0 m-0">
                      {step.details.map((detail, dIdx) => (
                        <li
                          key={dIdx}
                          className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium"
                        >
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info banner */}
        <Card className="p-4 bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-900/20 dark:to-indigo-900/20 border-violet-200 dark:border-violet-800/40 text-center">
          <p className="text-xs text-indigo-700 dark:text-indigo-300 font-bold my-0 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Ready to climb? Link your profile, start coding, and watch your
            developer standings rise!
          </p>
        </Card>
      </motion.div>
    </div>
  );
};

export default HowItWorksModal;
