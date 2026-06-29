import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PublicLayout from "../layouts/PublicLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import ComingSoonCard from "../components/ui/ComingSoonCard";
import GlobalModals from "../components/ui/GlobalModals";
import {
  Settings as SettingsIcon,
  Code,
  Award,
  Users,
  Target,
  BookOpen,
  Shield,
  Sparkles,
  Activity,
} from "lucide-react";

// Lazy Loaded Pages to reduce initial JS bundle
const Home = React.lazy(() => import("../pages/Home"));
const Dashboard = React.lazy(() => import("../pages/Dashboard"));
const GitRank = React.lazy(() => import("../pages/GitRank"));
const RankHer = React.lazy(() => import("../pages/RankHer"));
const CodingVerse = React.lazy(() => import("../pages/CodingVerse"));
const CodingOwl = React.lazy(() => import("../pages/CodingOwl"));
const Matchmaker = React.lazy(() => import("../pages/Matchmaker"));
const Profile = React.lazy(() => import("../pages/Profile"));
const Friends = React.lazy(() => import("../pages/Friends"));
const Login = React.lazy(() => import("../pages/Login"));
const Onboarding = React.lazy(() => import("../pages/Onboarding"));
const NotFound = React.lazy(() => import("../pages/NotFound"));
const Achievements = React.lazy(() => import("../pages/Achievements"));
const About = React.lazy(() => import("../pages/About"));
const Terms = React.lazy(() => import("../pages/Terms"));
const Privacy = React.lazy(() => import("../pages/Privacy"));
const Auditor = React.lazy(() => import("../pages/Auditor"));
const CardBuilder = React.lazy(() => import("../pages/CardBuilder"));
const RepoHealth = React.lazy(() => import("../pages/RepoHealth"));

// Enhanced Loading Screen with better animations
const LoadingScreen = ({ message }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#090D1A] dark:via-[#0F1423] dark:to-[#090D1A]">
    <div className="flex flex-col items-center space-y-6">
      {/* Animated gradient ring */}
      <div className="relative">
        <div className="w-16 h-16 border-4 border-violet-200 dark:border-violet-900 rounded-full" />
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-6 h-6 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Animated text */}
      <div className="space-y-2 text-center">
        <span className="text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent tracking-widest uppercase animate-pulse">
          {message || "Loading..."}
        </span>
        <div className="flex gap-1 justify-center">
          <div
            className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce"
            style={{ animationDelay: "0s" }}
          />
          <div
            className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          />
          <div
            className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.4s" }}
          />
        </div>
      </div>
    </div>
  </div>
);

