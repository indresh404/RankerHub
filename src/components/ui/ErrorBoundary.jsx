import React, { Component } from "react";
import { motion } from "framer-motion"; 

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  // ADDED: Graceful recovery method (No full page reload)
  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // ADDED: Dynamic context-specific message
      const customMessage = this.props.fallbackMessage || "The application encountered an unexpected error. Don't worry, your data is safe.";

      return (
        // Changed min-h-screen to min-h-[60vh] so it fits perfectly inside dashboard layouts too
        <div className="w-full h-full min-h-[60vh] flex flex-col items-center justify-center p-6 text-slate-800 dark:text-slate-100 transition-colors duration-300">
          
          {/* ADDED: Framer motion wrapper for entry animation */}
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="max-w-md w-full backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/50 shadow-2xl rounded-2xl p-8 text-center flex flex-col items-center"
          >
            {/* Premium CSS-Animated SVG warning graphic */}
            <div className="relative w-40 h-40 mb-6 flex items-center justify-center">
              {/* Glowing backdrop rings */}
              <div className="absolute inset-0 bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-xl animate-pulse" />
              <div className="absolute w-32 h-32 border border-violet-500/20 dark:border-violet-500/10 rounded-full animate-ping [animation-duration:3s]" />
              <div className="absolute w-28 h-28 border border-indigo-500/30 dark:border-indigo-500/15 rounded-full animate-pulse" />
              
              {/* Main SVG Icon Container */}
              <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <svg className="w-12 h-12 text-white animate-bounce [animation-duration:2.5s]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            
            <h1 className="text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-blue-500">
              Something went wrong.
            </h1>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
              {customMessage}
            </p>

            {/* ADDED: Hidden technical details for developers (only shows in localhost/dev mode) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="w-full mb-6 p-3 bg-slate-50 dark:bg-slate-950 rounded-lg text-left overflow-hidden">
                <p className="text-[10px] font-mono text-red-500 break-words">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <button
              onClick={this.handleRetry}
              className="px-6 py-2.5 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              Try Again
            </button>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;