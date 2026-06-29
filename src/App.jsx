import React, { useEffect } from "react";
import { HashRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RateLimitProvider } from "./context/RateLimitContext";
import AppRoutes from "./routes/AppRoutes";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import RateLimitBanner from "./components/ui/RateLimitBanner";
import Preloader from "./components/ui/Preloader";
import ScrollToTop from "./components/ui/ScrollToTop";

const AppContent = () => {
  const { loading } = useAuth();
  if (loading) return <Preloader />;
  return (
    <>
      <ScrollToTop />
      <RateLimitBanner />
      <AppRoutes />
    </>
  );
};

function App() {
  useEffect(() => {
    const path = window.location.pathname;
    if (path !== "/" && path !== "/index.html") {
      window.location.replace("/#" + path);
    }
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <RateLimitProvider>
            <HashRouter>
              <Preloader />
              <AppContent />
            </HashRouter>
          </RateLimitProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
