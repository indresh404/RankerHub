import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PublicLayout from "../layouts/PublicLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import ComingSoonCard from "../components/ui/ComingSoonCard";
import GlobalModals from "../components/ui/GlobalModals";
import { Settings as SettingsIcon } from "lucide-react";
import ErrorBoundary from "../components/ui/ErrorBoundary"; 
import { FirestoreCacheProvider } from "../context/FirestoreCacheContext";

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

  if (userData?.onboardingStatus === "complete" || !isOnboarding || (userData && userData.onboardingStatus !== "incomplete")) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Route Guard: Access allowed ONLY if NOT authenticated
const GuestRoute = ({ children }) => {
  const { user, loading, isOnboarding } = useAuth();

  if (loading) {
    return null; 
  }

  if (user) {
    if (isOnboarding) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

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

// Helper wrapper to easily wrap lazy components with ErrorBoundary
const withErrorBoundary = (Component, componentName, fallbackMessage) => (
  <ErrorBoundary componentName={componentName} fallbackMessage={fallbackMessage}>
    <Component />
  </ErrorBoundary>
);

export const AppRoutes = () => {
  return (
    <>
      <FirestoreCacheProvider>
        <Suspense fallback={<LoadingScreen message="Loading Page..." />}>
          <Routes>
            {/* Public Site Layout & Pages */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={withErrorBoundary(Home, "Home", "Failed to load the homepage. Please try refreshing.")} />
              <Route path="/gitrank" element={withErrorBoundary(GitRank, "GitRank", "GitRank couldn't load right now. Try refreshing, or sync your GitHub stats.")} />
              <Route path="/rankher" element={withErrorBoundary(RankHer, "RankHer", "Failed to load RankHer leaderboard. Please check your connection.")} />
              <Route path="/codingverse" element={withErrorBoundary(CodingVerse, "CodingVerse", "CodingVerse arenas failed to load. Please try again.")} />
              <Route path="/codingowl" element={withErrorBoundary(CodingOwl, "CodingOwl", "Failed to load your habit tracker. Please try again.")} />
            </Route>

            {/* Standalone About Us page */}
            <Route path="/about" element={withErrorBoundary(About, "About", "Failed to load the About page.")} />

            {/* Standalone Legal pages */}
            <Route path="/terms" element={withErrorBoundary(Terms, "Terms", "Failed to load Terms of Service.")} />
            <Route path="/privacy" element={withErrorBoundary(Privacy, "Privacy", "Failed to load Privacy Policy.")} />

            {/* Public Login page */}
            <Route path="/login" element={<GuestRoute>{withErrorBoundary(Login, "Login", "Failed to initialize the login portal.")}</GuestRoute>} />
            
            {/* Onboarding page */}
            <Route path="/onboarding" element={<OnboardingRoute>{withErrorBoundary(Onboarding, "Onboarding", "Failed to load the onboarding flow.")}</OnboardingRoute>} />
            
            {/* Layout dashboard sub-pages */}
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={withErrorBoundary(Dashboard, "Dashboard", "Your dashboard failed to load. Try refreshing the page.")} />
              <Route path="/dashboard/gitrank" element={withErrorBoundary(GitRank, "GitRank", "GitRank couldn't load right now. Try refreshing, or sync your GitHub stats.")} />
              <Route path="/dashboard/rankher" element={withErrorBoundary(RankHer, "RankHer", "Failed to load RankHer data.")} />
              <Route path="/dashboard/achievements" element={withErrorBoundary(Achievements, "Achievements", "Failed to load your badges and trophies.")} />
              <Route path="/dashboard/codingverse" element={withErrorBoundary(CodingVerse, "CodingVerse", "CodingVerse challenges failed to load.")} />
              <Route path="/dashboard/codingowl" element={withErrorBoundary(CodingOwl, "CodingOwl", "Failed to load CodingOwl streaks.")} />
              <Route path="/dashboard/matchmaker" element={withErrorBoundary(Matchmaker, "Matchmaker", "Failed to find developer matches.")} />
              <Route path="/dashboard/friends" element={withErrorBoundary(Friends, "Friends", "Failed to load your social network.")} />
              <Route path="/dashboard/friends/leaderboard" element={withErrorBoundary(Friends, "Friends Leaderboard", "Failed to load friends leaderboard.")} />
              <Route path="/dashboard/friends/followers" element={withErrorBoundary(Friends, "Followers", "Failed to load followers list.")} />
              <Route path="/dashboard/friends/following" element={withErrorBoundary(Friends, "Following", "Failed to load following list.")} />
              <Route path="/dashboard/profile" element={withErrorBoundary(Profile, "Profile", "Your profile data failed to load.")} />
              <Route path="/dashboard/profile/card-builder" element={withErrorBoundary(CardBuilder, "Card Builder", "Failed to initialize the dev card builder.")} />
              <Route path="/dashboard/profile/:username" element={withErrorBoundary(Profile, "User Profile", "This developer's profile failed to load.")} />
              <Route path="/dashboard/settings" element={<SettingsPage />} />
              <Route path="/dashboard/auditor" element={withErrorBoundary(Auditor, "Auditor", "Security audit logs failed to load.")} />
            </Route>

            {/* 404 Catch All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </FirestoreCacheProvider>
      <GlobalModals />
    </>
  );
};

export default AppRoutes;