import React from "react";
import LottiePlayer from "./LottiePlayer";
import skeletonAnim from "../../assets/animations/skeleton_loading.json";
import hourglassAnim from "../../assets/animations/hourglass_loading.json";

export const Loader = ({
  type = "hourglass", // hourglass or skeleton
  size = "md", // sm, md, lg
  text = "Loading...",
}) => {
  const animations = {
    skeleton: skeletonAnim,
    hourglass: hourglassAnim,
  };

  const sizes = {
    sm: "w-16 h-16",
    md: "w-32 h-32",
    lg: "w-48 h-48",
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className={`${sizes[size]} flex items-center justify-center`}>
        <LottiePlayer
          animationData={animations[type] || hourglassAnim}
          loop={true}
          className="w-full h-full"
        />
      </div>
      {text && (
        <p className="text-sm font-semibold tracking-wide text-slate-400 dark:text-slate-500 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default Loader;
