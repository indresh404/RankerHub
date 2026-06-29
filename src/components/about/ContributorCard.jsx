import React from "react";
import { motion } from "framer-motion";
import { Award, Crown, GitCommit } from "lucide-react";

export const ContributorCard = ({
  login,
  avatarUrl,
  contributions,
  htmlUrl,
  variants,
  rank,
}) => {
  const rankColors = {
    1: {
      border:
        "border-amber-400/80 dark:border-amber-500/60 hover:border-amber-500 shadow-amber-500/5",
      bg: "bg-amber-500/5 dark:bg-amber-500/5",
      badge:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
      icon: <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />,
    },
    2: {
      border:
        "border-slate-400/80 dark:border-slate-400/60 hover:border-slate-550 shadow-slate-400/5",
      bg: "bg-slate-400/5 dark:bg-slate-400/5",
      badge:
        "bg-slate-400/10 text-slate-600 dark:text-slate-400 border-slate-400/25",
      icon: <Award className="w-3 h-3 text-slate-400 fill-slate-400" />,
    },
    3: {
      border:
        "border-amber-700/50 dark:border-amber-700/40 hover:border-amber-650 shadow-amber-700/5",
      bg: "bg-amber-700/5 dark:bg-amber-700/5",
      badge:
        "bg-amber-750/10 text-amber-700 dark:text-amber-500 border-amber-700/25",
      icon: <Award className="w-3 h-3 text-amber-700 fill-amber-700" />,
    },
  };

  const theme = rankColors[rank] || {
    border:
      "border-slate-200/50 dark:border-slate-800/50 hover:border-violet-500/30 dark:hover:border-violet-500/20",
    bg: "bg-white/40 dark:bg-slate-950/40",
    badge:
      "bg-slate-100/70 dark:bg-slate-900/50 text-slate-550 dark:text-slate-400 border-slate-200/10 dark:border-slate-850/20",
    icon: null,
  };

  return (
    <motion.a
      variants={variants}
      href={htmlUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`pt-7 pb-4 px-5 rounded-2xl border-2 ${theme.border} ${theme.bg} hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center space-y-4 group cursor-pointer relative overflow-hidden`}
      aria-label={`${login} contributor profile with ${contributions} contributions`}
    >
      {/* Rank Badge */}
      <div className="absolute top-3 right-3">
        <span
          className={`text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 border transition-colors duration-300 ${theme.badge}`}
        >
          {theme.icon}#{rank}
        </span>
      </div>

      {/* Avatar */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-violet-500/25 group-hover:border-violet-500/60 flex-shrink-0 transition-all duration-300 relative shadow-md">
        <img
          src={avatarUrl}
          alt={`${login} avatar`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Info */}
      <div className="w-full overflow-hidden space-y-1.5">
        <span className="block text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors duration-300">
          {login}
        </span>
        <span
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black shadow-sm border transition-colors duration-300 ${theme.badge}`}
        >
          <GitCommit className="w-3.5 h-3.5 text-current" />
          {contributions} {contributions === 1 ? "commit" : "commits"}
        </span>
      </div>
    </motion.a>
  );
};

export default ContributorCard;
