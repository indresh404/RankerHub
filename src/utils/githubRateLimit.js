// src/utils/githubRateLimit.js

/**
 * Parses GitHub rate limit headers from an axios response
 * and returns structured rate limit info.
 */
export const parseRateLimitHeaders = (headers) => {
  const remaining = parseInt(headers?.["x-ratelimit-remaining"] ?? -1);
  const limit = parseInt(headers?.["x-ratelimit-limit"] ?? -1);
  const resetTimestamp = parseInt(headers?.["x-ratelimit-reset"] ?? 0);

  const resetDate = resetTimestamp ? new Date(resetTimestamp * 1000) : null;
  const resetInMs = resetDate ? resetDate.getTime() - Date.now() : 0;
  const resetInMinutes = Math.ceil(resetInMs / 60000);

  return { remaining, limit, resetDate, resetInMinutes };
};

/**
 * Checks if an error is a GitHub rate limit error (403 or 429)
 * and returns a user-friendly message with reset time.
 */
export const getRateLimitMessage = (error) => {
  const status = error?.response?.status;
  const headers = error?.response?.headers;

  if (status === 403 || status === 429) {
    const { resetInMinutes } = parseRateLimitHeaders(headers);

    if (resetInMinutes > 0) {
      return `GitHub API rate limit reached. Try again in ${resetInMinutes} minute${resetInMinutes !== 1 ? "s" : ""}.`;
    }
    return "GitHub API rate limit reached. Please try again later.";
  }

  return null;
};

/**
 * Wraps an axios GitHub API call with rate limit error handling.
 * Returns { data, rateLimitError }
 */
export const githubFetch = async (axiosFn) => {
  try {
    const response = await axiosFn();
    return { data: response.data, rateLimitError: null };
  } catch (error) {
    const rateLimitMessage = getRateLimitMessage(error);
    if (rateLimitMessage) {
      return { data: null, rateLimitError: rateLimitMessage };
    }
    throw error;
  }
};
