/**
 * Pagination optimization utilities to prevent unnecessary re-ranking
 * Ensures efficient incremental loading without recalculating ranks
 */

/**
 * Manages paginated user data efficiently
 * Prevents re-ranking of already loaded users
 */
export class PaginationManager {
  constructor() {
    this.allUsers = [];
    this.currentPage = 0;
    this.pageSize = 50;
  }

  /**
   * Initialize with first page of users
   */
  initializeWithFirstPage(users) {
    this.allUsers = users.map((u, i) => ({
      ...u,
      rank: i + 1
    }));
    this.currentPage = 1;
    return this.allUsers;
  }

  /**
   * Add next page of users without re-ranking previous ones
   */
  appendNextPage(newUsers) {
    const startRank = this.allUsers.length + 1;
    const rankedNewUsers = newUsers.map((u, i) => ({
      ...u,
      rank: startRank + i
    }));
    this.allUsers.push(...rankedNewUsers);
    this.currentPage++;
    return this.allUsers;
  }

  /**
   * Get users for current pagination state
   */
  getAllUsers() {
    return this.allUsers;
  }

  /**
   * Clear pagination state
   */
  reset() {
    this.allUsers = [];
    this.currentPage = 0;
  }

  /**
   * Get total users loaded
   */
  getTotalCount() {
    return this.allUsers.length;
  }

  /**
   * Check if should load more
   */
  shouldLoadMore(hasMoreOnServer) {
    return hasMoreOnServer && this.allUsers.length > 0;
  }
}

/**
 * Prevents excessive re-ranking by memoizing rank assignments
 */
export class RankCache {
  constructor() {
    this.rankMap = new Map(); // Map of userId -> rank
  }

  /**
   * Get cached rank for user
   */
  getRank(userId) {
    return this.rankMap.get(userId);
  }

  /**
   * Cache rank for user
   */
  setRank(userId, rank) {
    this.rankMap.set(userId, rank);
  }

  /**
   * Clear all cached ranks
   */
  clear() {
    this.rankMap.clear();
  }

  /**
   * Check if rank is cached
   */
  hasRank(userId) {
    return this.rankMap.has(userId);
  }
}

/**
 * Efficiently assign ranks to users without recalculating
 * @param {Array} existingUsers - Previously ranked users
 * @param {Array} newUsers - New users to rank
 * @returns {Array} Combined users with correct ranks
 */
export function assignRanksEfficiently(existingUsers = [], newUsers = []) {
  if (existingUsers.length === 0) {
    // Initial load - assign ranks starting from 1
    return newUsers.map((u, i) => ({
      ...u,
      rank: i + 1
    }));
  }

  // For new users, start ranking after existing users
  const startRank = existingUsers.length + 1;
  const rankedNewUsers = newUsers.map((u, i) => ({
    ...u,
    rank: startRank + i
  }));

  return [...existingUsers, ...rankedNewUsers];
}

/**
 * Detect if all users are being unnecessarily re-ranked
 * Call this for debugging to identify re-ranking issues
 * @param {Array} previousUsers - Users from previous render
 * @param {Array} currentUsers - Users from current render
 * @returns {boolean} True if re-ranking occurred
 */
export function detectUnecessaryRanking(previousUsers = [], currentUsers = []) {
  if (previousUsers.length === 0 || currentUsers.length === 0) {
    return false;
  }

  // If same number of users but ranks changed, re-ranking occurred
  if (previousUsers.length === currentUsers.length) {
    for (let i = 0; i < previousUsers.length; i++) {
      if (previousUsers[i].uid === currentUsers[i].uid &&
          previousUsers[i].rank !== currentUsers[i].rank) {
        return true; // Re-ranking detected
      }
    }
  }

  return false;
}

/**
 * Global pagination manager instance
 */
export const paginationManager = new PaginationManager();

/**
 * Global rank cache instance
 */
export const rankCache = new RankCache();
