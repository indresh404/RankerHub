import { db } from "../lib/firebase";
import {
  query,
  collection,
  where,
  getCountFromServer,
} from "firebase/firestore";

let isSyncing = false;
let preSyncDataSnapshot = null;

/**
 * Sets the current synchronization state and optionally stores a copy of user data.
 * This ensures ranking calculations use a consistent snapshot if sync is active.
 *
 * @param {boolean} syncActive - True if synchronization is in progress
 * @param {Object} [userDataSnapshot] - Current user data snapshot before sync starts
 */
export const setSyncState = (syncActive, userDataSnapshot = null) => {
  isSyncing = syncActive;
  if (syncActive && userDataSnapshot) {
    // Clone snapshot to ensure immutability
    preSyncDataSnapshot = JSON.parse(JSON.stringify(userDataSnapshot));
  } else if (!syncActive) {
    preSyncDataSnapshot = null;
  }
};

/**
 * Returns the current sync state and pre-sync data snapshot.
 *
 * @returns {Object} { isSyncing, preSyncDataSnapshot }
 */
export const getSyncState = () => {
  return { isSyncing, preSyncDataSnapshot };
};

/**
 * Dynamically calculates the user's rank from Firestore standings.
 * If a sync operation is active, it uses the cached pre-sync data snapshot
 * to maintain consistent scores and prevent calculations on partially sync'd data.
 *
 * @param {string} uid - User ID
 * @param {Object} userData - Live user data
 * @returns {Promise<number>} Dynamic rank (1-indexed)
 */
export const calculateUserRank = async (uid, userData) => {
  if (!userData) return null;

  // Pin data to pre-sync snapshot if synchronization is currently active
  const activeData =
    isSyncing && preSyncDataSnapshot ? preSyncDataSnapshot : userData;
  const points = activeData.points?.totalPoints || 0;

  try {
    const q = query(
      collection(db, "users"),
      where("points.totalPoints", ">", points),
    );
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count + 1;
  } catch (err) {
    console.error("Error calculating user rank consistently:", err);
    throw err;
  }
};
