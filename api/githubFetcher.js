/**
 * 🚀 GitHub API Interceptor with ETag Optimization & Token Throttling
 * Resolves Issue #346 - NSoC '26
 */

const ETAG_CACHE_PREFIX = "gh_etag_";
const DATA_CACHE_PREFIX = "gh_data_";

// 🔒 Cryptographic Leak Isolation: Token is stored ONLY in ephemeral memory.
// It never touches localStorage, cookies, or console logs.
let ephemeralAccessToken = null;

export const setGitHubAuthToken = (token) => {
  ephemeralAccessToken = token;
};

export const clearGitHubAuthToken = () => {
  ephemeralAccessToken = null;
};

/**
 * Core Fetch Wrapper for GitHub Endpoints
 * @param {string} endpoint - The GitHub API URL (e.g., 'https://api.github.com/users/abc')
 */
export const fetchGitHubData = async (endpoint) => {
  try {
    const headers = {
      Accept: "application/vnd.github.v3+json",
    };

    // Safely inject token if available
    if (ephemeralAccessToken) {
      headers["Authorization"] = `Bearer ${ephemeralAccessToken}`;
    }

    // 💡 Conditional ETag Ingestion: Check lightweight local store
    const cachedETag = localStorage.getItem(ETAG_CACHE_PREFIX + endpoint);
    if (cachedETag) {
      headers["If-None-Match"] = cachedETag; // Prevents API quota usage if data is unchanged
    }

    const response = await fetch(endpoint, { headers });

    // ⚡ 304 Optimization Routing: Bypass pipeline and load historical payload
    if (response.status === 304) {
      const historicalData = localStorage.getItem(DATA_CACHE_PREFIX + endpoint);
      if (historicalData) {
        return JSON.parse(historicalData);
      }
    }

    // Handle Rate Limit Lockouts securely
    if (response.status === 403 || response.status === 429) {
      const remaining = response.headers.get("x-ratelimit-remaining");
      if (remaining === "0") {
        console.warn(
          "[GitHub API] Rate limit hit. Serving stale cache if available to prevent lockout.",
        );
        const fallbackData = localStorage.getItem(DATA_CACHE_PREFIX + endpoint);
        if (fallbackData) return JSON.parse(fallbackData);
        throw new Error(
          "GitHub API Rate Limit Exceeded and no cache available.",
        );
      }
    }

    if (!response.ok) {
      throw new Error(`GitHub API Error: ${response.statusText}`);
    }

    // Process new data
    const data = await response.json();
    const newETag = response.headers.get("etag");

    // Update lightweight local store with new ETag and Payload
    if (newETag) {
      localStorage.setItem(ETAG_CACHE_PREFIX + endpoint, newETag);
      localStorage.setItem(DATA_CACHE_PREFIX + endpoint, JSON.stringify(data));
    }

    return data;
  } catch (error) {
    // 🛡️ Cryptographic Leak Isolation: Sanitize error logs
    console.error(
      "[GitHub Interceptor] Request failed for endpoint:",
      endpoint.split("?")[0],
    );

    // Fixed: Attached the original error as 'cause' to satisfy 'preserve-caught-error'
    throw new Error("GitHub fetch operation failed gracefully.", {
      cause: error,
    });
  }
};
