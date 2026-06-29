import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Activity,
  HeartHandshake,
  Trophy,
  UserCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import SectionHeader from "../components/ui/SectionHeader";
import Card from "../components/ui/Card";
import DeveloperCard from "../components/friends/DeveloperCard";
import Loader from "../components/ui/Loader";
import { useAuth } from "../context/AuthContext";
import collegesList from "../data/colleges.json";
import {
  fetchDevelopers,
  hydrateConnections,
  toggleFollowStatus,
  subscribeToFollowing,
  subscribeToFollowers,
} from "../services/friendsService";

const tabs = [
  {
    id: "friends",
    label: "Friends",
    path: "/dashboard/friends",
    icon: HeartHandshake,
  },
  {
    id: "leaderboard",
    label: "Leaderboard",
    path: "/dashboard/friends/leaderboard",
    icon: Trophy,
  },
  {
    id: "followers",
    label: "Followers",
    path: "/dashboard/friends/followers",
    icon: UsersRound,
  },
  {
    id: "following",
    label: "Following",
    path: "/dashboard/friends/following",
    icon: UserCheck,
  },
];

const getActiveTab = (pathname) => {
  if (pathname.endsWith("/leaderboard")) return "leaderboard";
  if (pathname.endsWith("/followers")) return "followers";
  if (pathname.endsWith("/following")) return "following";
  return "friends";
};

