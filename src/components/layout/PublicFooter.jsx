import React from "react";
import { Link } from "react-router-dom";

export const PublicFooter = () => {
  return (
    <footer className="py-12 border-t border-slate-200/50 dark:border-slate-800/50 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="flex justify-center flex-wrap gap-6 mb-4 px-4">
        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-semibold"
        >
          Home
        </Link>
        <Link
          to="/#features"
          className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-semibold"
        >
          Features
        </Link>
        <Link
          to="?modal=how-it-works"
          className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-semibold"
        >
          How it Works
        </Link>
        <Link
          to="/about"
          className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-semibold"
        >
          About Us
        </Link>
        <a
          href="https://github.com/indresh404/RankerHub.git"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-semibold"
        >
          GitHub Repository
        </a>
        <Link
          to="/terms"
          className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-semibold"
        >
          Terms of Service
        </Link>
        <Link
          to="/privacy"
          className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-semibold"
        >
          Privacy Policy
        </Link>
      </div>
      <p className="font-semibold">
        © 2026 RankerHub. Built with React + Vite + TailwindCSS.
      </p>
      <p className="mt-2 px-4">
        Premium developer ranking dashboard. All features simulate active
        states.
      </p>
    </footer>
  );
};

export default PublicFooter;
