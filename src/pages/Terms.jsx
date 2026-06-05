import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ShieldCheck } from "lucide-react";

export const Terms = () => {
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
            <div className="p-3 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white m-0">
              Terms of Service
            </h1>
          </div>
          <div className="space-y-6 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            <p>
              <strong>Last Updated:</strong> May 31, 2026
            </p>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using RankerHub, you agree to be bound by these
              Terms of Service. If you do not agree to these terms, please do
              not use our platform.
            </p>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">
              2. User Accounts and GitHub Integration
            </h2>
            <p>
              RankerHub uses public GitHub data to calculate developer rankings.
              By connecting your account, you authorize us to read your public
              repositories, commit history, and pull requests. We will never ask
              for write access to your code.
            </p>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">
              3. Platform Rules
            </h2>
            <p>
              Users must not manipulate the ranking system, create fake accounts
              to boost metrics, or use the platform for malicious purposes.
              Violation of these rules may result in permanent account
              suspension.
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

export default Terms;
