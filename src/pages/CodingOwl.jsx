import React, { useState, useEffect, useRef } from "react";
import { 
  Timer, 
  Plus, 
  Check,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Flame,
  Trophy
} from "lucide-react";
import { habitCards, weeklyHeatmap } from "../data/streaks";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  serverTimestamp 
} from "firebase/firestore";

// --- Pomodoro Session History Hook ---
function usePomodoroHistory(userId) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSessions = async () => {
    if (!userId || !db) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "focusSessions"),
        where("uid", "==", userId),
        orderBy("completedAt", "desc")
      );
      const snap = await getDocs(q);
      setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error fetching focus sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveSession = async (durationMinutes) => {
    if (!userId || !db) return;
    try {
      await addDoc(collection(db, "focusSessions"), {
        uid: userId,
        durationMinutes,
        completedAt: serverTimestamp(),
      });
      fetchSessions(); // refresh
    } catch (err) {
      console.error("Error saving focus session:", err);
    }
  };

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const totalHours = sessions.reduce((acc, s) => acc + (s.durationMinutes || 25), 0) / 60;
  const totalSessions = sessions.length;

  return { sessions, loading, saveSession, totalHours, totalSessions };
}

// --- Pomodoro Timer Component ---
const POMODORO_DURATION = 25 * 60; // 25 minutes in seconds

function PomodoroTimer({ onSessionComplete }) {
  const [secondsLeft, setSecondsLeft] = useState(POMODORO_DURATION);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setCompleted(true);
            onSessionComplete(25);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, onSessionComplete]);

  const reset = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setCompleted(false);
    setSecondsLeft(POMODORO_DURATION);
  };

  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");
  const progress = ((POMODORO_DURATION - secondsLeft) / POMODORO_DURATION) * 100;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Circular progress ring */}
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8"
            className="text-slate-200 dark:text-slate-800" />
          <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 54}`}
            strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
            strokeLinecap="round"
            className={completed ? "text-emerald-500" : "text-orange-500"}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {minutes}:{seconds}
          </span>
          <span className="text-[9px] text-slate-400 font-bold uppercase">
            {completed ? "Done!" : running ? "Focus" : "Ready"}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          disabled={completed}
          className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-1.5 transition-all ${
            completed
              ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
              : running
              ? "bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/25 hover:bg-orange-500/25"
              : "bg-orange-500 text-white hover:bg-orange-600 shadow-md shadow-orange-500/25"
          }`}
        >
          {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          {running ? "Pause" : "Start"}
        </button>
        <button
          onClick={reset}
          className="p-2 rounded-xl font-bold border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {completed && (
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">
          ✅ Session saved to Firestore!
        </span>
      )}
    </div>
  );
}

// --- Main CodingOwl Component ---
export const CodingOwl = () => {
  const { user, userData } = useAuth();
  const userName = userData?.name || "Developer";
  const loginStreak = userData?.streak || 0;
  const githubStreak = userData?.githubStreak || 0; // New GitHub Live Streak
  const [habits, setHabits] = useState(habitCards);
  const { sessions, loading, saveSession, totalHours, totalSessions } =
    usePomodoroHistory(user?.uid);

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

        {/* Live Pomodoro Timer */}
        <Card className="p-6 flex flex-col items-center justify-between gap-4">
          <div className="w-full space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Focus Arena</span>
            <h3 className="text-lg font-extrabold text-slate-950 dark:text-white my-0">
              Pomodoro Timer
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              25-min focus sessions — saved to your history.
            </p>
          </div>
          <PomodoroTimer onSessionComplete={saveSession} />
        </Card>

      </div>

      {/* Focus Session Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-5 flex items-center gap-4 border-orange-500/15">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Total Hours Focused</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {totalHours.toFixed(1)}h
            </p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4 border-orange-500/15">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Sessions Completed</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{totalSessions}</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4 border-orange-500/15">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Avg. Session Length</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {totalSessions > 0 ? `${Math.round((totalHours * 60) / totalSessions)}m` : "—"}
            </p>
          </div>
        </Card>
      </div>

      {/* Session History Log */}
      <Card className="p-6">
        <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white my-0">
              Session History
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Your recent Pomodoro sessions saved to Firestore.
            </p>
          </div>
          <span className="text-xs font-bold text-orange-500">
            {loading ? "Loading…" : `${totalSessions} sessions`}
          </span>
        </div>

        {!user ? (
          <p className="py-6 text-center text-sm text-slate-400 font-medium">
            Sign in with GitHub to track and save your focus sessions.
          </p>
        ) : !db ? (
          <p className="py-6 text-center text-sm text-slate-400 font-medium">
            Firestore is not configured for this environment.
          </p>
        ) : loading ? (
          <div className="py-6 flex justify-center">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400 font-medium">
            No sessions yet — start a Pomodoro to record your first one!
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/40 mt-4">
            {sessions.slice(0, 10).map((s) => {
              const date = s.completedAt?.toDate
                ? s.completedAt.toDate().toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Just now";
              return (
                <div key={s.id} className="py-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <Timer className="w-3.5 h-3.5 text-orange-500" />
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{date}</span>
                  </div>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-orange-500/10 text-orange-500 dark:text-orange-400 border border-orange-500/20">
                    {s.durationMinutes || 25} min
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

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