import React from "react";
import { motion } from "framer-motion";
import { hoverButton } from "../../utils/motion";

export const GradientButton = ({
  children,
  className = "",
  onClick,
  type = "button",
  disabled = false,
  glow = true,
  variant = "primary", // primary, secondary, outline
  ...props
}) => {
  const baseStyles =
    "relative px-6 py-3 font-semibold rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden active:scale-95 group";

  const variants = {
    primary:
      "text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-700 hover:via-indigo-700 hover:to-blue-700",
    secondary:
      "text-slate-800 dark:text-white bg-slate-200/80 dark:bg-slate-800/80 hover:bg-slate-300/85 dark:hover:bg-slate-700/90 border border-slate-300/30 dark:border-slate-700/30",
    outline:
      "text-slate-700 dark:text-slate-200 bg-transparent hover:bg-slate-100/50 dark:hover:bg-slate-800/50 border border-slate-300 dark:border-slate-700",
  };

  const glowStyle =
    glow && variant === "primary" && !disabled
      ? "shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.55)]"
      : "";

  return (
    <motion.button
      variants={hoverButton}
      whileHover={disabled ? {} : "hover"}
      whileTap={disabled ? {} : "tap"}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${glowStyle}
        ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer"}
        ${className}
      `}
      {...props}
    >
      {/* Background overlay for glossy effect */}
      {!disabled && variant === "primary" && (
        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
      )}
      {children}
    </motion.button>
  );
};

export default GradientButton;
