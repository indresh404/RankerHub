import React from "react";

export const SectionHeader = ({
  title,
  subtitle,
  badge,
  badgeColor = "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20",
  children,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl my-0 break-words">
            {title}
          </h1>
          {badge && (
            <span
              className={`px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full shrink-0 ${badgeColor}`}
            >
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium">
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3 self-start md:self-auto">
          {children}
        </div>
      )}
    </div>
  );
};

export default SectionHeader;
