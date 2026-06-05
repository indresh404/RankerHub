import React, { useState, useEffect, useRef } from "react";
import { Timer, Plus, Check } from "lucide-react";
import { habitCards, weeklyHeatmap } from "../data/streaks";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import { useAuth } from "../context/AuthContext";

export const CodingOwl = () => {
  const { userData } = useAuth();
  const userName = userData?.name || "Developer";
  const loginStreak = userData?.streak || 0;
  const githubStreak = userData?.githubStreak || 0; // New GitHub Live Streak
  const [habits, setHabits] = useState(habitCards);
  const [timeLeft, setTimeLeft] = useState(1500); // 25:00 in seconds
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive]);

  const toggleTimer = () => {
    setTimerActive(!timerActive);
  };

  const resetTimer = () => {
    setTimerActive(false);
    setTimeLeft(1500);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const toggleHabitComplete = (id) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === id) {
        const newProgress = habit.progress === 100 ? 0 : 100;
        const newStreak = newProgress === 100 ? habit.streak + 1 : Math.max(0, habit.streak - 1);
        return { ...habit, progress: newProgress, streak: newStreak };
      }
      return habit;
    }));
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <SectionHeader
        title="CodingOwl Streak Tracker"
        subtitle="Stay consistent, build ironclad coding habits, and earn points with our companion owl."
        badge="Consistency mascot"
        badgeColor="bg-orange-500/10 text-orange-500 dark:text-orange-400 border border-orange-500/20"
      />

      {/* Mascot & Streak Highlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Mascot bubble */}
        <Card className="lg:col-span-2 p-8 flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-br from-orange-500/10 via-slate-50/0 to-slate-50/0 dark:from-orange-500/5 dark:via-slate-900/0 dark:to-slate-900/0 border-orange-500/15">
          {/* Mascot representation */}
          <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-orange-400 to-red-500 flex items-center justify-center text-4xl shadow-lg border border-orange-400/25 flex-shrink-0 animate-bounce">
            🦉
          </div>

          <div className="space-y-3 flex-1 text-center sm:text-left">
            <h3 className="text-xl font-extrabold text-slate-950 dark:text-white my-0">
              Mascot: Oliver the Owl
            </h3>
            
            <div className="bg-white/80 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/45 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-semibold italic relative">
              "Whoo-whoo! You've pushed code to GitHub for {githubStreak} consecutive days, {userName}. Oliver is proud! Maintain your live GitHub streak today to earn your +10 XP daily bonus."
            </div>
            
            <div className="flex justify-center sm:justify-start items-center gap-4 text-xs font-bold text-slate-400">
              <span>Mood: <span className="text-orange-500">Ecstatic! 🔥</span></span>
              <span>•</span>
              <span>Platform Streak: {loginStreak} days</span>
            </div>
          </div>
        </Card>

        {/* Focus Timer Session Card */}
        <Card className="p-6 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Focus Arena</span>
            <h3 className="text-lg font-extrabold text-slate-950 dark:text-white my-0">
              Focus Mode Session
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Lock out distractions and log heads-down coding time.
            </p>
          </div>

          {/* Timer visualization */}
          <div className="my-6 text-center flex flex-col items-center justify-center">
            <span className="text-4xl font-black text-slate-900 dark:text-white tracking-widest block font-mono">
              {formatTime(timeLeft)}
            </span>
            <span className="text-[10px] text-slate-400 uppercase font-bold mt-1.5 block">
              Pomodoro Interval
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTimer}
              className={`flex-1 py-2.5 rounded-xl font-bold border text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                timerActive 
                  ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500" 
                  : "bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 text-white border-orange-500"
              }`}
            >
              <Timer className="w-4 h-4" /> {timerActive ? "Pause Focus" : "Start Focus"}
            </button>
            <button
              onClick={resetTimer}
              className="px-4 py-2.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 hover:bg-slate-200 transition-all text-sm cursor-pointer"
            >
              Reset
            </button>
          </div>
        </Card>

      </div>

      {/* Habits Checklist Grid */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-lg text-slate-900 dark:text-white my-0">
          Your Habit Dashboard
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {habits.map((habit) => (
            <Card key={habit.id} className="p-5 flex flex-col justify-between border-slate-200/50 dark:border-slate-800/50 hover:border-orange-500/25 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-orange-500/10 text-orange-500 dark:text-orange-400 border border-orange-500/20">
                    {habit.frequency}
                  </span>
                  
                  <span className="text-xs font-bold text-orange-500 dark:text-orange-400 flex items-center gap-0.5">
                    🔥 {habit.streak}d
                  </span>
                </div>

                <h4 className="font-extrabold text-slate-900 dark:text-white leading-tight my-0">
                  {habit.title}
                </h4>
                
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {habit.description}
                </p>
              </div>

              {/* Progress Slider */}
              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span>Today's status</span>
                  <span className={habit.progress === 100 ? "text-emerald-500" : "text-slate-400"}>
                    {habit.progress === 100 ? "Completed" : "In Progress"}
                  </span>
                </div>
                
                <button
                  onClick={() => toggleHabitComplete(habit.id)}
                  className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    habit.progress === 100
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 border border-slate-200/50 dark:border-slate-750"
                  }`}
                >
                  {habit.progress === 100 ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3px]" /> Completed
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" /> Mark Complete
                    </>
                  )}
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 4 Weeks Consistency heatmap representation */}
      <Card className="p-6">
        <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white my-0">
              Weekly Consistency Grid
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              A historical log of your daily check-in marks.
            </p>
          </div>
          <span className="text-xs font-bold text-orange-500">Last 4 Weeks</span>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-6">
          {weeklyHeatmap.map((week, idx) => (
            <div key={idx} className="space-y-3">
              <span className="text-xs font-bold text-slate-400 block text-center">
                Week {week.week}
              </span>
              
              <div className="flex justify-between items-center gap-1.5 py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-200/40 dark:border-slate-800/40">
                {week.days.map((day, dayIdx) => (
                  <div
                    key={dayIdx}
                    className={`w-3 h-3 rounded-full ${
                      day === 2
                        ? "bg-gradient-to-r from-orange-500 to-red-500 shadow-md shadow-orange-500/20"
                        : day === 1
                          ? "bg-orange-500/40 dark:bg-orange-500/20"
                          : "bg-slate-200 dark:bg-slate-800/50"
                    }`}
                    title={`Day status: ${day}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-6 mt-6 text-xs text-slate-400 font-bold">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800" />
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500/20" />
            <span>Logged</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500" />
            <span>Bonus Multiplier Achieved</span>
          </div>
        </div>
      </Card>

    </div>
  );
};

export default CodingOwl;