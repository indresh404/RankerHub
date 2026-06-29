import React, { useState } from "react";
import {
  Search,
  Activity,
  ShieldCheck,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  GitBranch,
  Info,
  Code2,
  Award,
} from "lucide-react";
import { Github } from "../components/ui/Icons";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export const Auditor = () => {
  const { userData, user } = useAuth();
  const [repoUrl, setRepoUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [error, setError] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  // Helper to parse repo owner and name
  const parseRepo = (url) => {
    try {
      const u = new URL(url);
      const parts = u.pathname.split("/").filter(Boolean);
      if (u.hostname === "github.com" && parts.length >= 2) {
        return { owner: parts[0], repo: parts[1] };
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    setError("");
    setAuditResult(null);
    setClaimSuccess(false);

    const parsed = parseRepo(repoUrl);
    if (!parsed) {
      setError(
        "Please enter a valid public GitHub repository URL (e.g., https://github.com/facebook/react).",
      );
      return;
    }

    setIsScanning(true);
    try {
      // 1. Fetch Repo Metadata
      const repoRes = await fetch(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
      );
      if (!repoRes.ok) {
        if (repoRes.status === 403)
          throw new Error(
            "GitHub API rate limit exceeded. Please try again later.",
          );
        if (repoRes.status === 404)
          throw new Error("Repository not found or is private.");
        throw new Error("Failed to fetch repository metadata.");
      }
      const repoData = await repoRes.json();
      const defaultBranch = repoData.default_branch || "main";

      // 2. Fetch Tree
      const treeRes = await fetch(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${defaultBranch}?recursive=1`,
      );
      if (!treeRes.ok) {
        if (treeRes.status === 403)
          throw new Error(
            "GitHub API rate limit exceeded. Please try again later.",
          );
        throw new Error("Failed to fetch repository file structure.");
      }
      const treeData = await treeRes.json();
      const files = treeData.tree.map((t) => t.path.toLowerCase());

      // 3. Analyze
      const checks = {
        readme: files.some((f) => f === "readme.md" || f === "readme.txt"),
        license: files.some(
          (f) => f === "license" || f === "license.md" || f === "license.txt",
        ),
        gitignore: files.some((f) => f === ".gitignore"),
        cicd: files.some((f) => f.startsWith(".github/workflows/")),
        testing: files.some(
          (f) =>
            f.includes("test") ||
            f.includes("spec") ||
            f === "jest.config.js" ||
            f === "vitest.config.ts" ||
            f.endsWith(".test.js") ||
            f.endsWith(".test.ts"),
        ),
        description: Boolean(
          repoData.description && repoData.description.length > 10,
        ),
      };

      // 4. Calculate Score
      let score = 0;
      if (checks.readme) score += 20;
      if (checks.description) score += 20;
      if (checks.license) score += 10;
      if (checks.gitignore) score += 10;
      if (checks.cicd) score += 20;
      if (checks.testing) score += 20;

      setAuditResult({
        ...repoData,
        checks,
        score,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleClaimReward = async () => {
    if (!user || !userData) return;
    setClaiming(true);

    try {
      const userRef = doc(db, "users", user.uid);
      const newTotalPoints = (userData.points?.totalPoints || 0) + 50;
      const newAuditorPoints = (userData.points?.auditorPoints || 0) + 50;

      await updateDoc(userRef, {
        "points.totalPoints": newTotalPoints,
        "points.auditorPoints": newAuditorPoints,
        lastAuditReward: new Date().toISOString(),
      });

      setClaimSuccess(true);
    } catch (err) {
      console.error("Error claiming reward:", err);
      setError("Failed to claim reward. Please try again.");
    } finally {
      setClaiming(false);
    }
  };

  // Cooldown check (7 days)
  const canClaimReward = () => {
    if (!userData?.lastAuditReward) return true;
    const lastReward = new Date(userData.lastAuditReward);
    const now = new Date();
    const diffDays = Math.floor((now - lastReward) / (1000 * 60 * 60 * 24));
    return diffDays >= 7;
  };

  const isEligibleForReward = auditResult?.score > 85;
  const showClaimButton = isEligibleForReward && canClaimReward();

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <SectionHeader
        title="Repository Auditor"
        subtitle="Paste a public GitHub repository link below to evaluate its health based on clean coding standards."
        icon={Activity}
      />

      {/* Search Bar */}
      <Card className="p-2 sm:p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
        <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Github className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/facebook/react"
              className="w-full pl-12 pr-4 py-3 sm:py-4 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isScanning || !repoUrl.trim()}
            className="px-6 py-3 sm:py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all whitespace-nowrap"
          >
            {isScanning ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Scan Repo</span>
              </>
            )}
          </button>
        </form>
      </Card>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Results */}
      {auditResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score Ring Card */}
            <Card className="p-6 flex flex-col items-center justify-center text-center lg:col-span-1">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6">
                Health Score
              </h3>

              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg
                  className="w-full h-full transform -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    className="text-slate-200 dark:text-slate-800"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className={`transition-all duration-1000 ease-out ${
                      auditResult.score >= 85
                        ? "text-emerald-500"
                        : auditResult.score >= 50
                          ? "text-amber-500"
                          : "text-red-500"
                    }`}
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * auditResult.score) / 100}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className={`text-4xl font-extrabold ${
                      auditResult.score >= 85
                        ? "text-emerald-500"
                        : auditResult.score >= 50
                          ? "text-amber-500"
                          : "text-red-500"
                    }`}
                  >
                    {auditResult.score}%
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {auditResult.full_name}
                </p>
                {isEligibleForReward ? (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Excellent structure! This repository meets production-grade
                    standards.
                  </p>
                ) : (
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    Needs improvement. Follow the advice below to increase
                    quality.
                  </p>
                )}
              </div>
            </Card>

            {/* Breakdown Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CheckCard
                title="Documentation"
                passed={auditResult.checks.readme}
                icon={<FileText className="w-5 h-5" />}
                advice="Add a detailed README.md explaining how to run and use your project."
              />
              <CheckCard
                title="Repository Context"
                passed={auditResult.checks.description}
                icon={<Info className="w-5 h-5" />}
                advice="Add a description and topics to help others discover your repository."
              />
              <CheckCard
                title="Version Control"
                passed={auditResult.checks.gitignore}
                icon={<GitBranch className="w-5 h-5" />}
                advice="Include a .gitignore file to prevent pushing build files or secrets."
              />
              <CheckCard
                title="License"
                passed={auditResult.checks.license}
                icon={<ShieldCheck className="w-5 h-5" />}
                advice="Add an open-source license (e.g., MIT, GPL) so others can use your code safely."
              />
              <CheckCard
                title="Automated Testing"
                passed={auditResult.checks.testing}
                icon={<Activity className="w-5 h-5" />}
                advice="Add automated tests and place them in a /tests folder to ensure stability."
              />
              <CheckCard
                title="CI/CD Workflows"
                passed={auditResult.checks.cicd}
                icon={<Code2 className="w-5 h-5" />}
                advice="Set up GitHub Actions (.github/workflows) to automatically build and test your code."
              />
            </div>
          </div>

          {/* Reward Section */}
          <Card
            className={`p-6 border-2 transition-all ${
              claimSuccess
                ? "border-emerald-500/50 bg-emerald-500/5"
                : isEligibleForReward
                  ? "border-amber-500/50 bg-amber-500/5"
                  : "border-slate-200 dark:border-slate-800"
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
              <div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center sm:justify-start gap-2">
                  <Award
                    className={`w-5 h-5 ${claimSuccess || isEligibleForReward ? "text-amber-500" : "text-slate-400"}`}
                  />
                  Auditor Reward
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-md">
                  {claimSuccess
                    ? "Reward claimed successfully! Come back next week to scan another repository."
                    : !canClaimReward()
                      ? "You've already claimed your weekly auditor reward. Keep building and come back next week!"
                      : isEligibleForReward
                        ? "Your repository score is over 85%! Claim your weekly bonus XP."
                        : "Reach a health score of 85% or higher to unlock the weekly bonus."}
                </p>
              </div>

              {showClaimButton && (
                <button
                  onClick={handleClaimReward}
                  disabled={claiming || claimSuccess}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-lg shadow-amber-500/25 disabled:opacity-50 transition-all whitespace-nowrap"
                >
                  {claiming ? "Claiming..." : "Claim 50 XP"}
                </button>
              )}

              {claimSuccess && (
                <div className="px-6 py-3 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Claimed!
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// Helper Component for Breakdown Cards
const CheckCard = ({ title, passed, icon, advice }) => {
  return (
    <div
      className={`p-4 rounded-xl border ${
        passed
          ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/5 dark:border-emerald-500/20"
          : "bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`p-2 rounded-lg flex-shrink-0 ${
            passed
              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
              : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
          }`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {title}
            </h4>
            {passed ? (
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            ) : (
              <XCircle className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <p
            className={`text-xs mt-1 ${passed ? "text-emerald-600/80 dark:text-emerald-400/80" : "text-slate-500 dark:text-slate-400"}`}
          >
            {passed ? "Check passed successfully." : advice}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auditor;
