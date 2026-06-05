import React from "react";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../../hooks/useTheme";

export const ThemeToggle = ({ className = "" }) => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className={`
        relative p-2 rounded-xl border border-slate-200/50 dark:border-slate-800/50
        bg-white/80 dark:bg-slate-900/80 backdrop-blur-md
        text-slate-700 dark:text-slate-300
        hover:bg-slate-50 dark:hover:bg-slate-800
        shadow-sm hover:shadow-md transition-all duration-200
        cursor-pointer w-10 h-10 flex items-center justify-center overflow-hidden
        ${className}
      `}
      aria-label="Toggle dark mode"
    >
      <motion.div
        initial={false}
        animate={{
          y: isDark ? 40 : 0,
          opacity: isDark ? 0 : 1,
          rotate: isDark ? 90 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="absolute"
      >
        <Sun className="w-5 h-5 text-amber-500 fill-amber-500/20" />
      </motion.div>

      <motion.div
        initial={false}
        animate={{
          y: isDark ? 0 : -40,
          opacity: isDark ? 1 : 0,
          rotate: isDark ? 0 : -90,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="absolute"
      >
        <Moon className="w-5 h-5 text-indigo-400 fill-indigo-400/20" />
      </motion.div>
    </motion.button>
  );
};

export default ThemeToggle;
