import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Trophy,
  CheckCircle2,
  Zap,
  Star,
  Target,
  Sparkles,
  Share2
} from "lucide-react";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import { systemBadges } from "../constants";
import { useAuth } from "../context/AuthContext";

const Twitter = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const Linkedin = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

export const Achievements = () => {
  const { userData } = useAuth();
  const [selectedBadge, setSelectedBadge] = useState(systemBadges[0]);

  const shareBadge = (platform, badgeName) => {
    const profileLink = window.location.origin + `/profile/${userData?.uid || ""}`;
    const text = `I just unlocked the ${badgeName} on RankerHub! Check out my rank here: ${profileLink}`;
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(profileLink);

    let url = "";
    if (platform === "twitter") {
      url = `https://twitter.com/intent/tweet?text=${encodedText}`;
    } else if (platform === "linkedin") {
      url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    } else if (platform === "whatsapp") {
      url = `https://api.whatsapp.com/send?text=${encodedText}`;
    }

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // Extract metrics dynamically from the live Firestore user document
  const commits = userData?.githubStats?.commits || 0;
  const streak = userData?.streak || 0;
  const codingVersePoints = userData?.points?.codingVersePoints || 0;

  // Calculate dynamic progress mapping for the 4 badges
  const badgeProgress = {
    b1: { unlocked: false, unlockedAt: null, progress: 0, current: 0, target: 1, label: "First 100 users whitelist" },
    b2: { 
      unlocked: commits >= 100, 
      unlockedAt: commits >= 100 ? "Verified" : null, 
      progress: Math.min(100, Math.round((commits / 100) * 100)), 
      current: commits, 
      target: 100, 
      label: "GitHub Commits Audited" 
    },
    b3: { 
      unlocked: streak >= 10, 
      unlockedAt: streak >= 10 ? "Verified" : null, 
      progress: Math.min(100, Math.round((streak / 10) * 100)), 
      current: streak, 
      target: 10, 
      label: "Daily Consistency Streaks" 
    },
    b4: { 
      unlocked: codingVersePoints >= 100, 
      unlockedAt: codingVersePoints >= 100 ? "Verified" : null, 
      progress: Math.min(100, Math.round((codingVersePoints / 100) * 100)), 
      current: codingVersePoints, 
      target: 100, 
      label: "Frontend Arenas Solved (XP)" 
    }
  };

  // Dynamically calculate daily quests completion from actual platform performance
  const dailyQuests = [
    { 
      id: "q1", 
      title: "GitRank Explorer", 
      description: "Audit commits in any public repository", 
      xp: 50, 
      progress: commits > 0 ? 1 : 0, 
      target: 1, 
      completed: commits > 0 
    },
    { 
      id: "q2", 
      title: "Consistency Streak", 
      description: "Maintain your daily streak in CodingOwl", 
      xp: 100, 
      progress: streak > 0 ? 1 : 0, 
      target: 1, 
      completed: streak > 0 
    },
    { 
      id: "q3", 
      title: "Verse Conqueror", 
      description: "Solve a medium-difficulty problem in CodingVerse (40 XP each)", 
      xp: 150, 
      progress: Math.min(2, Math.floor(codingVersePoints / 40)), 
      target: 2, 
      completed: codingVersePoints >= 80 
    }
  ];

  const unlockedCount = Object.values(badgeProgress).filter((b) => b.unlocked).length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <SectionHeader
        title="Achievements & Badges"
        subtitle="Complete milestones, unlock legendary badges, and show off your engineering ranking credentials."
        badge="System Active"
        badgeColor="bg-violet-500/10 text-violet-500 dark:text-violet-400 border border-violet-500/20"
      />


      {/* Main Grid: Left side Badges list, Right side detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Badge List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white my-0 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Developer Badges
            </h3>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-200/50 dark:border-slate-800/50">
              {unlockedCount} of 4 Unlocked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {systemBadges.map((badge) => {
              const info = badgeProgress[badge.id] || { unlocked: false, progress: 0 };
              const isSelected = selectedBadge.id === badge.id;

              return (
                <Card
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={`p-5 flex items-center gap-4 cursor-pointer border transition-all duration-300 ${
                    isSelected
                      ? "border-violet-500 ring-2 ring-violet-500/10 shadow-lg"
                      : "border-slate-200/50 dark:border-slate-800/50 hover:border-slate-400/30 hover:shadow-md"
                  }`}
                >
                  {/* Badge Visual Icon */}
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${badge.color} flex items-center justify-center shadow-lg relative flex-shrink-0 ${
                      !info.unlocked ? "brightness-75 saturate-50" : ""
                    }`}
                  >
                    <span className="text-2xl">{badge.icon}</span>
                    
                    {/* Locked / Unlocked Indicator */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                      {info.unlocked ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Lock className="w-3 h-3 text-slate-500" />
                      )}
                    </div>
                  </div>

                  {/* Text Details */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate my-0">
                        {badge.name}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400">
                        {info.progress}%
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {badge.description}
                    </p>

                    {/* Simple Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${info.progress}%` }}
                      />
                    </div>

                    {/* Share action buttons row */}
                    {info.unlocked && (
                      <div className="flex gap-2 pt-1 mt-1 justify-end" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => shareBadge("twitter", badge.name)}
                          className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 border border-sky-500/20 hover:scale-105 transition-all cursor-pointer"
                          title="Share on Twitter"
                        >
                          <Twitter className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => shareBadge("linkedin", badge.name)}
                          className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/20 hover:scale-105 transition-all cursor-pointer"
                          title="Share on LinkedIn"
                        >
                          <Linkedin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => shareBadge("whatsapp", badge.name)}
                          className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 hover:scale-105 transition-all cursor-pointer"
                          title="Share on WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Daily Quests Board */}
          <div className="pt-4 space-y-4">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white my-0 flex items-center gap-2">
              <Target className="w-5 h-5 text-violet-500" />
              Daily Quests
            </h3>

            <div className="space-y-3">
              {dailyQuests.map((quest) => (
                <Card
                  key={quest.id}
                  className={`p-4 flex items-center justify-between gap-4 border border-slate-200/50 dark:border-slate-800/50 transition-all ${
                    quest.completed ? "bg-emerald-500/5 dark:bg-emerald-500/2 border-emerald-500/20" : ""
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-extrabold text-sm ${quest.completed ? "text-emerald-500 dark:text-emerald-400" : "text-slate-900 dark:text-white"}`}>
                        {quest.title}
                      </span>
                      {quest.completed && (
                        <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">
                          Claimed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal my-0">
                      {quest.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    {/* Quest Progress Indicator */}
                    <span className="text-xs font-bold text-slate-400">
                      {quest.progress} / {quest.target}
                    </span>

                    {/* XP reward */}
                    <div className="flex items-center gap-1 bg-violet-500/10 text-violet-500 dark:text-violet-400 border border-violet-500/20 px-2 py-1 rounded-lg text-xs font-black">
                      <Zap className="w-3 h-3 fill-current" />
                      +{quest.xp} XP
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Selected Badge Detailed Panel */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white my-0 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            Badge Details
          </h3>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedBadge.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-6 border border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-b from-slate-50/50 to-slate-100/50 dark:from-slate-900/40 dark:to-slate-950/40 relative overflow-hidden">
                {/* Decorative absolute element */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${selectedBadge.color} opacity-5 blur-[40px] pointer-events-none rounded-full`} />

                <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                  {/* Glowing Big Badge representation */}
                  <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${selectedBadge.color} flex items-center justify-center shadow-xl shadow-indigo-500/10 relative`}>
                    <span className="text-5xl">{selectedBadge.icon}</span>
                    
                    {/* Orbit Ring */}
                    <div className="absolute inset-0 rounded-3xl border border-white/20 animate-pulse" />
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white my-0">
                      {selectedBadge.name}
                    </h3>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mt-1">
                      {badgeProgress[selectedBadge.id]?.unlocked ? "Status: Unlocked" : "Status: In Progress"}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold max-w-xs leading-relaxed italic bg-white/50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200/30 dark:border-slate-800/30">
                    "{selectedBadge.description}"
                  </p>

                  <div className="w-full pt-4 border-t border-slate-200/40 dark:border-slate-800/40 text-left space-y-3.5">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Criteria</span>
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-200 block mt-0.5">
                        {badgeProgress[selectedBadge.id]?.label}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Milestone Progress</span>
                      <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                        <span>{badgeProgress[selectedBadge.id]?.current} earned</span>
                        <span>of {badgeProgress[selectedBadge.id]?.target} required</span>
                      </div>
                      
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                          style={{ width: `${badgeProgress[selectedBadge.id]?.progress}%` }}
                        />
                      </div>
                    </div>

                    {badgeProgress[selectedBadge.id]?.unlocked ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold justify-center">
                          <Star className="w-4 h-4 fill-current" />
                          Unlocked on {badgeProgress[selectedBadge.id]?.unlockedAt}
                        </div>
                        
                        <div className="space-y-2">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Share Achievement</span>
                          <div className="flex justify-center gap-2.5">
                            <button
                              onClick={() => shareBadge("twitter", selectedBadge.name)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 border border-sky-500/20 text-xs font-bold transition-all cursor-pointer"
                            >
                              <Twitter className="w-3.5 h-3.5" />
                              Twitter
                            </button>
                            <button
                              onClick={() => shareBadge("linkedin", selectedBadge.name)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/20 text-xs font-bold transition-all cursor-pointer"
                            >
                              <Linkedin className="w-3.5 h-3.5" />
                              LinkedIn
                            </button>
                            <button
                              onClick={() => shareBadge("whatsapp", selectedBadge.name)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 text-xs font-bold transition-all cursor-pointer"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              WhatsApp
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-200/40 dark:bg-slate-800/40 border border-slate-300/10 text-slate-400 dark:text-slate-500 text-xs font-semibold justify-center cursor-not-allowed">
                        <Lock className="w-4 h-4" />
                        Complete criteria to unlock
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
};

export default Achievements;
