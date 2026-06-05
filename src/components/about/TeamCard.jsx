import React from "react";
import { Heart, Mail } from "lucide-react";
import { Github, Linkedin, Instagram } from "../ui/Icons";

export const TeamCard = ({
  username,
  avatar,
  role,
  description,
  isOwner,
  links,
  className = "",
}) => {
  return (
    <div className={`team-card-3d-wrap ${className}`}>
      <div
        className={`
          team-card-3d relative p-6 rounded-2xl border backdrop-blur-xl
          flex flex-col sm:flex-row items-center gap-6 transition-all duration-300
          ${
            isOwner
              ? "border-violet-500/30 dark:border-violet-500/20"
              : "border-slate-200/50 dark:border-slate-800/50"
          }
        `}
      >
        {/* Glow blob */}
        <div
          className={`absolute -top-12 -left-12 w-44 h-44 rounded-full blur-3xl pointer-events-none
          ${isOwner ? "bg-violet-500/10 dark:bg-violet-500/15" : "bg-indigo-500/5 dark:bg-indigo-500/10"}
        `}
        />

        {/* Dot pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.02] pointer-events-none rounded-2xl" />

        {/* Glass layer – lifted forward off the card */}
        <div className="team-card-glass" />

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className={`
            team-card-3d-avatar relative w-20 h-20 rounded-2xl overflow-hidden border-2
            ${isOwner ? "border-violet-500/40" : "border-indigo-500/20"}
          `}
          >
            <img
              src={avatar}
              alt={`${username} avatar`}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute bottom-0 right-0 bg-rose-600 text-white p-1 rounded-tl-lg shadow-sm z-10"
              aria-hidden="true"
            >
              <Heart className="w-3 h-3 fill-white stroke-white" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="team-card-3d-content space-y-2 text-center sm:text-left flex-1 relative">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <h3 className="text-lg font-black text-slate-900 dark:text-white my-0 tracking-tight">
              {username}
            </h3>
            <span
              className={`
              px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border
              ${
                isOwner
                  ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20"
                  : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
              }
            `}
            >
              {role}
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold my-0 leading-relaxed max-w-md">
            {description}
          </p>

          {/* Social links */}
          {links && (
            <div className="mt-4 pt-3 border-t border-slate-200/40 dark:border-slate-800/40">
              <div className="team-card-social-row">
                {links.github && (
                  <a
                    href={links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="GitHub"
                    className={`team-card-social-btn${isOwner ? " team-card-social-btn--owner" : ""}`}
                  >
                    <Github className="w-4 h-4" />
                  </a>
                )}
                {links.linkedin && (
                  <a
                    href={links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="LinkedIn"
                    className={`team-card-social-btn${isOwner ? " team-card-social-btn--owner" : ""}`}
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {links.instagram && (
                  <a
                    href={links.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Instagram"
                    className={`team-card-social-btn${isOwner ? " team-card-social-btn--owner" : ""}`}
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {links.email && (
                  <a
                    href={links.email}
                    title="Email"
                    className={`team-card-social-btn${isOwner ? " team-card-social-btn--owner" : ""}`}
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamCard;
