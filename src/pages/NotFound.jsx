import React from "react";
import { Link } from "react-router-dom";
import LottiePlayer from "../components/ui/LottiePlayer";
import { Home, ArrowLeft } from "lucide-react";
import errorAnimation from "../assets/animations/404_error.json";
import Card from "../components/ui/Card";
import GradientButton from "../components/ui/GradientButton";

export const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      {/* Floating background gradient glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-[35vw] h-[35vw] bg-violet-500/10 dark:bg-violet-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[35vw] h-[35vw] bg-blue-500/10 dark:bg-blue-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <Card className="max-w-md w-full p-8 text-center flex flex-col items-center border-slate-200/50 dark:border-slate-800/50">
        {/* Lottie 404 Error Animation */}
        <div className="w-64 h-64 mb-4">
          <LottiePlayer animationData={errorAnimation} loop={true} />
        </div>

        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-500 my-0 tracking-tight">
          Page Not Found
        </h1>

        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-8 leading-relaxed font-medium">
          The dashboard link you are trying to visit doesn't exist or is
          currently restricted under staging. Let's get you back.
        </p>

        <div className="flex gap-4 w-full justify-center">
          <Link to="/">
            <GradientButton className="text-xs py-2 px-5 flex items-center gap-1.5 font-bold">
              <Home className="w-4 h-4" /> Go Home
            </GradientButton>
          </Link>

          <Link to="/dashboard">
            <GradientButton
              variant="secondary"
              className="text-xs py-2 px-5 flex items-center gap-1.5 font-bold"
            >
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </GradientButton>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default NotFound;
