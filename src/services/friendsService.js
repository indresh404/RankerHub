import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  limit,
} from "firebase/firestore";
import { db } from "../lib/firebase";

// Asynchronously fetch real users from Firebase (capped at 50 to avoid
// downloading the entire collection on every page load)
export const fetchDevelopers = async () => {
  try {
    const q = query(collection(db, "users"), limit(50));
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
      };
    });
  } catch (error) {
    console.error("Error fetching developers: ", error);
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

// Toggle logic with Firestore
export const toggleFollowStatus = async (
  currentUserId,
  developerId,
  isFollowing,
) => {
  if (!currentUserId || !developerId) return;
  const followDocId = `${currentUserId}_${developerId}`;
  const followRef = doc(db, "follows", followDocId);

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
  }
};

export const hydrateConnections = (developers, followingIds, followerIds) => {
  if (!developers)
    return { friends: [], followers: [], following: [], suggested: [] };

  const following = developers.filter((developer) =>
    followingIds.includes(developer.id),
  );
  const followers = developers.filter((developer) =>
    followerIds.includes(developer.id),
  );
  const friends = developers.filter(
    (developer) =>
      followingIds.includes(developer.id) && followerIds.includes(developer.id),
  );
  const suggested = developers.filter(
    (developer) => !followingIds.includes(developer.id),
  );

  return {
    friends,
    followers,
    following,
    suggested,
  };
};
