import React, { useEffect } from "react";
import { motion } from "framer-motion";

export const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold backdrop-blur-sm border w-full
        ${type === "success"
          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
          : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
        }`}
      role="status"
      aria-live="polite"
    >
      <span>{type === "success" ? "✅" : "❌"}</span>
      <span className="flex-1">{message}</span>
    </motion.div>
  );
};

export default Toast;