// src/workers/gitRankCalculator.worker.js

self.onmessage = function (e) {
  const { repos = [], events = [], userProfile = {} } = e.data;

  try {
    let totalCommits = 0;
    let totalPRs = 0;
    let totalReviews = 0;
    let totalStars = 0;

    // 1. Process Repositories (Stars and Primary Language)
    const languages = {};
    repos.forEach((repo) => {
      totalStars += repo.stargazers_count || 0;
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }
    });

    let primaryLanguage = "JavaScript"; // Default fallback
    let maxCount = 0;
    for (const [lang, count] of Object.entries(languages)) {
      if (count > maxCount) {
        maxCount = count;
        primaryLanguage = lang;
      }
    }

    // 2. Process Events (Commits, PRs, Reviews)
    events.forEach((event) => {
      if (event.type === "PushEvent") {
        totalCommits += event.payload?.size || event.payload?.commits?.length || 1;
      } else if (event.type === "PullRequestEvent" && event.payload?.action === "opened") {
        totalPRs += 1;
      } else if (event.type === "PullRequestReviewEvent") {
        totalReviews += 1;
      }
    });

    // 3. GitRank Formula Calculation
    // Issue #441: commits * 2 + prs * 5 + reviews * 10
    const gitRankPoints = (totalCommits * 2) + (totalPRs * 5) + (totalReviews * 10);

    // 4. Construct the final structured payload
    const githubStats = {
      commits: totalCommits,
      prs: totalPRs,
      reviews: totalReviews,
      repos: repos.length,
      stars: totalStars,
      followers: userProfile?.followers || 0,
      primaryLanguage
    };

    // Send the processed data back to the main thread
    self.postMessage({ 
      status: "success", 
      data: { gitRankPoints, githubStats } 
    });

  } catch (error) {
    // Catch any parsing errors so the main thread doesn't hang forever
    self.postMessage({ 
      status: "error", 
      error: error.message 
    });
  }
};