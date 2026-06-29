import React from "react";
import { motion } from "framer-motion";
import { LogOut, AlertTriangle } from "lucide-react";
import GradientButton from "./GradientButton";

export const LogoutConfirmModal = ({ onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 dark:bg-slate-950/60 backdrop-blur-md"
      />

      {/* Modal Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-900 dark:text-slate-100 flex flex-col items-center text-center gap-6"
      >
        {/* Warning Icon Banner */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
          <AlertTriangle className="w-8 h-8" />
        </div>

        {/* Header */}
        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-900 dark:text-white my-0">
            Confirm Logout
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
            Are you sure you want to log out of RankerHub? You will need to sign
            in again to access your developer overview stats.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 w-full">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>
          <GradientButton
            onClick={onConfirm}
            className="flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </GradientButton>
        </div>
      </motion.div>
    </div>
  );
};

export default LogoutConfirmModal;
//
