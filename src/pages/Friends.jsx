import React, { useMemo, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Activity,
  HeartHandshake,
  UserCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import SectionHeader from "../components/ui/SectionHeader";
import Card from "../components/ui/Card";
import DeveloperCard from "../components/friends/DeveloperCard";
import Loader from "../components/ui/Loader";
import { useAuth } from "../context/AuthContext";
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
  if (pathname.endsWith("/followers")) return "followers";
  if (pathname.endsWith("/following")) return "following";
  return "friends";
};

export const Friends = () => {
  const location = useLocation();
  const activeTab = getActiveTab(location.pathname);
  const { user: currentUser } = useAuth();

  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState([]);
  const [followerIds, setFollowerIds] = useState([]);

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

      // Setup Real-time Firebase Listeners
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

  const connections = useMemo(
    () => hydrateConnections(developers, followingIds, followerIds),
    [developers, followingIds, followerIds],
  );

  const activeDevelopers = connections[activeTab];
  const tabCopy = {
    friends:
      "Developers who follow you back and collaborate with you across RankerHub.",
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
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white my-0 capitalize">
                {activeTab}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium my-0">
                {tabCopy[activeTab]}
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/50 px-3 py-1.5 rounded-full self-start sm:self-auto">
              {activeDevelopers.length} developers
            </span>
          </div>

          {activeDevelopers.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {activeDevelopers.map((developer) => (
                <DeveloperCard
                  key={developer.id}
                  developer={developer}
                  isFollowing={followingIds.includes(developer.id)}
                  onToggleFollow={handleToggleFollow}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <UsersRound className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="font-black text-slate-900 dark:text-white my-0">
                No developers here yet
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Follow developers from suggestions to grow this section
                instantly.
              </p>
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
