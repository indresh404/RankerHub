import {
  collection,
  getDocs,
  doc,
  onSnapshot,
  query,
  where,
  limit,
  orderBy,
  documentId,
  writeBatch,
  increment,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";

// Total number of distributed shards to handle high-concurrency increments
const SHARD_COUNT = 5;

// Asynchronously fetch real users from Firebase ordered by totalPoints descending
// (capped at 50 to avoid downloading the entire collection on every page load)
export const fetchDevelopers = async () => {
  try {
    const q = query(
      collection(db, "users"),
      orderBy("points.totalPoints", "desc"),
      limit(50),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name:
          data.displayName ||
          data.name ||
          data.githubUsername ||
          "Unknown Developer",
        username: data.githubUsername || doc.id,
        avatar:
          data.photoURL ||
          data.avatarUrl ||
          `https://ui-avatars.com/api/?name=${data.displayName || "Dev"}&background=random`,
        role: data.role || "Developer",
        bio: data.bio || "Building awesome projects on RankerHub.",
        tags: data.skills || ["Developer"],
        mutualFriends: 0,
        online: false,
        activity: "Recently joined RankerHub",
        totalPoints: data.points?.totalPoints || 0,
      };
    });
  } catch (error) {
    console.error("Error fetching developers: ", error);
    return [];
  }
};

// --- NEW FIX: Chunked Firestore Query to bypass 30-item limit ---
export const fetchUsersByIds = async (userIds) => {
  if (!userIds || userIds.length === 0) return [];

  // Firestore "in" queries max out at 30 items. We must chunk the array.
  const chunks = [];
  for (let i = 0; i < userIds.length; i += 30) {
    chunks.push(userIds.slice(i, i + 30));
  }

  try {
    const users = [];
    for (const chunk of chunks) {
      const q = query(
        collection(db, "users"),
        where(documentId(), "in", chunk),
      );
      const snapshot = await getDocs(q);

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          name:
            data.displayName ||
            data.name ||
            data.githubUsername ||
            "Unknown Developer",
          username: data.githubUsername || doc.id,
          avatar:
            data.photoURL ||
            data.avatarUrl ||
            `https://ui-avatars.com/api/?name=${data.displayName || "Dev"}&background=random`,
          role: data.role || "Developer",
          bio: data.bio || "Building awesome projects on RankerHub.",
          tags: data.skills || ["Developer"],
          mutualFriends: 0,
          online: false,
          activity: "Recently joined RankerHub",
        });
      });
    }
    return users;
  } catch (error) {
    console.error("Error fetching chunked users:", error);
    return [];
  }
};

// Real-time listener for users the current user is following
export const subscribeToFollowing = (currentUserId, callback) => {
  if (!currentUserId) return () => {};
  const q = query(
    collection(db, "follows"),
    where("followerId", "==", currentUserId),
  );
  return onSnapshot(q, (snapshot) => {
    const followingIds = snapshot.docs.map((doc) => doc.data().followedId);
    callback(followingIds);
  });
};

// Real-time listener for users following the current user
export const subscribeToFollowers = (currentUserId, callback) => {
  if (!currentUserId) return () => {};
  const q = query(
    collection(db, "follows"),
    where("followedId", "==", currentUserId),
  );
  return onSnapshot(q, (snapshot) => {
    const followerIds = snapshot.docs.map((doc) => doc.data().followerId);
    callback(followerIds);
  });
};

