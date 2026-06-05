import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PublicLayout from "../layouts/PublicLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import Home from "../pages/Home";
import Dashboard from "../pages/Dashboard";
import GitRank from "../pages/GitRank";
import RankHer from "../pages/RankHer";
import CodingVerse from "../pages/CodingVerse";
import CodingOwl from "../pages/CodingOwl";
import Profile from "../pages/Profile";
import Friends from "../pages/Friends";
import Login from "../pages/Login";
import Onboarding from "../pages/Onboarding";
import NotFound from "../pages/NotFound";
import Achievements from "../pages/Achievements";
import About from "../pages/About";
import Terms from "../pages/Terms";
import Privacy from "../pages/Privacy";
import ComingSoonCard from "../components/ui/ComingSoonCard";
import GlobalModals from "../components/ui/GlobalModals";
import { Settings as SettingsIcon } from "lucide-react";

// Inline loading indicator
const LoadingScreen = ({ message }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090D1A]">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-slate-400 font-bold tracking-widest uppercase">
        {message || "Syncing Session..."}
      </span>
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

  // Strict guard: if the user's data explicitly says they are complete, OR if isOnboarding is false, redirect.
  // We only allow access if they are explicitly incomplete.
  if (
    userData?.onboardingStatus === "complete" ||
    !isOnboarding ||
    (userData && userData.onboardingStatus !== "incomplete")
  ) {
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
        "Mascot Oliver focus target customization",
      ]}
      estimatedArrival="Q3 2026"
      showHourglass={true}
    />
  </div>
);

export const AppRoutes = () => {
  return (
    <>
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
          <Route path="/dashboard/friends" element={<Friends />} />
          <Route path="/dashboard/friends/followers" element={<Friends />} />
          <Route path="/dashboard/friends/following" element={<Friends />} />
          <Route path="/dashboard/profile" element={<Profile />} />
          <Route path="/dashboard/profile/:username" element={<Profile />} />
          <Route path="/dashboard/settings" element={<SettingsPage />} />
        </Route>

        {/* 404 Catch All */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <GlobalModals />
    </>
  );
};

export default AppRoutes;
