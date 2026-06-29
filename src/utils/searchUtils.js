import { leaderboardData, womenLeaderboardData } from "../data/leaderboard";

/**
 * Search through leaderboard data
 * @param {string} query - Search query
 * @param {boolean} includeWomen - Include women leaderboard data
 * @returns {array} - Filtered results
 */
export const searchLeaderboard = (query, includeWomen = false) => {
  if (!query || query.trim().length === 0) return [];

  const searchTerm = query.toLowerCase().trim();
  let allData = [...leaderboardData];

  if (includeWomen) {
    allData = [...allData, ...womenLeaderboardData];
  }

  return allData.filter((user) => {
    const name = (user.name || "").toLowerCase();
    const username = (user.username || "").toLowerCase();
    const role = (user.role || "").toLowerCase();
    const language = (user.language || "").toLowerCase();

    return (
      name.includes(searchTerm) ||
      username.includes(searchTerm) ||
      role.includes(searchTerm) ||
      language.includes(searchTerm)
    );
  });
};

/**
 * Search through users with highlighting
 * @param {array} users - Array of user objects
 * @param {string} query - Search query
 * @returns {array} - Filtered results
 */
export const searchUsers = (users, query) => {
  if (!query || query.trim().length === 0) return [];

  const searchTerm = query.toLowerCase().trim();

  return users.filter((user) => {
    const name = (user.name || "").toLowerCase();
    const username = (user.username || "").toLowerCase();
    const githubUsername = (user.githubUsername || "").toLowerCase();
    const role = (user.role || "").toLowerCase();
    const language = (user.language || "").toLowerCase();

    return (
      name.includes(searchTerm) ||
      username.includes(searchTerm) ||
      githubUsername.includes(searchTerm) ||
      role.includes(searchTerm) ||
      language.includes(searchTerm)
    );
  });
};

/**
 * Search by language preference
 * @param {array} users - Array of user objects
 * @param {string} language - Language to filter by
 * @returns {array} - Filtered results
 */
export const filterByLanguage = (users, language) => {
  if (!language || language === "All") return users;
  return users.filter(
    (user) =>
      user.language && user.language.toLowerCase() === language.toLowerCase(),
  );
};

/**
 * Search by role/skill
 * @param {array} users - Array of user objects
 * @param {string} role - Role/skill to filter by
 * @returns {array} - Filtered results
 */
export const filterByRole = (users, role) => {
  if (!role) return users;
  const roleSearch = role.toLowerCase();
  return users.filter(
    (user) => user.role && user.role.toLowerCase().includes(roleSearch),
  );
};

/**
 * Combine search query and filters
 * @param {array} users - Array of user objects
 * @param {object} options - Search options {query, language, role, includeWomen}
 * @returns {array} - Filtered results
 */
export const searchAndFilter = (users, options = {}) => {
  let results = [...users];

  // Apply search query
  if (options.query) {
    results = searchUsers(results, options.query);
  }

  // Apply language filter
  if (options.language && options.language !== "All") {
    results = filterByLanguage(results, options.language);
  }

  // Apply role filter
  if (options.role) {
    results = filterByRole(results, options.role);
  }

  return results;
};

/**
 * Get suggestions for search autocomplete
 * @param {array} users - Array of user objects
 * @param {string} query - Partial search query
 * @returns {array} - Suggestion objects
 */
export const getSearchSuggestions = (users, query) => {
  if (!query || query.trim().length < 1) return [];

  const searchTerm = query.toLowerCase().trim();
  const suggestionsMap = new Map();

  users.forEach((user) => {
    const name = user.name || "";
    const username = user.username || "";

    if (name.toLowerCase().startsWith(searchTerm)) {
      const key = `name:${name}`;
      if (!suggestionsMap.has(key)) {
        suggestionsMap.set(key, {
          type: "name",
          value: name,
          display: `${name} (@${username})`,
        });
      }
    }

    if (username.toLowerCase().startsWith(searchTerm)) {
      const key = `username:${username}`;
      if (!suggestionsMap.has(key)) {
        suggestionsMap.set(key, {
          type: "username",
          value: username,
          display: `@${username}`,
        });
      }
    }

    if (user.language && user.language.toLowerCase().includes(searchTerm)) {
      const key = `language:${user.language}`;
      if (!suggestionsMap.has(key)) {
        suggestionsMap.set(key, {
          type: "language",
          value: user.language,
          display: `Language: ${user.language}`,
        });
      }
    }

    // Role suggestions added to match searchLeaderboard and searchUsers behaviour
    if (user.role && user.role.toLowerCase().includes(searchTerm)) {
      const key = `role:${user.role}`;
      if (!suggestionsMap.has(key)) {
        suggestionsMap.set(key, {
          type: "role",
          value: user.role,
          display: `Role: ${user.role}`,
        });
      }
    }
  });

  return Array.from(suggestionsMap.values()).slice(0, 5);
};
