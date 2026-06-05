import React, { useState, forwardRef } from "react";
import { motion } from "framer-motion";
import { hoverScale } from "../../utils/motion";

function CardComponent(props, ref) {
  const {
    children,
    className = "",
    glow = true,
    onClick,
    ...rest
  } = props;

  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMouseCoords({ x, y });
  };

  return (
    <motion.div
      variants={hoverScale}
      whileHover={onClick ? "hover" : ""}
      whileTap={onClick ? "tap" : ""}
      onClick={onClick}
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ["--mouse-x"]: `${mouseCoords.x}px`,
        ["--mouse-y"]: `${mouseCoords.y}px`
      }}
      className={`
        relative backdrop-blur-xl bg-white/70 dark:bg-slate-900/70
        border border-slate-200/50 dark:border-slate-800/50
        rounded-2xl p-6 shadow-md transition-colors duration-300
        ${glow && onClick ? "hover:shadow-[0_0_25px_rgba(124,58,237,0.15)] dark:hover:shadow-[0_0_25px_rgba(124,58,237,0.1)]" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      {...rest}
    >
      {/* Dynamic light refraction glow that follows mouse */}
      {glow && (
        <div
          className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-300 rounded-2xl"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(350px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(124, 58, 237, 0.08), transparent 80%)`
          }}
        />
      )}
      <div className="relative z-10 w-full h-full">{children}</div>
    </motion.div>
  );
}

const Card = forwardRef(CardComponent);
export default Card;
export { Card };