// Enhanced Protected Route with better UI feedback
const ProtectedRoute = ({ children }) => {
  const { user, loading, isOnboarding } = useAuth();

  if (loading) {
    return <LoadingScreen message="Verifying authentication..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

// Enhanced Onboarding Route
const OnboardingRoute = ({ children }) => {
  const { user, loading, userData, isOnboarding } = useAuth();

  if (loading) {
    return <LoadingScreen message="Loading Onboarding portal..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (
    userData?.onboardingStatus === "complete" ||
    !isOnboarding ||
    (userData && userData.onboardingStatus !== "incomplete")
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Enhanced Guest Route
const GuestRoute = ({ children }) => {
  const { user, loading, isOnboarding } = useAuth();

  if (loading) {
    return <LoadingScreen message="Redirecting..." />;
  }

  if (user) {
    if (isOnboarding) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Enhanced Settings Page with better design
const SettingsPage = () => (
  <div className="space-y-8">
    {/* Page Header */}
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-xl">
          <SettingsIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Customize your experience and manage account preferences
          </p>
        </div>
      </div>
    </div>

    <ComingSoonCard
      title="Advanced Settings Dashboard"
      description="We're crafting powerful customization tools to help you tailor every aspect of your coding journey. Stay tuned for exciting features coming soon!"
      icon={SettingsIcon}
      features={[
        "🔐 Enhanced Security & Privacy Controls",
        "📧 Smart Notification Preferences",
        "🎨 Theme & Visual Customization",
        "🤖 Oliver the Owl Personalization",
        "📊 Advanced Analytics Dashboard",
        "🔌 Third-party App Integrations",
      ]}
      estimatedArrival="Q3 2026"
      showHourglass={true}
      badge="Premium Features"
      badgeColor="bg-gradient-to-r from-violet-500 to-indigo-500"
    />

    {/* Quick Stats Preview */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[
        {
          icon: Code,
          label: "Active Sessions",
          value: "24",
          color: "from-blue-500 to-cyan-500",
        },
        {
          icon: Award,
          label: "Achievements",
          value: "12",
          color: "from-amber-500 to-orange-500",
        },
        {
          icon: Users,
          label: "Connections",
          value: "8",
          color: "from-emerald-500 to-teal-500",
        },
        {
          icon: Target,
          label: "Goals Met",
          value: "89%",
          color: "from-violet-500 to-purple-500",
        },
      ].map((stat, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800 hover:border-violet-500/50 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg bg-gradient-to-r ${stat.color} bg-opacity-10 group-hover:scale-110 transition-transform`}
            >
              <stat.icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {stat.value}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {stat.label}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Route configuration metadata (for documentation)
const routeMetadata = {
  public: [
    { path: "/", name: "Home", icon: "🏠" },
    { path: "/gitrank", name: "GitRank", icon: "📊" },
    { path: "/rankher", name: "RankHer", icon: "👩‍💻" },
    { path: "/codingverse", name: "CodingVerse", icon: "🌌" },
    { path: "/codingowl", name: "CodingOwl", icon: "🦉" },
    { path: "/repo-health", name: "Repo Health", icon: "💚" },
  ],
  legal: [
    { path: "/about", name: "About", icon: "ℹ️" },
    { path: "/terms", name: "Terms", icon: "📜" },
    { path: "/privacy", name: "Privacy", icon: "🔒" },
  ],
  dashboard: [
    { path: "/dashboard", name: "Dashboard", icon: "📊" },
    { path: "/dashboard/gitrank", name: "GitRank", icon: "🏆" },
    { path: "/dashboard/achievements", name: "Achievements", icon: "🎖️" },
    { path: "/dashboard/codingowl", name: "CodingOwl", icon: "🦉" },
    { path: "/dashboard/friends", name: "Friends", icon: "👥" },
    { path: "/dashboard/profile", name: "Profile", icon: "👤" },
    { path: "/dashboard/settings", name: "Settings", icon: "⚙️" },
  ],
};

export const AppRoutes = () => {
  return (
    <>
      <Suspense
        fallback={<LoadingScreen message="Preparing your workspace..." />}
      >
        <Routes>
          {/* Public Site Layout & Pages */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/gitrank" element={<GitRank />} />
            <Route path="/rankher" element={<RankHer />} />
            <Route path="/codingverse" element={<CodingVerse />} />
            <Route path="/codingowl" element={<CodingOwl />} />
            <Route path="/repo-health" element={<RepoHealth />} />
          </Route>

          {/* Standalone About Us page */}
          <Route path="/about" element={<About />} />

          {/* Standalone Legal pages */}
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          {/* Public Login page (standalone) - guarded from logged in users */}
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />

          {/* Onboarding page (standalone) - guarded so only incomplete profiles see it */}
          <Route
            path="/onboarding"
            element={
              <OnboardingRoute>
                <Onboarding />
              </OnboardingRoute>
            }
          />

          {/* Layout dashboard sub-pages - locked to authenticated & fully onboarded users */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/gitrank" element={<GitRank />} />
            <Route path="/dashboard/rankher" element={<RankHer />} />
            <Route path="/dashboard/achievements" element={<Achievements />} />
            <Route path="/dashboard/codingverse" element={<CodingVerse />} />
            <Route path="/dashboard/codingowl" element={<CodingOwl />} />
            <Route path="/dashboard/matchmaker" element={<Matchmaker />} />
            <Route path="/dashboard/friends" element={<Friends />} />
            <Route
              path="/dashboard/friends/leaderboard"
              element={<Friends />}
            />
            <Route path="/dashboard/friends/followers" element={<Friends />} />
            <Route path="/dashboard/friends/following" element={<Friends />} />
            <Route path="/dashboard/profile" element={<Profile />} />
            <Route
              path="/dashboard/profile/card-builder"
              element={<CardBuilder />}
            />
            <Route path="/dashboard/profile/:username" element={<Profile />} />
            <Route path="/dashboard/profile/:username/*" element={<Profile />} />
            <Route path="/dashboard/settings" element={<SettingsPage />} />
            <Route path="/dashboard/auditor" element={<Auditor />} />
            <Route path="/dashboard/repo-health" element={<RepoHealth />} />
          </Route>

          {/* 404 Catch All - Enhanced with better UI */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <GlobalModals />
    </>
  );
};

export default AppRoutes;