// Toggle logic with Firestore (Enhanced with Atomic Batches & Sharding)
export const toggleFollowStatus = async (
  currentUserId,
  developerId,
  isFollowing,
) => {
  if (!currentUserId || !developerId) return;
  const followDocId = `${currentUserId}_${developerId}`;
  const followRef = doc(db, "follows", followDocId);

  // 1. Perform the core follow/unfollow write on its own.
  // This must succeed independently of the analytics shard counter below,
  // otherwise a permission error on the shard write silently blocks the
  // entire unfollow action (the original batch.commit() would throw and
  // roll back, including the delete, with no visible error to the user).
  try {
    if (isFollowing) {
      // Unfollow
      await deleteDoc(followRef);
    } else {
      // Follow
      await setDoc(followRef, {
        followerId: currentUserId,
        followedId: developerId,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error toggling follow status:", error);
    throw error;
  }

  // 2. Best-effort update of the distributed shard counter for global stats.
  // Failures here should not affect the user's follow/unfollow state.
  try {
    const randomShardId = Math.floor(Math.random() * SHARD_COUNT).toString();
    const globalConnectionsShardRef = doc(
      db,
      "aggregates",
      "global_connections",
      "shards",
      randomShardId,
    );
    await setDoc(
      globalConnectionsShardRef,
      { count: increment(isFollowing ? -1 : 1) },
      { merge: true },
    );
  } catch (error) {
    console.error("Error updating connection shard counter:", error);
  }
};

/**
 * 🚀 FEATURE REQUIREMENT: Atomic Batch Update for Daily Streaks & Leaderboard Increments
 * Replaces un-batched direct sets/updates to address single document write limit constraints.
 * Fixed: Removed TypeScript type annotations for valid .js compilation.
 */
export const updateUserActivityAndStreak = async (
  userId,
  collegeId,
  newStreakValue,
  achievementData,
) => {
  if (!userId || !collegeId) return;

  const batch = writeBatch(db);

  const userRef = doc(db, "users", userId);
  const logRef = doc(collection(db, "activity_logs"));

  // Choose randomized shard index to bypass Firestore's 1 write/sec limit on leaderboard increments
  const randomShardId = Math.floor(Math.random() * SHARD_COUNT).toString();
  const leaderboardShardRef = doc(
    db,
    "aggregates",
    collegeId,
    "shards",
    randomShardId,
  );

  try {
    // A. Update user profile metrics & streaks atomically
    batch.update(userRef, {
      currentStreak: newStreakValue,
      lastActivityTimestamp: new Date().toISOString(),
      ...(achievementData && {
        totalPoints: increment(achievementData.points),
      }),
    });

    // B. Log activity event inside the same transaction frame
    batch.set(logRef, {
      userId,
      activityType: "streak_increment",
      timestamp: new Date().toISOString(),
      details: achievementData || {
        description: "Daily system contribution logged",
      },
    });

    // C. Increment the Distributed Shard for high-concurrency rankings
    batch.set(leaderboardShardRef, { count: increment(1) }, { merge: true });

    // Execute everything atomically
    await batch.commit();
  } catch (error) {
    console.error("Atomic activity update failed:", error);
    throw error;
  }
};

/**
 * Distributed Counter Shard Aggregator for Leaderboard Metrics
 * Sums up distributed field allocations to compute exact realtime totals for the UI.
 * Fixed: Removed TypeScript return type annotation for valid .js compilation.
 */
export const getAggregatedLeaderboardMetric = async (collegeId) => {
  let combinedTotal = 0;
  try {
    const shardsSnapshot = await getDocs(
      collection(db, "aggregates", collegeId, "shards"),
    );
    shardsSnapshot.forEach((shardDoc) => {
      const data = shardDoc.data();
      if (data && typeof data.count === "number") {
        combinedTotal += data.count;
      }
    });
  } catch (error) {
    console.error("Failed to compile aggregated metrics:", error);
  }
  return combinedTotal;
};

// --- UPDATED FIX: Now async and fetches missing profiles dynamically ---
export const hydrateConnections = async (
  suggestedDevelopers,
  followingIds,
  followerIds,
) => {
  // 1. Get a unique list of all IDs we actually need to render
  const uniqueConnectionIds = [...new Set([...followingIds, ...followerIds])];

  // 2. Fetch specific user profiles dynamically (ignoring the 50 limit constraint)
  const fetchedConnections = await fetchUsersByIds(uniqueConnectionIds);

  // 3. Map them for quick lookup
  const connectionMap = {};
  fetchedConnections.forEach((dev) => {
    connectionMap[dev.id] = dev;
  });

  // 4. Hydrate exact arrays (filter(Boolean) removes deleted accounts automatically)
  const following = followingIds.map((id) => connectionMap[id]).filter(Boolean);
  const followers = followerIds.map((id) => connectionMap[id]).filter(Boolean);

  const friendIds = followingIds.filter((id) => followerIds.includes(id));
  const friends = friendIds.map((id) => connectionMap[id]).filter(Boolean);

  // 5. Suggested pool remains the standard fetchDevelopers result, minus those we follow
  const suggested = (suggestedDevelopers || []).filter(
    (dev) => !followingIds.includes(dev.id),
  );

  return {
    friends,
    followers,
    following,
    suggested,
  };
};
