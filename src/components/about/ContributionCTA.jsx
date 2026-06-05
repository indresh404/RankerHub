import React from "react";
import { Github } from "../ui/Icons";

export const ContributionCTA = () => {
  return (
    <div className="relative overflow-hidden p-8 rounded-2xl border border-violet-500/20 dark:border-violet-500/10 bg-gradient-to-r from-violet-500/5 to-indigo-500/5 dark:from-violet-500/5 dark:to-indigo-500/5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg group">
      {/* Floating glow inside card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-24 bg-violet-500/10 rounded-full blur-3xl -z-10 pointer-events-none transition-all duration-300 group-hover:scale-125" />

      {/* Background Dots */}
      <div className="absolute inset-0 bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.03] dark:opacity-[0.05] pointer-events-none" />

      <div className="space-y-2 text-center md:text-left relative z-10">
        <h3 className="text-lg font-black text-slate-900 dark:text-white my-0">
          Want to contribute to RankerHub?
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold max-w-xl my-0">
          Join our open-source community, help squash bugs, optimize layouts, or
          add new challenges and help build the future of developer rankings.
        </p>
      </div>

      <a
        href="https://github.com/indresh404/RankerHub"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-750 hover:to-indigo-750 text-white font-bold text-xs shadow-lg hover:shadow-indigo-500/25 active:scale-98 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer whitespace-nowrap relative z-10"
      >
        <Github className="w-4 h-4 fill-white animate-pulse" /> Contribute Now
      </a>
    </div>
  );
};

export default ContributionCTA;