export const Friends = () => {
  const location = useLocation();
  const activeTab = getActiveTab(location.pathname);
  const { user: currentUser, userData } = useAuth();

  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState([]);
  const [followerIds, setFollowerIds] = useState([]);

  // NEW: State to hold the asynchronously fetched connections
  const [connections, setConnections] = useState({
    friends: [],
    followers: [],
    following: [],
    suggested: [],
  });
  const [selectedCollege, setSelectedCollege] = useState("All");

  // 1. Initial Load & Setup Listeners
  useEffect(() => {
    let unsubFollowing = () => {};
    let unsubFollowers = () => {};

    const loadDevelopers = async () => {
      try {
        const fetchedDevs = await fetchDevelopers();
        const filteredDevs = fetchedDevs.filter(
          (dev) => dev.id !== currentUser?.uid,
        );
        setDevelopers(filteredDevs);
      } catch (error) {
        console.error("Failed to load developers", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.uid) {
      loadDevelopers();

      unsubFollowing = subscribeToFollowing(currentUser.uid, (ids) => {
        setFollowingIds(ids);
      });

      unsubFollowers = subscribeToFollowers(currentUser.uid, (ids) => {
        setFollowerIds(ids);
      });
    }

    return () => {
      unsubFollowing();
      unsubFollowers();
    };
  }, [currentUser]);

  // 2. NEW: Async Hydration Effect
  // This replaces useMemo because hydrateConnections now fetches missing users from Firestore
  useEffect(() => {
    let isMounted = true;

    const runHydration = async () => {
      const data = await hydrateConnections(
        developers,
        followingIds,
        followerIds,
        currentUser?.uid,
      );
      if (isMounted) {
        setConnections(data);
      }
    };

    runHydration();

    return () => {
      isMounted = false; // Prevents state updates if component unmounts during fetch
    };
  }, [developers, followingIds, followerIds, currentUser?.uid]);

  // Build a leaderboard from the user's network (followers + following, deduplicated), including the current user
  const leaderboardStandings = React.useMemo(() => {
    const networkMap = new Map();

    // Add all followers and following to the map (deduplicates by id)
    [...connections.followers, ...connections.following].forEach((dev) => {
      if (!networkMap.has(dev.id)) {
        networkMap.set(dev.id, dev);
      }
    });

    // Include the current user in the standings
    if (currentUser?.uid) {
      networkMap.set(currentUser.uid, {
        id: currentUser.uid,
        name:
          userData?.name ||
          userData?.displayName ||
          userData?.githubUsername ||
          currentUser.displayName ||
          "You",
        username: userData?.githubUsername || currentUser.uid,
        avatar:
          userData?.avatar ||
          userData?.photoURL ||
          currentUser.photoURL ||
          `https://ui-avatars.com/api/?name=You&background=random`,
        role: userData?.role || "Developer",
        college: userData?.college || "Unknown",
        bio: userData?.bio || "That's you!",
        tags: userData?.skills || ["Developer"],
        mutualFriends: 0,
        online: true,
        activity: "Currently active",
        totalPoints: userData?.points?.totalPoints || 0,
      });
    }

    // Sort descending by totalPoints
    return Array.from(networkMap.values()).sort(
      (a, b) => (b.totalPoints || 0) - (a.totalPoints || 0),
    );
  }, [connections.followers, connections.following, currentUser, userData]);

  const activeDevelopers =
    activeTab === "leaderboard"
      ? leaderboardStandings
      : connections[activeTab] || [];
  const filteredDevelopers = React.useMemo(() => {
    return activeDevelopers.filter((dev) => {
      if (selectedCollege === "All") return true;
      return dev.college === selectedCollege;
    });
  }, [activeDevelopers, selectedCollege]);

  const tabCopy = {
    friends:
      "Developers who follow you back and collaborate with you across RankerHub.",
    leaderboard:
      "Your network ranked by total XP — see where you stand among your connections.",
    followers:
      "Developers tracking your public progress, badges, and challenge activity.",
    following:
      "Developers whose rankings, activity, and learning notes you follow.",
  };

  const handleToggleFollow = async (developerId) => {
    const isFollowing = followingIds.includes(developerId);
    // Directly mutate Firebase. The onSnapshot listener will automatically update the UI!
    await toggleFollowStatus(currentUser.uid, developerId, isFollowing);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Friends"
        subtitle="Build your developer circle, follow promising builders, and keep up with community activity."
        badge="Social Beta"
        badgeColor="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Friends",
            value: connections.friends.length,
            icon: HeartHandshake,
          },
          {
            label: "Followers",
            value: connections.followers.length,
            icon: UsersRound,
          },
          {
            label: "Following",
            value: connections.following.length,
            icon: UserCheck,
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="p-5 flex items-center justify-between gap-4"
            >
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {stat.label}
                </span>
                <span className="block text-3xl font-black text-slate-900 dark:text-white leading-none mt-1">
                  {stat.value}
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              to={tab.path}
              className={`min-h-11 px-4 py-2 rounded-xl text-sm font-extrabold flex items-center gap-2 border transition-colors whitespace-nowrap ${
                isActive
                  ? "text-white bg-gradient-to-r from-violet-600 to-indigo-600 border-violet-500 shadow-[0_4px_15px_rgba(124,58,237,0.25)]"
                  : "text-slate-500 dark:text-slate-300 bg-white/70 dark:bg-slate-900/70 border-slate-200/50 dark:border-slate-800/50 hover:border-violet-500/30"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white my-0 capitalize">
                {activeTab}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium my-0">
                {tabCopy[activeTab]}
              </p>
            </div>

            <div className="flex flex-row items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
              <select
                value={selectedCollege}
                onChange={(e) => setSelectedCollege(e.target.value)}
                className="w-full sm:w-48 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-colors"
              >
                <option value="All">All Colleges</option>
                {collegesList.map((college) => (
                  <option key={college} value={college}>
                    {college}
                  </option>
                ))}
              </select>
              <span className="text-xs font-bold text-slate-400 bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/50 px-3 py-1.5 rounded-full whitespace-nowrap">
                {filteredDevelopers.length} devs
              </span>
            </div>
          </div>

          {filteredDevelopers.length > 0 ? (
            <div
              className={
                activeTab === "leaderboard"
                  ? "space-y-3"
                  : "grid grid-cols-1 lg:grid-cols-2 gap-4"
              }
            >
              {filteredDevelopers.map((developer, index) => (
                <div
                  key={developer.id}
                  className={
                    activeTab === "leaderboard"
                      ? "flex items-stretch gap-3"
                      : ""
                  }
                >
                  {activeTab === "leaderboard" && (
                    <div
                      className={`flex-shrink-0 w-10 flex flex-col items-center justify-center rounded-xl font-black text-sm ${
                        index === 0
                          ? "bg-gradient-to-b from-yellow-400 to-amber-500 text-white shadow-[0_4px_15px_rgba(245,158,11,0.3)]"
                          : index === 1
                            ? "bg-gradient-to-b from-slate-300 to-slate-400 text-white"
                            : index === 2
                              ? "bg-gradient-to-b from-amber-600 to-amber-700 text-white"
                              : "bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/50 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      #{index + 1}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <DeveloperCard
                      developer={developer}
                      isFollowing={followingIds.includes(developer.id)}
                      onToggleFollow={handleToggleFollow}
                      showPoints={activeTab === "leaderboard"}
                      compact={activeTab === "leaderboard"}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
<Card className="p-8 text-center">
              <UsersRound className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="font-black text-slate-900 dark:text-white my-0">
                No developers here yet
              </h3>
              <h3 className="font-black text-slate-900 dark:text-white my-0">No friends yet!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {activeTab === "leaderboard"
                  ? "Follow other developers to populate your Friends Leaderboard."
                  : activeTab === "followers"
                  ? "You don't have any followers yet. Share your profile to get noticed!"
                  : "You're not following anyone yet. Discover developers to follow!"}
              </p>
              <button
                onClick={() => window.location.href = '/leaderboard'}
                className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-lg transition-colors"
              >
                Discover Developers
              </button>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 dark:text-white my-0 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-violet-500" />
              Suggested Developers
            </h2>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              For you
            </span>
          </div>

          <div className="space-y-4">
            {connections.suggested.slice(0, 4).map((developer) => (
              <DeveloperCard
                key={developer.id}
                developer={developer}
                isFollowing={followingIds.includes(developer.id)}
                onToggleFollow={handleToggleFollow}
                compact
              />
            ))}
          </div>

          <Card className="p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/70 dark:bg-slate-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white my-0">
                  Database Connected
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                  Follow state is now persisting via real-time Firestore
                  listeners. Refresh to see your friends!
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Friends;
