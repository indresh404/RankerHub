import React, { useEffect, useState } from "react";
import { Sparkles, Quote, Star, Loader2 } from "lucide-react";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";

export const RankHer = () => {
  const { user, userData } = useAuth();

  // null  = subscription has not yet returned data (loading)
  // []    = subscription returned, zero qualifying users
  // [...] = real users ranked by totalPoints
  const [womenUsers, setWomenUsers] = useState(null);

  useEffect(() => {

    const q = query(
      collection(db, "users"),
      where("onboardingStatus", "==", "complete"),
      where("gender", "==", "female"),
      orderBy("points.totalPoints", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const users = snapshot.docs.map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        }));
        setWomenUsers(users.map((u, i) => ({ ...u, rank: i + 1 })));
      },
      (error) => {
        console.error("RankHer leaderboard subscription error:", error);
        setWomenUsers([]);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const renderBody = () => {

    if (womenUsers === null) {
      return (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-sm font-medium">Loading rankings...</span>
        </div>
      );
    }

    if (womenUsers.length === 0) {
      return (
        <Card className="p-8 text-center">
          <Sparkles className="w-10 h-10 text-pink-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            No rankings yet. Be the first to complete onboarding and appear
            here!
          </p>
        </Card>
      );
    }

    const topPoints = womenUsers[0]?.points?.totalPoints || 0;

    return (
      <>
        {/* Spotlight cards: top 2 real women engineers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {womenUsers.slice(0, 2).map((u) => {
            const isCurrentUser = user && u.uid === user.uid;
            const displayName = isCurrentUser ? (userData?.name || u.name) : u.name;
            const displayAvatar = isCurrentUser ? (userData?.avatar || user?.photoURL || u.avatar) : (u.avatar || u.photoURL);

            return (
            <Card
              key={u.uid}
              className="p-6 relative overflow-hidden flex flex-col md:flex-row items-center gap-6 border-pink-500/15"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 ring-4 ring-pink-500/10 relative">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-pink-500/10 flex items-center justify-center text-2xl font-black text-pink-500">
                    {(displayName || "?")[0].toUpperCase()}
                  </div>
                )}
                <div className="absolute bottom-1 right-1 bg-pink-500 text-white p-1 rounded-lg">
                  <Star className="w-3.5 h-3.5 fill-white" />
                </div>
              </div>

              <div className="flex-1 space-y-3 text-center md:text-left w-full">
                <div>
                  <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-widest bg-pink-500/10 dark:bg-pink-500/20 px-2 py-0.5 rounded-full border border-pink-500/20">
                    Rank #{u.rank}
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-2 mb-0">
                    {displayName}
                  </h3>
                  <span className="text-xs font-bold text-slate-400">
                    {u.githubUsername ? `@${u.githubUsername}` : u.college || ""}
                    {u.college && u.githubUsername ? ` • ${u.college}` : ""}
                  </span>
                </div>

                {/* Progress Bar for Spotlight User */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-pink-500">XP Progress</span>
                    <span className="text-slate-600 dark:text-pink-400">
                      {topPoints > 0 ? Math.round(((u.points?.totalPoints || 0) / topPoints) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-pink-500 to-pink-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${topPoints > 0 ? ((u.points?.totalPoints || 0) / topPoints) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200/25 dark:border-slate-800/25 relative">
                  <Quote className="w-4 h-4 text-pink-300 dark:text-pink-500/40 absolute top-2 left-2" />
                  <p className="text-xs italic text-slate-500 dark:text-slate-400 pl-5 pr-2 pt-1 font-medium leading-relaxed">
                    {(u.points?.totalPoints || 0).toLocaleString()} XP earned
                  </p>
                </div>

                <div className="flex items-center justify-center md:justify-start gap-4 text-xs font-bold text-slate-500 pt-1">
                  <span>
                    GitRank:{" "}
                    <span className="text-slate-800 dark:text-white">
                      {u.points?.gitRankPoints ?? 0}
                    </span>
                  </span>
                  <span>
                    Streak:{" "}
                    <span className="text-orange-500">
                      {u.points?.streakPoints ?? 0} pts
                    </span>
                  </span>
                </div>
              </div>
            </Card>
            );
          })}
        </div>

        {/* Empowerment banner */}
        <Card className="relative overflow-hidden p-8 text-white bg-gradient-to-r from-pink-500 via-pink-600 to-rose-500 border-none shadow-[0_10px_35px_rgba(236,72,153,0.3)]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="max-w-2xl space-y-4">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight my-0">
              Fostering Representation in Tech.
            </h2>
            <p className="text-sm md:text-base text-pink-50 leading-relaxed font-medium">
              Advancing diversity within technology builds more creative,
              inclusive solutions. The RankHer initiative highlights women
              software engineers, ensuring high visibility for contributions,
              publications, and system leadership.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <span className="px-3 py-1 rounded-xl text-xs bg-white/20 text-white font-bold backdrop-blur-md">
                Gender Equity Focus
              </span>
              <span className="px-3 py-1 rounded-xl text-xs bg-white/20 text-white font-bold backdrop-blur-md">
                Career Advancement
              </span>
            </div>
          </div>
        </Card>

        {/* Live leaderboard table */}
        <Card className="p-6">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white my-0">
              Top Advocate Standings
            </h3>
            <span className="text-xs font-bold bg-pink-500/10 text-pink-500 border border-pink-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Live
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm mt-4">
            {womenUsers.map((u) => {
              const isCurrentUser = user && u.uid === user.uid;
              const displayName = isCurrentUser ? (userData?.name || u.name) : u.name;
              const displayAvatar = isCurrentUser ? (userData?.avatar || user?.photoURL || u.avatar) : (u.avatar || u.photoURL);

              return (
              <div
                key={u.uid}
                className="py-4 flex items-center justify-between gap-4 hover:bg-pink-500/5 dark:hover:bg-pink-500/5 transition-colors rounded-xl px-2"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-bold text-pink-500 w-6">
                    #{u.rank}
                  </span>

                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                    {displayAvatar ? (
                      <img
                        src={displayAvatar}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-black text-pink-500">
                        {(displayName || "?")[0].toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-extrabold text-slate-900 dark:text-white block leading-tight truncate">
                        {displayName}
                      </span>
                      <span className="text-[10px] text-pink-500/80 font-bold truncate hidden sm:inline">
                        {u.githubUsername ? `@${u.githubUsername}` : u.college || ""}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-pink-500 to-pink-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${topPoints > 0 ? ((u.points?.totalPoints || 0) / topPoints) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-pink-500/80 min-w-[28px] text-right">
                        {topPoints > 0 ? Math.round(((u.points?.totalPoints || 0) / topPoints) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right min-w-[75px] flex-shrink-0">
                  <span className="block font-black text-pink-600 dark:text-pink-400 leading-none">
                    {(u.points?.totalPoints || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    XP Points
                  </span>
                </div>
              </div>
              );
            })}
          </div>
        </Card>
      </>
    );
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="RankHer Initiative"
        subtitle="Celebrating diversity in technology. Showcasing and spotlighting top women software engineers."
        badge="Equality Focus"
        badgeColor="bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20"
      />

      {renderBody()}
    </div>
  );
};

export default RankHer;
