import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Lock } from "lucide-react";

export const Privacy = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline mb-8"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Home
        </Link>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white m-0">
              Privacy Policy
            </h1>
          </div>
          <div className="space-y-6 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            <p>
              <strong>Last Updated:</strong> May 31, 2026
            </p>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">
              1. Data Collection
            </h2>
            <p>
              We collect information you provide directly to us, such as when
              you create an account, update your profile, or communicate with
              us. We also collect public developer metrics from connected
              platforms like GitHub.
            </p>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">
              2. How We Use Your Data
            </h2>
            <p>
              We use the information we collect to calculate global and
              language-specific rankings, provide personalized coding challenges
              (CodingVerse), and maintain your developer streaks (CodingOwl).
            </p>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">
              3. Data Security
            </h2>
            <p>
              We take reasonable measures to help protect information about you
              from loss, theft, misuse, and unauthorized access. We do not store
              sensitive source code or private repository data.
            </p>
            <p className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 text-xs text-center">
              This is a placeholder document for the RankerHub project.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
