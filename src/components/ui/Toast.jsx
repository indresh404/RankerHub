import React, { useEffect } from "react";
import { motion } from "framer-motion";

export const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: 20, x: "-50%" }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={`fixed bottom-6 left-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold backdrop-blur-sm border transition-colors duration-300
        ${
          type === "success"
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
        }`}
      role="status"
      aria-live="polite"
    >
      <span>{type === "success" ? "✅" : "❌"}</span>
      {message}
    </motion.div>
  );
};

export default Toast;
