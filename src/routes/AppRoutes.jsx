import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PublicLayout from "../layouts/PublicLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import ComingSoonCard from "../components/ui/ComingSoonCard";
import GlobalModals from "../components/ui/GlobalModals";
import { Settings as SettingsIcon } from "lucide-react";

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

// Inline loading indicator
const LoadingScreen = ({ message }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090D1A]">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-slate-400 font-bold tracking-widest uppercase">{message || "Loading..."}</span>
    </div>
  </div>
);

// Route Guard: Access allowed ONLY if authenticated AND fully onboarded
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

// Route Guard: Access allowed ONLY if authenticated AND onboarding is incomplete
const OnboardingRoute = ({ children }) => {
  const { user, loading, userData, isOnboarding } = useAuth();

  if (loading) {
    return <LoadingScreen message="Loading Onboarding portal..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }


  // Guard: only redirect away from onboarding when the user's data explicitly
  // confirms onboarding is complete, or when isOnboarding has resolved to false
  // for a user with loaded data. We intentionally do NOT redirect when
  // onboardingStatus is undefined (e.g. the user document is still being
  // created), since that would incorrectly bounce new users away from
  // /onboarding before they can complete it.
  if (userData?.onboardingStatus === "complete" || (userData && !isOnboarding)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Route Guard: Access allowed ONLY if NOT authenticated
const GuestRoute = ({ children }) => {
  const { user, loading, isOnboarding } = useAuth();

  if (loading) {
    return null; // Don't redirect prematurely while state is resolving
  }

  if (user) {
    if (isOnboarding) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// An inline settings page to keep route integrated
const SettingsPage = () => (
  <div className="space-y-6">
    <ComingSoonCard
      title="User & Engine Settings - Coming Soon"
      description="Configure email alerts, change username handles, edit privacy options, and manage GitHub OAuth connection permissions."
      icon={SettingsIcon}
      features={[
        "Account authentication key scopes",
        "Staging profile visibility toggles",
        "Leaderboard notification email alerts",
        "Mascot Oliver focus target customization"
      ]}
      estimatedArrival="Q3 2026"
      showHourglass={true}
    />
  </div>
);

export const AppRoutes = () => {
  return (
    <>
      <Suspense fallback={<LoadingScreen message="Loading Page..." />}>
        <Routes>
          {/* Public Site Layout & Pages */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/gitrank" element={<GitRank />} />
            <Route path="/rankher" element={<RankHer />} />
            <Route path="/codingverse" element={<CodingVerse />} />
            <Route path="/codingowl" element={<CodingOwl />} />
          </Route>

          {/* Standalone About Us page */}
          <Route path="/about" element={<About />} />

          {/* Standalone Legal pages */}
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          {/* Public Login page (standalone) - guarded from logged in users */}
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          
          {/* Onboarding page (standalone) - guarded so only incomplete profiles see it */}
          <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
          
          {/* Layout dashboard sub-pages - locked to authenticated & fully onboarded users */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/gitrank" element={<GitRank />} />
            <Route path="/dashboard/rankher" element={<RankHer />} />
            <Route path="/dashboard/achievements" element={<Achievements />} />
            <Route path="/dashboard/codingverse" element={<CodingVerse />} />
            <Route path="/dashboard/codingowl" element={<CodingOwl />} />
            <Route path="/dashboard/matchmaker" element={<Matchmaker />} />
            <Route path="/dashboard/friends" element={<Friends />} />
            <Route path="/dashboard/friends/leaderboard" element={<Friends />} />
            <Route path="/dashboard/friends/followers" element={<Friends />} />
            <Route path="/dashboard/friends/following" element={<Friends />} />
            <Route path="/dashboard/profile" element={<Profile />} />
            <Route path="/dashboard/profile/card-builder" element={<CardBuilder />} />
            <Route path="/dashboard/profile/:username" element={<Profile />} />
            <Route path="/dashboard/settings" element={<SettingsPage />} />
            <Route path="/dashboard/auditor" element={<Auditor />} />
          </Route>

          {/* 404 Catch All */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <GlobalModals />
    </>
  );
};

export default AppRoutes;