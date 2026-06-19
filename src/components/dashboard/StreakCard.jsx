import React from "react";
import { Flame, Check } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Card from "../ui/Card";
import { toLocalDateString, resolveTimezone } from "../../utils/streakCalculator";

export const StreakCard = () => {
  const { userData } = useAuth();
  
  const activeStreak = userData?.streak || 0;
  const longestStreak = Math.max(userData?.longestStreak || 0, activeStreak);
  const streakFreezes = userData?.streakFreezes || 0;

  // Calculate today's status using the user's stored timezone
  const now = new Date();
  const timeZone = resolveTimezone(userData?.timezone);
  const todayStr = toLocalDateString(now, timeZone);
  const lastLogin = userData?.lastLogin ? new Date(userData?.lastLogin) : null;
  const loggedInToday =
    lastLogin && toLocalDateString(lastLogin, timeZone) === todayStr;
  
  const dailyProgressMins = loggedInToday ? 60 : 0;
  const dailyGoalMins = 60;
  const percentComplete = loggedInToday ? 100 : 0;

  // Generate dynamic streak history for the current week (Monday - Sunday)
  const getDynamicStreakHistory = () => {
    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    // Get Monday of current week
    const currentDay = now.getDay(); // 0 (Sunday) to 6 (Saturday)
    const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;
    
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysSinceMonday);
    monday.setHours(0, 0, 0, 0);

    const history = [];
    
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      dayDate.setHours(0, 0, 0, 0);

      const dayStr = daysOfWeek[i];
      const dateLabel = dayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      
      const dayDateStr = toLocalDateString(dayDate, timeZone);

      let status = "pending";

      if (dayDateStr === todayStr) {
        status = loggedInToday ? "completed" : "current";
      } else if (dayDate < now) {
        // Past day — infer completion from active streak length (timezone-aware)
        const dayMs = Date.parse(`${dayDateStr}T12:00:00Z`);
        const todayMs = Date.parse(`${todayStr}T12:00:00Z`);
        const diffDays = Math.round((todayMs - dayMs) / (1000 * 60 * 60 * 24));
        const maxCompletedDiff = Math.max(0, loggedInToday ? activeStreak - 1 : activeStreak);
        if (diffDays >= 0 && diffDays <= maxCompletedDiff) {
          status = "completed";
        }
      }

      history.push({
        day: dayStr,
        status,
        date: dateLabel
      });
    }
    return history;
  };

  const streakHistory = getDynamicStreakHistory();

  return (
    <Card className="flex flex-col h-full overflow-hidden relative">
      {/* Background orange glow */}
      <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Streak Tracker</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">Keep up your daily coding habit</p>
        </div>
       <div className="flex flex-col items-end gap-1">
  <div className="flex items-center gap-1 text-orange-500 dark:text-orange-400 font-extrabold text-sm animate-pulse">
    <Flame className="w-5 h-5 fill-orange-500/20" />
    <span>{activeStreak} Days</span>
  </div>
  {streakFreezes > 0 && (
    <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
      <span>🧊</span>
      <span>{streakFreezes} Freeze{streakFreezes > 1 ? "s" : ""}</span>
    </div>
  )}
</div>
      </div>

      {/* Progress Circle & Metrics */}
      <div className="flex-1 mt-6 flex flex-col md:flex-row items-center justify-around gap-6">
        
        {/* Progress Bar Display */}
        <div className="flex-1 w-full space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Today's Progress</span>
            <span>{dailyProgressMins} / {dailyGoalMins} mins</span>
          </div>

          {/* Bar track */}
          <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/20 dark:border-slate-800/20">
            <div
              style={{ width: `${percentComplete}%` }}
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
            />
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            {loggedInToday 
              ? "Streak extended for today! Keep up the amazing work." 
              : "Check-in or log code today to keep your daily streak active."}
          </div>
        </div>

        {/* Mascot state or Longest streak */}
        <div className="p-3 bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-xl border border-orange-500/10 text-center flex-shrink-0 min-w-[110px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Longest Streak
          </span>
          <span className="block text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
            {longestStreak} Days
          </span>
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
            Personal Record
          </span>
        </div>

      </div>

      {/* Week day bubbles */}
      <div className="grid grid-cols-7 gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
        {streakHistory.map((item, idx) => {
          const isDone = item.status === "completed";
          const isCurrent = item.status === "current";
          
          return (
            <div key={idx} className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                {item.day}
              </span>
              
              <div
                className={`
                  w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-300
                  ${isDone 
                    ? "bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/15" 
                    : isCurrent 
                      ? "bg-orange-500/15 border border-orange-500/35 text-orange-500 animate-pulse" 
                      : "bg-slate-100 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 border border-transparent"}
                `}
                title={`${item.date}: ${item.status}`}
              >
                {isDone ? <Check className="w-3.5 h-3.5 stroke-[3px]" /> : isCurrent ? "🦉" : "?"}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default StreakCard;
