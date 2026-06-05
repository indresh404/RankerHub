import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import ContributorCard from "./ContributorCard";

export const ContributorsGrid = ({ fadeInUp, staggerContainer }) => {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContributors = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          "https://api.github.com/repos/indresh404/RankerHub/contributors",
        );
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }
        const data = await res.json();

        const sorted = data.sort((a, b) => b.contributions - a.contributions);

        setContributors(sorted);
        setError(null);
      } catch (err) {
        console.error("Error fetching contributors:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContributors();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white/20 dark:bg-slate-950/20 animate-pulse flex flex-col items-center space-y-3"
          >
            <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl border border-rose-500/20 bg-rose-500/5 text-center text-xs text-slate-650 dark:text-slate-400 flex flex-col items-center justify-center gap-2">
        <AlertCircle className="w-5 h-5 text-rose-500" />
        <div>
          <p className="font-bold text-rose-500 mb-1">
            Could not fetch contributors dynamically
          </p>
          <p>
            GitHub API rate limit exceeded or network offline. You can view all
            activity directly on GitHub.
          </p>
        </div>
        <a
          href="https://github.com/indresh404/RankerHub/graphs/contributors"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-850 hover:bg-slate-150 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition duration-200 font-bold"
        >
          View Contributors on GitHub
        </a>
      </div>
    );
  }

  if (contributors.length === 0) {
    return (
      <div className="p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-950/20 text-center text-xs text-slate-500 dark:text-slate-400">
        <p className="font-bold">No external contributors found yet.</p>
        <p className="mt-1">
          Be the first to submit a pull request and join the community!
        </p>
      </div>
    );
  }

  const topThree = contributors.slice(0, 3);
  const restContributors = contributors.slice(3);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="flex flex-col items-center w-full"
    >
      {/* Top 3 Boxed Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full mb-10">
        {topThree.map((contrib, idx) => (
          <ContributorCard
            key={contrib.id}
            login={contrib.login}
            avatarUrl={contrib.avatar_url}
            contributions={contrib.contributions}
            htmlUrl={contrib.html_url}
            variants={fadeInUp}
            rank={idx + 1}
          />
        ))}
      </div>

      {/* Rest of the Contributors - Borderless Circular Profiles */}
      {restContributors.length > 0 && (
        <div className="pt-8 border-t border-slate-200/40 dark:border-slate-800/40 w-full">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-4 gap-y-6 justify-center">
            {restContributors.map((contrib, idx) => {
              const rank = idx + 4;
              return (
                <motion.a
                  variants={fadeInUp}
                  key={contrib.id}
                  href={contrib.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center text-center group relative space-y-2 cursor-pointer"
                >
                  {/* Circle Profile Container */}
                  <div className="relative w-16 h-16 sm:w-18 sm:h-18 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
                    {/* Circle Avatar Frame */}
                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-slate-250 dark:border-slate-800 group-hover:border-violet-500/80 transition-colors duration-300 shadow-sm relative">
                      <img
                        src={contrib.avatar_url}
                        alt={contrib.login}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    {/* Rank Tag overlaid on bottom-right of the circle */}
                    <span className="absolute bottom-0 right-0 min-w-5 h-5 px-1.5 rounded-full bg-slate-900/90 dark:bg-slate-100/95 text-slate-100 dark:text-slate-900 border border-slate-200/50 dark:border-slate-800/50 text-[9px] font-black flex items-center justify-center shadow-md">
                      #{rank}
                    </span>
                  </div>

                  {/* Text Details */}
                  <div className="w-full overflow-hidden space-y-0.5">
                    <span className="block text-xs font-bold text-slate-700 dark:text-slate-350 truncate group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors duration-300">
                      {contrib.login}
                    </span>
                    <span className="block text-[9px] font-extrabold text-slate-400 dark:text-slate-550">
                      {contrib.contributions}{" "}
                      {contrib.contributions === 1 ? "commit" : "commits"}
                    </span>
                  </div>
                </motion.a>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ContributorsGrid;
