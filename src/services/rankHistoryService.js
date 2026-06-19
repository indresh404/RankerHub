import { db } from "../lib/firebase";
import { doc, setDoc, getDocs, collection, query, orderBy, limit } from "firebase/firestore";
import { toLocalDateString, resolveTimezone } from "../utils/streakCalculator";

/**
 * Saves a user's rank snapshot for the current date.
 * Uses the user's timezone to determine the local date.
 * 
 * @param {string} uid - User ID
 * @param {number|string} rank - Current rank (numeric)
 * @param {number} totalPoints - Total points
 * @param {string} [timezone] - Timezone of the user
 */
export const saveRankSnapshot = async (uid, rank, totalPoints, timezone) => {
  if (!uid || rank === undefined || rank === null || rank === "Loading...") return;
  
  // Extract number from "#42" or similar
  const numericRank = typeof rank === "string" ? parseInt(rank.replace(/[^0-9]/g, ""), 10) : rank;
  if (isNaN(numericRank)) return;

  const timeZone = resolveTimezone(timezone);
  const todayStr = toLocalDateString(new Date(), timeZone);
  
  const snapRef = doc(db, "users", uid, "rankHistory", todayStr);
  await setDoc(snapRef, {
    rank: numericRank,
    totalPoints: Number(totalPoints),
    date: todayStr,
    recordedAt: new Date().toISOString()
  }, { merge: true });
};

/**
 * Fetches the user's rank history snapshots.
 * 
 * @param {string} uid - User ID
 * @returns {Promise<Array>} List of snapshots ordered by date descending
 */
export const getRankHistory = async (uid) => {
  if (!uid) return [];
  try {
    const q = query(
      collection(db, "users", uid, "rankHistory"),
      orderBy("date", "desc"),
      limit(30)
    );
    const snapshot = await getDocs(q);
    const history = [];
    snapshot.forEach((doc) => {
      history.push(doc.data());
    });
    return history;
  } catch (error) {
    console.error("Error fetching rank history:", error);
    return [];
  }
};

/**
 * Seeds mock rank history for a user to facilitate testing and validation.
 * 
 * @param {string} uid - User ID
 * @param {number} currentTotalPoints - Current total points
 * @param {string} [timezone] - Timezone
 */
export const seedMockRankHistory = async (uid, currentTotalPoints, timezone) => {
  if (!uid) return;
  const timeZone = resolveTimezone(timezone);
  const now = new Date();
  
  const mockPoints = [
    { daysAgo: 14, rank: 58, pointsOffset: -250 },
    { daysAgo: 10, rank: 51, pointsOffset: -180 },
    { daysAgo: 7, rank: 45, pointsOffset: -120 },
    { daysAgo: 4, rank: 42, pointsOffset: -50 },
    { daysAgo: 1, rank: 40, pointsOffset: -10 }
  ];

  for (const mock of mockPoints) {
    const date = new Date(now);
    date.setDate(now.getDate() - mock.daysAgo);
    const dateStr = toLocalDateString(date, timeZone);
    const snapRef = doc(db, "users", uid, "rankHistory", dateStr);
    await setDoc(snapRef, {
      rank: mock.rank,
      totalPoints: Math.max(0, currentTotalPoints + mock.pointsOffset),
      date: dateStr,
      recordedAt: date.toISOString()
    }, { merge: true });
  }
};
