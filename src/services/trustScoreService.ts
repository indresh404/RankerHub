export interface GitHubStats {
  commits: number;
  prs: number;
  reviews: number;
  publicRepos: number;
  stars: number;
  followers: number;
}

export interface GitHubCommitAuthor {
  name?: string;
  email?: string;
  date?: string;
}

export interface GitHubCommitDetail {
  author?: GitHubCommitAuthor;
  message: string;
}

export interface GitHubCommit {
  commit: GitHubCommitDetail;
  author?: {
    login?: string;
  };
}

export interface GitHubEvent {
  type: string;
  repo: {
    name: string;
  };
  payload?: {
    action?: string;
    commits?: Array<{
      message: string;
    }>;
  };
  created_at: string;
}

export interface GitHubRepo {
  name: string;
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
}

export interface TrustBreakdown {
  baseScore: number;
  prMergePoints: number;
  reviewPoints: number;
  externalPoints: number;
  appreciationPoints: number;
  lowContentDeduction: number;
  repeatedCommitDeduction: number;
  concentrationDeduction: number;
  totalScore: number;
}

/**
 * Calculates a Developer Trust Score from 0 to 100.
 */
export const calculateTrustScore = (
  username: string,
  stats: GitHubStats,
  events: GitHubEvent[],
  repos: GitHubRepo[],
  mergedPRsCount: number
): TrustBreakdown => {
  const lowerUsername = username.toLowerCase();
  
  // 1. Base Score
  const baseScore = 50;

  // 2. Positive Signals (Max +50 pts)
  // A. PR Merge Efficiency (Max 15 pts)
  let prMergePoints = 0;
  if (stats.prs > 0) {
    const mergeRatio = mergedPRsCount / stats.prs;
    prMergePoints = Math.min(15, Math.round(mergeRatio * 15));
  } else {
    // Default points if no PR activity (doesn't penalize new developers)
    prMergePoints = 5;
  }

  // B. Code Reviews Provided (Max 10 pts)
  let reviewPoints = 0;
  if (stats.reviews >= 10) reviewPoints = 10;
  else if (stats.reviews >= 5) reviewPoints = 8;
  else if (stats.reviews >= 2) reviewPoints = 5;
  else if (stats.reviews >= 1) reviewPoints = 3;

  // C. Contributions to External Repositories (Max 15 pts)
  let externalPoints = 0;
  let externalCount = 0;
  
  events.forEach(event => {
    if (event.repo && event.repo.name) {
      const parts = event.repo.name.split("/");
      const owner = parts[0]?.toLowerCase();
      if (owner && owner !== lowerUsername) {
        externalCount++;
      }
    }
  });

  if (externalCount >= 6) externalPoints = 15;
  else if (externalCount >= 3) externalPoints = 10;
  else if (externalCount >= 1) externalPoints = 5;

  // D. Community Appreciation (Max 10 pts)
  let appreciationPoints = 0;
  const totalStars = stats.stars || 0;
  const totalForks = repos.reduce((sum, r) => sum + (r.forks_count || 0), 0);

  // Stars (Max 5 pts)
  if (totalStars >= 50) appreciationPoints += 5;
  else if (totalStars >= 15) appreciationPoints += 3;
  else if (totalStars >= 1) appreciationPoints += 1;

  // Forks (Max 5 pts)
  if (totalForks >= 15) appreciationPoints += 5;
  else if (totalForks >= 5) appreciationPoints += 3;
  else if (totalForks >= 1) appreciationPoints += 1;

  // 3. Negative Signals / Deductions (Max -30 pts)
  // A. Low Content Commits (Max -15 pts)
  let lowContentDeduction = 0;
  let totalCommitsParsed = 0;
  let lowContentCommitsCount = 0;
  const suspiciousKeywords = ["fix", "update", "test", "commit", "temp", "a", "asdf", "dummy", "wip", "hello"];

  const pushEvents = events.filter(e => e.type === "PushEvent");
  pushEvents.forEach(e => {
    const commitsList = e.payload?.commits || [];
    commitsList.forEach(c => {
      totalCommitsParsed++;
      const message = c.message.trim().toLowerCase();
      if (message.length < 6 || suspiciousKeywords.includes(message)) {
        lowContentCommitsCount++;
      }
    });
  });

  if (totalCommitsParsed > 5) {
    const lowContentPercent = lowContentCommitsCount / totalCommitsParsed;
    if (lowContentPercent > 0.5) lowContentDeduction = 15;
    else if (lowContentPercent > 0.25) lowContentDeduction = 8;
  }

  // B. Repeated Identical Commits (Max -10 pts)
  let repeatedCommitDeduction = 0;
  const commitMessages: string[] = [];
  pushEvents.forEach(e => {
    const commitsList = e.payload?.commits || [];
    commitsList.forEach(c => {
      commitMessages.push(c.message.trim().toLowerCase());
    });
  });

  let duplicateCount = 0;
  for (let idx = 0; idx < commitMessages.length - 1; idx++) {
    if (commitMessages[idx] === commitMessages[idx + 1]) {
      duplicateCount++;
    }
  }

  if (commitMessages.length > 5) {
    const duplicatePercent = duplicateCount / commitMessages.length;
    if (duplicatePercent > 0.3) {
      repeatedCommitDeduction = 10;
    }
  }

  // C. Activity Concentrated Only in Self-Owned Repos (Max -5 pts)
  let concentrationDeduction = 0;
  let selfActivityCount = 0;
  let totalActivityCount = 0;

  events.forEach(e => {
    if (e.type === "PushEvent" || e.type === "PullRequestEvent" || e.type === "IssuesEvent") {
      totalActivityCount++;
      const parts = e.repo?.name?.split("/");
      const owner = parts[0]?.toLowerCase();
      if (owner === lowerUsername) {
        selfActivityCount++;
      }
    }
  });

  if (totalActivityCount > 5 && selfActivityCount === totalActivityCount) {
    concentrationDeduction = 5;
  }

  // Final Trust Score Compile
  const totalScore = Math.max(
    0,
    Math.min(
      100,
      baseScore + prMergePoints + reviewPoints + externalPoints + appreciationPoints - (lowContentDeduction + repeatedCommitDeduction + concentrationDeduction)
    )
  );

  return {
    baseScore,
    prMergePoints,
    reviewPoints,
    externalPoints,
    appreciationPoints,
    lowContentDeduction,
    repeatedCommitDeduction,
    concentrationDeduction,
    totalScore
  };
};

export interface TrustTier {
  label: string;
  color: string;
  badgeBg: string;
  description: string;
}

export const getTrustTier = (score: number): TrustTier => {
  if (score >= 90) {
    return {
      label: "High Trust",
      color: "text-emerald-500",
      badgeBg: "bg-emerald-500/10 border-emerald-500/20",
      description: "Outstanding contribution quality, active peer code reviews, and strong open-source presence."
    };
  }
  if (score >= 70) {
    return {
      label: "Verified",
      color: "text-blue-500",
      badgeBg: "bg-blue-500/10 border-blue-500/20",
      description: "Consistent, legitimate activities across multiple public repositories with clear documentation."
    };
  }
  if (score >= 50) {
    return {
      label: "Basic",
      color: "text-slate-400 dark:text-slate-500",
      badgeBg: "bg-slate-500/10 border-slate-500/20",
      description: "Initial ranking signal. Contributions are valid but concentrated in self-owned repositories."
    };
  }
  return {
    label: "Low Trust",
    color: "text-amber-500",
    badgeBg: "bg-amber-500/10 border-amber-500/20",
    description: "Suspicious commit frequency, low-content messages, or repetitive commit triggers detected."
  };
};
