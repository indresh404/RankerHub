import React from "react";
import { useLottie } from "lottie-react";

// Safe boundary wrapper to catch rendering/canvas _errors within the Lottie library
class SafeLottieBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("LottiePlayer caught a rendering crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 min-h-[50px]">
          <svg
            className="w-10 h-10 opacity-40 animate-pulse"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
      );
    }
    return this.props.children;
  }
}

// Inner component that safe-calls the useLottie hook
const LottieInner = ({ animationData, loop, autoplay }) => {
  const { View } = useLottie({ animationData, loop, autoplay });
  return (
    <div className="w-full h-full flex items-center justify-center">{View}</div>
  );
};

export const LottiePlayer = ({
  animationData,
  loop = true,
  autoplay = true,
  className = "",
}) => {
  if (!animationData) {
    return (
      <div
        className={`flex items-center justify-center text-slate-400 dark:text-slate-500 ${className} min-h-[50px]`}
      >
        <svg
          className="w-10 h-10 opacity-40 animate-pulse"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={className}>
      <SafeLottieBoundary>
        <LottieInner
          animationData={animationData}
          loop={loop}
          autoplay={autoplay}
        />
      </SafeLottieBoundary>
    </div>
  );
};

export default LottiePlayer;
