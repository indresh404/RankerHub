import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import { Github } from "../components/ui/Icons";
import Card from "../components/ui/Card";
import GradientButton from "../components/ui/GradientButton";
import { useAuth } from "../context/AuthContext";

export const Login = () => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Extract referral parameters from URL (e.g. ?ref=NEWCODE or #/login?ref=NEWCODE)
  useEffect(() => {
    const getQueryParam = (name) => {
      // 1. Check window.location.search
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has(name)) return searchParams.get(name);

      // 2. Check hash route queries (e.g. hash router /#/login?ref=NEWCODE)
      const hash = window.location.hash;
      const qIndex = hash.indexOf("?");
      if (qIndex !== -1) {
        const hashParams = new URLSearchParams(hash.substring(qIndex));
        if (hashParams.has(name)) return hashParams.get(name);
      }
      return null;
    };

    const refCode = getQueryParam("ref");
    if (refCode) {
      sessionStorage.setItem("referred_by_code", refCode.toUpperCase().trim());
    }
  }, []);

  const handleGithubSignIn = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login();
      setIsLoading(true);
      // Don't navigate here — let the auth state change + route guards handle
      // the redirect. The GuestRoute on /login will auto-redirect to /onboarding
      // or /dashboard once AuthContext resolves the user's onboarding status.
    } catch (error) {
      console.error("GitHub sign-in error:", error);
      setError(
        error.message || "Failed to sign in with GitHub. Please try again.",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-[#090D1A] dark:via-[#0A0F1F] dark:to-[#0B1022] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      {/* Light Mode Enhanced Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-gradient-to-br from-violet-200/40 via-purple-200/30 to-indigo-200/40 dark:from-[#2D1B4E] dark:to-[#1A1A3E] pointer-events-none animate-blob transform-gpu rounded-full blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-gradient-to-tl from-blue-200/40 via-cyan-200/30 to-teal-200/40 dark:from-[#1A2A4E] dark:to-[#0F1A2E] pointer-events-none animate-blob [animation-delay:3s] transform-gpu rounded-full blur-3xl" />
      <div className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] bg-gradient-to-r from-pink-200/30 to-rose-200/30 dark:from-[#3D1B4E] dark:to-[#2E1A3E] pointer-events-none animate-pulse-slow transform-gpu rounded-full blur-3xl" />

      {/* Floating particles for light mode */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-violet-400/30 rounded-full animate-float" />
        <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-blue-400/30 rounded-full animate-float-delayed" />
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-indigo-400/30 rounded-full animate-float-slow" />
        <div className="absolute top-2/3 right-1/3 w-4 h-4 bg-purple-400/20 rounded-full animate-pulse" />
      </div>

      {/* Grid Pattern overlays - enhanced for light mode */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000006_1px,transparent_1px),linear-gradient(to_bottom,#00000006_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Glassmorphic Portal Box - Enhanced Light Mode */}
      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="backdrop-blur-xl bg-white/90 dark:bg-slate-950/40 border border-white/50 dark:border-slate-800/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-2xl p-8 space-y-6 transition-all duration-300 hover:shadow-[0_12px_48px_rgba(139,92,246,0.15)] dark:hover:shadow-2xl">
          {/* Back to Home */}
          <div className="flex justify-start -mb-2">
            <Link
              to="/"
              className="group flex items-center gap-1 text-xs text-slate-400 hover:text-violet-400 transition-colors duration-200 font-semibold"
            >
              <span className="inline-block transition-transform duration-200 group-hover:-translate-x-1">
                ←
              </span>
              Back to Home
            </Link>
          </div>

          {/* GitHub Logo with glow effect */}
          <div className="text-center relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-gradient-to-tr from-violet-600/20 to-indigo-600/20 rounded-full blur-2xl animate-pulse" />
            </div>
            <div className="relative inline-flex w-20 h-20 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 dark:from-gray-700 dark:to-gray-900 items-center justify-center shadow-xl shadow-gray-500/30 dark:shadow-indigo-500/20 mx-auto ring-4 ring-white/50 dark:ring-white/10">
              <Github className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Heading with gradient text */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent my-0 leading-tight">
              Welcome Back
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              Sign in to continue your coding journey
            </p>
          </div>

          {/* Feature badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-500/10 dark:to-indigo-500/10 border border-violet-200 dark:border-violet-500/20">
              <Sparkles className="w-3 h-3 text-violet-600 dark:text-violet-400" />
              <span className="text-[10px] font-bold text-violet-700 dark:text-violet-400">
                GitRank
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-500/10 dark:to-cyan-500/10 border border-blue-200 dark:border-blue-500/20">
              <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400">
                CodingVerse
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10 border border-orange-200 dark:border-orange-500/20">
              <Sparkles className="w-3 h-3 text-orange-600 dark:text-orange-400" />
              <span className="text-[10px] font-bold text-orange-700 dark:text-orange-400">
                CodingOwl
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleGithubSignIn} className="space-y-5 pt-2">
            {/* Error Message - Enhanced */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20"
              >
                <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-400 font-medium flex-1">
                  {error}
                </p>
                <button
                  onClick={() => setError("")}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 text-xs font-bold"
                >
                  Dismiss
                </button>
              </motion.div>
            )}

            {/* GitHub Sign-In Button - Enhanced */}
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
                <GradientButton
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-300"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Connecting to GitHub...</span>
                    </>
                  ) : (
                    <>
                      <Github className="w-4 h-4" />
                      <span>Continue with GitHub</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </GradientButton>
              </div>

              {/* Divider with text */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white/80 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 font-semibold">
                    Secure Authentication
                  </span>
                </div>
              </div>
            </div>

            {/* Security Indicator - Enhanced */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold pt-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                <span>OAuth 2.0 Secured</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span>Encrypted Connection</span>
              </div>
            </div>
          </form>

          {/* Prompt footer - Enhanced */}
          <div className="text-center pt-4 space-y-2 border-t border-slate-200/50 dark:border-slate-800/50">
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              By continuing, you agree to RankerHub's
              <Link
                to="/terms"
                className="text-violet-600 dark:text-violet-400 font-bold hover:underline mx-1"
              >
                Terms
              </Link>
              <Link
                to="/privacy"
                className="text-violet-600 dark:text-violet-400 font-bold hover:underline ml-1"
              >
                Privacy Policy
              </Link>
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-500">
              🔒 Your GitHub data is never stored. Only your public profile is
              used.
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
