import React from "react";
import {} from "framer-motion";
import LottiePlayer from "./LottiePlayer";
import hourglassAnimation from "../../assets/animations/hourglass_loading.json";
import Card from "./Card";

export const ComingSoonCard = ({
  title = "Feature Launching Soon",
  description = "Our engineering team is actively building this module. Stay tuned for updates!",
  icon: Icon,
  features = [],
  estimatedArrival = "Q3 2026",
  showHourglass = true,
}) => {
  return (
    <Card className="relative overflow-hidden p-8 flex flex-col md:flex-row items-center justify-between gap-8 border-violet-500/20 dark:border-violet-500/10">
      {/* Background Gradient Orbs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10" />

      <div className="flex-1 space-y-4">
        {Icon && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
            <Icon className="w-3.5 h-3.5 animate-pulse" />
            <span>Module Integration</span>
          </div>
        )}

        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white my-0">
          {title}
        </h2>

        <p className="text-slate-500 dark:text-slate-400 max-w-lg text-sm md:text-base">
          {description}
        </p>

        {features.length > 0 && (
          <div className="pt-2 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Key Capabilities:
            </span>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300">
              {features.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-4 flex items-center gap-4">
          <div className="text-xs text-slate-400 dark:text-slate-500">
            Estimated Release:{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {estimatedArrival}
            </span>
          </div>
        </div>
      </div>

      {showHourglass && (
        <div className="w-48 h-48 md:w-56 md:h-56 flex-shrink-0 flex items-center justify-center bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-4 border border-slate-200/40 dark:border-slate-800/40">
          <LottiePlayer
            animationData={hourglassAnimation}
            loop={true}
            className="w-full h-full"
          />
        </div>
      )}
    </Card>
  );
};

export default ComingSoonCard;
