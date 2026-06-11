import React, { useState, useEffect, useRef } from "react";
import { Timer, Plus, Check, ShoppingCart, CircleDollarSign } from "lucide-react";
import { habitCards, weeklyHeatmap } from "../data/streaks";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import { useAuth } from "../context/AuthContext";
import { mascotsData } from "../constants/mascots";

export const CodingOwl = () => {
  const { userData, purchaseMascot, equipMascot } = useAuth();
  const userName = userData?.name || "Developer";
  const loginStreak = userData?.streak || 0;
  const githubStreak = userData?.githubStreak || 0;
  
  // 1. OPTIMISTIC STATES for Shop & Rewards
  const [optimisticCoins, setOptimisticCoins] = useState(userData?.hubCoins ?? 500);
  const [optimisticInventory, setOptimisticInventory] = useState(userData?.inventory || ["oliver"]);
  const [optimisticEquipped, setOptimisticEquipped] = useState(userData?.activeMascot || "oliver");

  // Sync local optimistic state whenever backend data actually updates
  useEffect(() => {
    setOptimisticCoins(userData?.hubCoins ?? 500);
    setOptimisticInventory(userData?.inventory || ["oliver"]);
    setOptimisticEquipped(userData?.activeMascot || "oliver");
  }, [userData?.hubCoins, userData?.inventory, userData?.activeMascot]);

  const activeMascotInfo = mascotsData.find(m => m.id === optimisticEquipped) || mascotsData[0];

  const [activeTab, setActiveTab] = useState("arena"); 

  // --- Habit Checklist Persistence & Optimistic Update ---
  const [habits, setHabits] = useState(() => {
    if (typeof window !== "undefined") {
      const savedHabits = localStorage.getItem("codingOwlHabits");
      return savedHabits ? JSON.parse(savedHabits) : habitCards;
    }
    return habitCards;
  });

  useEffect(() => {
    localStorage.setItem("codingOwlHabits", JSON.stringify(habits));
  }, [habits]);

  // --- Pomodoro Persistence & Optimistic Completion ---
  const [timeLeft, setTimeLeft] = useState(() => {
    if (typeof window !== "undefined") {
      const savedEndTime = localStorage.getItem("pomodoroEndTime");
      if (savedEndTime) {
        const remainingTime = Math.floor((parseInt(savedEndTime, 10) - Date.now()) / 1000);
        if (remainingTime > 0) return remainingTime;
      }
      const savedTimeLeft = localStorage.getItem("pomodoroTimeLeft");
      if (savedTimeLeft) {
        const parsed = parseInt(savedTimeLeft, 10);
        if (parsed > 0) return parsed;
      }
    }
    return 1500; 
  });

  const [timerActive, setTimerActive] = useState(() => {
    if (typeof window !== "undefined") {
      const savedEndTime = localStorage.getItem("pomodoroEndTime");
      if (savedEndTime) {
        const remainingTime = Math.floor((parseInt(savedEndTime, 10) - Date.now()) / 1000);
        if (remainingTime > 0) return true;
        localStorage.removeItem("pomodoroEndTime");
      }
    }
    return false;
  });
  const timerRef = useRef(null);

  // 2. Optimistic Pomodoro Reward Logic
  const handlePomodoroComplete = async () => {
    const prevCoins = optimisticCoins;
    // Optimistically reward 50 HubCoins
    setOptimisticCoins((prev) => prev + 50);
    
    try {
      // Simulate backend Firestore update for Pomodoro session
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (error) {
      // Rollback on failure
      setOptimisticCoins(prevCoins);
      alert("Failed to sync Pomodoro session to server.");
    }
  };

  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerActive(false);
            localStorage.removeItem("pomodoroEndTime");
            localStorage.removeItem("pomodoroTimeLeft");
            
            // Trigger optimistic completion
            handlePomodoroComplete();
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
    if (timerActive) {
      setTimerActive(false);
      localStorage.removeItem("pomodoroEndTime");
      localStorage.setItem("pomodoroTimeLeft", timeLeft.toString());
    } else {
      setTimerActive(true);
      const endTime = Date.now() + timeLeft * 1000;
      localStorage.setItem("pomodoroEndTime", endTime.toString());
      localStorage.removeItem("pomodoroTimeLeft");
    }
  };

  const resetTimer = () => {
    setTimerActive(false);
    setTimeLeft(1500);
    localStorage.removeItem("pomodoroEndTime");
    localStorage.removeItem("pomodoroTimeLeft");
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // 3. Optimistic Habit (Streak) Check-in
  const toggleHabitComplete = async (id) => {
    // Snapshot previous state for rollback
    const previousHabits = [...habits];

    // Apply Optimistic Update Immediately
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id === id) {
          const newProgress = habit.progress === 100 ? 0 : 100;
          const newStreak = newProgress === 100 ? habit.streak + 1 : Math.max(0, habit.streak - 1);
          return { ...habit, progress: newProgress, streak: newStreak };
        }
        return habit;
      })
    );

    try {
      // Simulate backend streak sync API call
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      // Rollback UI if backend fails
      setHabits(previousHabits);
      alert("Action failed — please try again");
    }
  };

  // 4. Optimistic Mascot Purchase
  const handlePurchase = async (mascotId, price) => {
    if (optimisticCoins < price) return;

    // Snapshot
    const prevCoins = optimisticCoins;
    const prevInventory = [...optimisticInventory];

    // Optimistic Apply
    setOptimisticCoins((prev) => prev - price);
    setOptimisticInventory((prev) => [...prev, mascotId]);

    try {
      await purchaseMascot(mascotId, price);
    } catch (err) {
      // Rollback
      setOptimisticCoins(prevCoins);
      setOptimisticInventory(prevInventory);
      console.error(err);
      alert(err.message || "Action failed — please try again");
    }
  };

  // 5. Optimistic Mascot Equip
  const handleEquip = async (mascotId) => {
    // Snapshot
    const prevEquipped = optimisticEquipped;
    
    // Optimistic Apply
    setOptimisticEquipped(mascotId);

    try {
      await equipMascot(mascotId);
    } catch (err) {
      // Rollback
      setOptimisticEquipped(prevEquipped);
      console.error(err);
      alert(err.message || "Action failed — please try again");
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <SectionHeader
          title="CodingOwl Streak Tracker"
          subtitle="Stay consistent, build ironclad coding habits, and earn points with our companion owl."
          badge="Consistency mascot"
          badgeColor="bg-orange-500/10 text-orange-500 dark:text-orange-400 border border-orange-500/20"
        />
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl">
          <CircleDollarSign className="w-5 h-5 text-amber-500" />
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-500">HubCoins</span>
            <span className="block text-sm font-black text-slate-900 dark:text-white leading-none">{optimisticCoins.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab("arena")}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
            activeTab === "arena"
              ? "border-orange-500 text-orange-500"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <Timer className="w-4 h-4 inline-block mr-2" />
          Focus Arena
        </button>
        <button
          onClick={() => setActiveTab("shop")}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
            activeTab === "shop"
              ? "border-amber-500 text-amber-500"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <ShoppingCart className="w-4 h-4 inline-block mr-2" />
          Mascot Shop
        </button>
      </div>

      {activeTab === "arena" ? (
        <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mascot bubble */}
        <Card className={`lg:col-span-2 p-8 flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-br from-${activeMascotInfo.color}-500/10 via-slate-50/0 to-slate-50/0 dark:from-${activeMascotInfo.color}-500/5 dark:via-slate-900/0 dark:to-slate-900/0 border-${activeMascotInfo.color}-500/15`}>
          <div className={`w-28 h-28 rounded-full bg-gradient-to-tr from-${activeMascotInfo.color}-400 to-${activeMascotInfo.color === 'orange' ? 'red' : activeMascotInfo.color}-500 flex items-center justify-center text-4xl shadow-lg border border-${activeMascotInfo.color}-400/25 flex-shrink-0 animate-bounce`}>
            {activeMascotInfo.icon}
          </div>

          <div className="space-y-3 flex-1 text-center sm:text-left">
            <h3 className="text-xl font-extrabold text-slate-950 dark:text-white my-0">
              Mascot: {activeMascotInfo.label}
            </h3>

            <div className="bg-white/80 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/45 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-semibold italic relative">
              "Whoo-whoo! You've pushed code to GitHub for {githubStreak} consecutive days, {userName}. {activeMascotInfo.label} is proud! Maintain your live GitHub streak today to earn your +10 HubCoins daily bonus."
            </div>

            <div className="flex justify-center sm:justify-start items-center gap-4 text-xs font-bold text-slate-400">
              <span>Mood: <span className={`text-${activeMascotInfo.color}-500`}>Ecstatic! 🔥</span></span>
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
            <span 
              role="timer"
              aria-live="polite"
              aria-atomic="true"
              aria-label={`Pomodoro timer: ${Math.floor(timeLeft / 60)} minutes and ${timeLeft % 60} seconds remaining`}
              className="text-4xl font-black text-slate-900 dark:text-white tracking-widest block font-mono"
            >
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
        </>
      ) : (
        <div className="space-y-6">
          <div className="text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed text-sm">
            Welcome to the Mascot Shop! Spend your hard-earned HubCoins to unlock new companions. 
            Mascots appear on your dashboard, profile, and inside the CodingVerse arena.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mascotsData.map((mascot) => {
              const isOwned = optimisticInventory.includes(mascot.id);
              const isEquipped = optimisticEquipped === mascot.id;
              const canAfford = optimisticCoins >= mascot.price;

              return (
                <Card key={mascot.id} className={`p-6 flex flex-col justify-between border-2 transition-all ${isEquipped ? 'border-amber-500' : 'border-slate-200/50 dark:border-slate-800/50 hover:border-amber-500/30'}`}>
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-tr from-${mascot.color}-400 to-${mascot.color === 'orange' ? 'red' : mascot.color}-500 flex items-center justify-center text-3xl shadow-lg border border-${mascot.color}-400/25`}>
                        {mascot.icon}
                      </div>
                      {isEquipped && (
                        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[10px] font-bold uppercase rounded-md border border-amber-500/20">
                          Equipped
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1">
                      {mascot.label}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium min-h-[40px]">
                      {mascot.description}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                    {isEquipped ? (
                      <button disabled className="w-full py-2.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed flex items-center justify-center gap-2 transition-all">
                        <Check className="w-4 h-4" /> Selected
                      </button>
                    ) : isOwned ? (
                      <button 
                        onClick={() => handleEquip(mascot.id)}
                        className="w-full py-2.5 rounded-xl font-bold bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500 border border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 cursor-pointer flex items-center justify-center gap-2 transition-all"
                      >
                        Equip Mascot
                      </button>
                    ) : (
                      <button 
                        onClick={() => handlePurchase(mascot.id, mascot.price)}
                        disabled={!canAfford}
                        className={`w-full py-2.5 rounded-xl font-bold border flex items-center justify-center gap-2 transition-all ${
                          canAfford 
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent hover:scale-[1.02] cursor-pointer" 
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent cursor-not-allowed"
                        }`}
                      >
                        {mascot.price === 0 ? "Free" : (
                          <>
                            <CircleDollarSign className="w-4 h-4" /> {mascot.price.toLocaleString()}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodingOwl;