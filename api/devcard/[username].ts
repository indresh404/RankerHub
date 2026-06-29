export const config = {
  runtime: "edge",
};

// Theme configurations
const themes = {
  cyberpunk: {
    bg: "#0D0E15",
    border: "#00FF41",
    textPrimary: "#00FF41",
    textSecondary: "#008F11",
    accent: "#FF003C",
    gradient: "url(#cyberpunk-grad)",
  },
  solarized: {
    bg: "#002B36",
    border: "#2AA198",
    textPrimary: "#839496",
    textSecondary: "#586E75",
    accent: "#B58900",
    gradient: "none",
  },
  dark: {
    bg: "#0D1117",
    border: "#30363D",
    textPrimary: "#C9D1D9",
    textSecondary: "#8B949E",
    accent: "#58A6FF",
    gradient: "none",
  },
  glassmorphism: {
    bg: "rgba(255, 255, 255, 0.1)",
    border: "rgba(255, 255, 255, 0.2)",
    textPrimary: "#FFFFFF",
    textSecondary: "rgba(255, 255, 255, 0.7)",
    accent: "#A78BFA",
    gradient: "url(#glass-grad)",
  },
};

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/");
    const usernameParam = parts[parts.length - 1];
    const username = decodeURIComponent(usernameParam).replace(/\.svg$/, "");
    const themeName = url.searchParams.get("theme") || "dark";

    const theme = themes[themeName] || themes.dark;
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || "rankerhub";

    // Fetch user data from Firestore REST API
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;

    const queryPayload = {
      structuredQuery: {
        from: [{ collectionId: "users" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "githubUsername" },
            op: "EQUAL",
            value: { stringValue: username },
          },
        },
        limit: 1,
      },
    };

    const response = await fetch(firestoreUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(queryPayload),
    });

    let userData = {
      points: { totalPoints: 0 },
      streak: 0,
      githubStats: { commits: 0, prs: 0 },
      avatar: "",
      college: "",
    };

    let found = false;

    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0 && data[0].document) {
        const docFields = data[0].document.fields;
        found = true;

        userData.points.totalPoints = parseInt(
          docFields.points?.mapValue?.fields?.totalPoints?.integerValue || "0",
          10,
        );
        userData.streak = parseInt(docFields.streak?.integerValue || "0", 10);
        userData.githubStats.commits = parseInt(
          docFields.githubStats?.mapValue?.fields?.commits?.integerValue || "0",
          10,
        );
        userData.githubStats.prs = parseInt(
          docFields.githubStats?.mapValue?.fields?.prs?.integerValue || "0",
          10,
        );
        userData.avatar = docFields.avatar?.stringValue || "";
        userData.college = docFields.college?.stringValue || "";
      }
    }

    // Convert rank based on points (simple logic for display)
    const rank =
      userData.points.totalPoints > 1000
        ? "Diamond"
        : userData.points.totalPoints > 500
          ? "Platinum"
          : userData.points.totalPoints > 200
            ? "Gold"
            : userData.points.totalPoints > 50
              ? "Silver"
              : "Bronze";

    // Calculate level
    const level = Math.floor(userData.points.totalPoints / 100) + 1;

    const svg = `
      <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cyberpunk-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#000000" />
            <stop offset="100%" stop-color="#0D0E15" />
          </linearGradient>
          <linearGradient id="glass-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#3b82f6" />
            <stop offset="100%" stop-color="#8b5cf6" />
          </linearGradient>
          <style>
            .title { font: bold 20px 'Inter', 'Segoe UI', Ubuntu, Sans-Serif; fill: ${theme.textPrimary}; }
            .subtitle { font: 14px 'Inter', 'Segoe UI', Ubuntu, Sans-Serif; fill: ${theme.textSecondary}; }
            .stat-value { font: bold 16px 'Inter', 'Segoe UI', Ubuntu, Sans-Serif; fill: ${theme.textPrimary}; }
            .stat-label { font: 12px 'Inter', 'Segoe UI', Ubuntu, Sans-Serif; fill: ${theme.textSecondary}; }
            .accent { fill: ${theme.accent}; font-weight: bold; }
          </style>
        </defs>
        
        <rect width="400" height="200" rx="10" ry="10" 
              fill="${themeName === "glassmorphism" || themeName === "cyberpunk" ? theme.gradient : theme.bg}" 
              stroke="${theme.border}" stroke-width="2"/>
        
        <!-- Header -->
        <text x="20" y="40" class="title">${username}'s DevCard</text>
        <text x="20" y="60" class="subtitle">RankerHub Level ${level} &bull; ${rank}</text>
        
        <!-- Stats Grid -->
        <g transform="translate(20, 90)">
          <!-- Total Points -->
          <text x="0" y="0" class="stat-value">${userData.points.totalPoints}</text>
          <text x="0" y="20" class="stat-label">Total Points</text>
          
          <!-- Streak -->
          <text x="120" y="0" class="stat-value">${userData.streak} Days</text>
          <text x="120" y="20" class="stat-label">Current Streak</text>
          
          <!-- Commits -->
          <text x="240" y="0" class="stat-value">${userData.githubStats.commits}</text>
          <text x="240" y="20" class="stat-label">GH Commits</text>
          
          <!-- PRs -->
          <text x="0" y="55" class="stat-value">${userData.githubStats.prs}</text>
          <text x="0" y="75" class="stat-label">Pull Requests</text>
          
          <!-- Status -->
          <text x="120" y="55" class="accent">${found ? "Active Profile" : "Not Found"}</text>
          <text x="120" y="75" class="stat-label">Status</text>
        </g>

        <!-- Footer -->
        <text x="380" y="185" font-size="10" fill="${theme.textSecondary}" text-anchor="end" font-family="'Inter', sans-serif">
          Generated dynamically by RankerHub
        </text>
      </svg>
    `.trim();

    return new Response(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control":
          "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    console.error("DevCard Error:", e);
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><text x="20" y="20" fill="red">Error generating devcard</text></svg>',
      {
        status: 500,
        headers: { "Content-Type": "image/svg+xml" },
      },
    );
  }
}
