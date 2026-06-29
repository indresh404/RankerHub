import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Check,
  UserPlus,
  UsersRound,
  Trophy,
} from "lucide-react";
import Card from "../ui/Card";
import GradientButton from "../ui/GradientButton";

export const DeveloperCard = ({
  developer,
  isFollowing,
  onToggleFollow,
  compact = false,
  showPoints = false,
}) => {
  return (
    <Card className={`${compact ? "p-4" : "p-5"} h-full flex flex-col gap-4`}>
      <div className="flex items-start gap-4">
        <Link
          to={`/dashboard/profile/${developer.username}`}
          className="relative flex-shrink-0"
          aria-label={`Open ${developer.name}'s profile`}
        >
          <img
            src={developer.avatar}
            alt={`${developer.name} avatar`}
            className={`${compact ? "w-12 h-12" : "w-14 h-14"} rounded-2xl object-cover ring-2 ring-violet-500/15`}
          />
          <span
            className={`absolute -right-1 -bottom-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
              developer.online ? "bg-emerald-500" : "bg-slate-400"
            }`}
            title={developer.online ? "Online" : "Offline"}
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                to={`/dashboard/profile/${encodeURIComponent(developer.username)}`}
                className="font-extrabold text-slate-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 transition-colors truncate block"
              >
                {developer.name}
              </Link>
              <span className="text-xs font-bold text-slate-400 truncate block">
                @{developer.username} · {developer.role}
              </span>
            </div>
            <Link
              to={`/dashboard/profile/${developer.username}`}
              className="p-2 rounded-xl text-slate-400 hover:text-violet-500 hover:bg-violet-500/10 transition-colors flex-shrink-0"
              aria-label={`Open ${developer.name}'s profile`}
            >
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium my-0">
        {developer.bio}
      </p>

      <div className="flex flex-wrap gap-2">
        {developer.tags.map((tag) => (
          <span
            key={tag}
            className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-slate-100/80 dark:bg-slate-800/70 text-slate-500 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/40"
          >
            {tag}
          </span>
        ))}
      </div>

      <div
        className={`mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 ${
          compact
            ? "flex-col sm:flex-row sm:items-center sm:justify-between"
            : "flex-col items-stretch"
        }`}
      >
        <div className="text-xs text-slate-400 dark:text-slate-500 font-semibold space-y-1">
          <span className="flex items-center gap-1.5">
            <UsersRound className="w-3.5 h-3.5 text-violet-500" />
            {developer.mutualFriends} mutual friends
          </span>
          {showPoints && (
            <span className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-yellow-500" />
              {developer.totalPoints?.toLocaleString() || 0} XP
            </span>
          )}
          {!compact && (
            <span className="block truncate max-w-[220px]">
              {developer.activity}
            </span>
          )}
        </div>

        <GradientButton
          onClick={() => onToggleFollow(developer.id)}
          variant={isFollowing ? "secondary" : "primary"}
          glow={!isFollowing}
          className={`${compact ? "sm:w-auto" : ""} px-4 py-2 text-xs min-h-10 w-full`}
        >
          {isFollowing ? (
            <>
              <Check className="w-4 h-4" />
              Following
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              Follow
            </>
          )}
        </GradientButton>
      </div>
    </Card>
  );
};

export default DeveloperCard;
