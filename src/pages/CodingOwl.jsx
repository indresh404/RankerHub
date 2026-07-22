import React, { useState, useEffect, useRef } from "react";
import { Timer, Plus, Check, RotateCcw } from "lucide-react";
import { habitCards, weeklyHeatmap } from "../data/streaks";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import { useAuth } from "../context/AuthContext";

export const CodingOwl = () => {
  const { userData } = useAuth();
  const userName = userData?.name || "Developer";
  const userStreak = userData?.streak || 0;
  const [habits, setHabits] = useState(habitCards);
  const [timeLeft, setTimeLeft] = useState(1500);
  const [timerActive, setTimerActive] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
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
    setIsResetting(true);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimerActive(false);
    setTimeLeft(1500);

    setTimeout(() => {
      setIsResetting(false);
    }, 500);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const toggleHabitComplete = (id) => {
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id === id) {
          const newProgress = habit.progress === 100 ? 0 : 100;
          const newStreak =
            newProgress === 100
              ? habit.streak + 1
              : Math.max(0, habit.streak - 1);
          return { ...habit, progress: newProgress, streak: newStreak };
        }
        return habit;
      })
    );
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
        {/* Mascot bubble - Enhanced visibility */}
        <div className="lg:col-span-2 p-8 flex flex-col sm:flex-row items-center gap-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-2 border-orange-200 dark:border-orange-800/50">
          {/* Mascot representation */}
          <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-orange-400 to-red-500 flex items-center justify-center text-4xl shadow-lg border-2 border-orange-300 dark:border-orange-600 flex-shrink-0 animate-bounce">
            🦉
          </div>

          <div className="space-y-3 flex-1 text-center sm:text-left">
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-white my-0">
              Mascot: Oliver the Owl
            </h3>

            <div className="bg-orange-50 dark:bg-slate-700/50 p-4 rounded-xl border-2 border-orange-200 dark:border-orange-800/50 text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-semibold italic relative">
              "Whoo-whoo! You've logged code for {userStreak} consecutive days,{" "}
              {userName}. Oliver is proud! Maintain your streak today to earn a
              1.5x points multiplier."
            </div>

            <div className="flex justify-center sm:justify-start items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>
                Mood: <span className="text-orange-500">Ecstatic! 🔥</span>
              </span>
              <span>•</span>
              <span>Next Check-in: 8 hours remaining</span>
            </div>
          </div>
        </div>

        {/* Focus Timer Session Card - Enhanced visibility */}
        <div className="p-6 flex flex-col justify-between bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-2 border-orange-200 dark:border-orange-800/50">
          <div className="space-y-2">
            <span className="text-xs font-bold text-orange-500 dark:text-orange-400 uppercase">
              Focus Arena
            </span>
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-white my-0">
              Focus Mode Session
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Lock out distractions and log heads-down coding time.
            </p>
          </div>

          {/* Timer visualization */}
          <div className="my-6 text-center flex flex-col items-center justify-center">
            <span
              className={`text-4xl font-black text-slate-800 dark:text-white tracking-widest block font-mono transition-all duration-300 ${
                isResetting
                  ? "scale-110 text-orange-500 rotate-12"
                  : "scale-100"
              }`}
            >
              {formatTime(timeLeft)}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold mt-1.5 block">
              Pomodoro Interval
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTimer}
              className={`flex-1 py-2.5 rounded-xl font-bold border-2 text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                timerActive
                  ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600"
                  : "bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 text-white border-orange-600"
              }`}
            >
              <Timer className="w-4 h-4" />{" "}
              {timerActive ? "Pause Focus" : "Start Focus"}
            </button>
            <button
              onClick={resetTimer}
              disabled={isResetting}
              className={`px-4 py-2.5 rounded-xl font-bold transition-all duration-300 text-sm cursor-pointer flex items-center justify-center gap-2 ${
                isResetting
                  ? "bg-slate-200 dark:bg-slate-600 cursor-not-allowed opacity-60"
                  : "bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 hover:scale-105 active:scale-95"
              } border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200`}
            >
              <RotateCcw
                className={`w-4 h-4 transition-transform duration-300 ${isResetting ? "animate-spin" : "group-hover:rotate-180"}`}
              />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Habits Checklist Grid */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-lg text-slate-800 dark:text-white my-0">
          Your Habit Dashboard
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className="p-5 flex flex-col justify-between bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-2 border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-700 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                    {habit.frequency}
                  </span>

                  <span className="text-xs font-bold text-orange-500 dark:text-orange-400 flex items-center gap-0.5">
                    🔥 {habit.streak}d
                  </span>
                </div>

                <h4 className="font-extrabold text-slate-800 dark:text-white leading-tight my-0">
                  {habit.title}
                </h4>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {habit.description}
                </p>
              </div>

              {/* Progress Section */}
              <div className="mt-6 pt-3 border-t-2 border-slate-100 dark:border-slate-700 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  <span>Today's status</span>
                  <span
                    className={
                      habit.progress === 100
                        ? "text-emerald-500"
                        : "text-slate-500 dark:text-slate-400"
                    }
                  >
                    {habit.progress === 100 ? "Completed" : "In Progress"}
                  </span>
                </div>

                <button
                  onClick={() => toggleHabitComplete(habit.id)}
                  className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border-2 ${
                    habit.progress === 100
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                      : "bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600"
                  }`}
                >
                  {habit.progress === 100 ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3px]" />{" "}
                      Completed
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" /> Mark Complete
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Consistency heatmap - Enhanced visibility */}
      <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-2 border-slate-200 dark:border-slate-700">
        <div className="pb-4 border-b-2 border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-white my-0">
              Weekly Consistency Grid
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              A historical log of your daily check-in marks.
            </p>
          </div>
          <span className="text-xs font-bold text-orange-500 dark:text-orange-400">
            Last 4 Weeks
          </span>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-6">
          {weeklyHeatmap.map((week, idx) => (
            <div key={idx} className="space-y-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block text-center">
                Week {week.week}
              </span>

              <div className="flex justify-between items-center gap-1.5 py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-700">
                {week.days.map((day, dayIdx) => (
                  <div
                    key={dayIdx}
                    className={`w-3 h-3 rounded-full ${
                      day === 2
                        ? "bg-gradient-to-r from-orange-500 to-red-500 shadow-lg shadow-orange-500/30 ring-2 ring-orange-300 dark:ring-orange-700"
                        : day === 1
                        ? "bg-orange-400 dark:bg-orange-500/40 ring-2 ring-orange-200 dark:ring-orange-800"
                        : "bg-slate-300 dark:bg-slate-600 ring-2 ring-slate-200 dark:ring-slate-700"
                    }`}
                    title={`Day status: ${day}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-6 mt-6 text-xs text-slate-600 dark:text-slate-400 font-bold">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 ring-2 ring-slate-200 dark:ring-slate-700" />
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-400 dark:bg-orange-500/40 ring-2 ring-orange-200 dark:ring-orange-800" />
            <span>Logged</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 ring-2 ring-orange-300 dark:ring-orange-700" />
            <span>Bonus Multiplier Achieved</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingOwl;