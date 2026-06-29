import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { useRateLimit } from "../../context/rateLimitContextValue";

const RateLimitBanner = () => {
  const { isRateLimited, resetRateLimit } = useRateLimit();

  if (!isRateLimited) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-rose-500 text-white p-3 shadow-lg flex items-center justify-between transition-all duration-300">
      <div className="flex items-center gap-3 max-w-7xl mx-auto w-full px-4">
        <AlertTriangle size={20} className="shrink-0" />
        <p className="text-sm md:text-base font-medium">
          GitHub API rate limit exceeded! Please wait a while or authenticate to
          continue tracking stats.
        </p>
      </div>
      <button
        onClick={resetRateLimit}
        className="shrink-0 p-1.5 hover:bg-rose-600 rounded-md transition-colors mr-2 sm:mr-6"
        aria-label="Close warning"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default RateLimitBanner;
