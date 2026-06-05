/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, getAdditionalUserInfo } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  writeBatch,
} from "firebase/firestore";
import axios from "axios";
import { auth, db, signInWithGitHub, signOutUser } from "../lib/firebase";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

const checkAndUpdateStreak = async (data, docRef) => {
  if (!data || data.onboardingStatus !== "complete") return;
  const now = new Date();
  const lastLoginDate = data.lastLogin ? new Date(data.lastLogin) : null;

  if (!lastLoginDate || lastLoginDate.toDateString() !== now.toDateString()) {
    let newStreak = data.streak || 1;
    let newStreakPoints = data.points?.streakPoints || 0;

    if (lastLoginDate) {
      const diffTime = Math.abs(now - lastLoginDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak += 1;
        newStreakPoints += 10;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    const newTotalPoints =
      (data.points?.gitRankPoints || 0) +
      (data.points?.referralPoints || 0) +
      (data.points?.codingVersePoints || 0) +
      newStreakPoints;

    const newLongestStreak = Math.max(data.longestStreak || 0, newStreak);

    try {
      await updateDoc(docRef, {
        streak: newStreak,
        longestStreak: newLongestStreak,
        lastLogin: now.toISOString(),
        "points.streakPoints": newStreakPoints,
        "points.totalPoints": newTotalPoints,
      });
      console.log(
        "Streak updated successfully. New Streak:",
        newStreak,
        "| Longest:",
        newLongestStreak,
      );
    } catch (err) {
      console.error("Failed to update streak:", err);
    }
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);
  // GitHub OAuth access token persisted in sessionStorage to survive page refreshes
  const [ghAccessToken, setGhAccessToken] = useState(() => {
    return sessionStorage.getItem("gh_access_token") || null;
  });

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (currentUser) {
        setUser(currentUser);
        const token =
          sessionStorage.getItem(`gh_token_${currentUser.uid}`) ||
          sessionStorage.getItem("gh_access_token");
        if (token) {
          setGhAccessToken(token);
        }

        const userDocRef = doc(db, "users", currentUser.uid);

        unsubscribeSnapshot = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setUserData(data);
              setIsOnboarding(data.onboardingStatus === "incomplete");
              setLoading(false);
              checkAndUpdateStreak(data, userDocRef);
            } else {
              setUserData(null);
              setIsOnboarding(true);
              setLoading(false);
            }
          },
          (error) => {
            console.error("Real-time profile listener error:", error);
            setLoading(false);
          },
        );
      } else {
        setUser(null);
        setUserData(null);
        setIsOnboarding(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const login = async (requestRepoScope = true) => {
    setLoading(true);
    try {
      const {
        user: authUser,
        accessToken,
        result,
      } = await signInWithGitHub(requestRepoScope);

      const additionalInfo = getAdditionalUserInfo(result);
      const githubUsername = (
        additionalInfo?.username ||
        authUser.displayName ||
        ""
      ).trim();
      const githubId = additionalInfo?.profile?.id || null;
      const avatar =
        additionalInfo?.profile?.avatar_url || authUser.photoURL || "";

      // Save the token to sessionStorage and state to keep user authenticated across refreshes
      sessionStorage.setItem("gh_access_token", accessToken);
      sessionStorage.setItem(`gh_token_${authUser.uid}`, accessToken);
      setGhAccessToken(accessToken);

      const userDocRef = doc(db, "users", authUser.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        const skeletalUser = {
          uid: authUser.uid,
          githubUsername,
          githubId,
          name: authUser.displayName || githubUsername || "Developer",
          email: authUser.email || "",
          avatar,
          onboardingStatus: "incomplete",
          privateRepoSyncEnabled: requestRepoScope,
          city: "",
          streak: 0,
          longestStreak: 0,
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          points: {
            gitRankPoints: 0,
            codingVersePoints: 0,
            streakPoints: 0,
            referralPoints: 0,
            totalPoints: 0,
          },
        };
        await setDoc(userDocRef, skeletalUser);
      } else {
        await setDoc(
          userDocRef,
          {
            lastLogin: new Date().toISOString(),
            ...(requestRepoScope && { privateRepoSyncEnabled: true }),
          },
          { merge: true },
        );
      }

      return authUser;
    } catch (error) {
      console.error("Login service failure:", error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (user) {
        sessionStorage.removeItem(`gh_token_${user.uid}`);
      }
      sessionStorage.removeItem("gh_access_token");
      await signOutUser();
      setUser(null);
      setUserData(null);
      setIsOnboarding(false);
      setGhAccessToken(null);
    } catch (error) {
      console.error("Logout failure:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGitHubStats = async (uid, username) => {
    const token = ghAccessToken;
    const headers = token ? { Authorization: `token ${token}` } : {};

    try {
      const profileRes = await axios.get(
        `https://api.github.com/users/${username}`,
        { headers },
      );
      const publicRepos = profileRes.data.public_repos || 0;
      const followers = profileRes.data.followers || 0;

      let stars = 0;
      let primaryLanguage = "JavaScript";
      try {
        const reposRes = await axios.get(
          `https://api.github.com/users/${username}/repos?per_page=100&type=owner`,
          { headers },
        );
        stars = reposRes.data.reduce(
          (sum, r) => sum + (r.stargazers_count || 0),
          0,
        );

        const langCounts = {};
        reposRes.data.forEach((r) => {
          if (r.language) {
            langCounts[r.language] = (langCounts[r.language] || 0) + 1;
          }
        });
        const sortedLangs = Object.keys(langCounts).sort(
          (a, b) => langCounts[b] - langCounts[a],
        );
        if (sortedLangs.length > 0) {
          primaryLanguage = sortedLangs[0];
        }
      } catch (err) {
        console.warn("Stars/Language retrieval warning, defaulting:", err);
      }

      let commits = 0;
      try {
        const commitsRes = await axios.get(
          `https://api.github.com/search/commits?q=author:${username}`,
          { headers },
        );
        commits = commitsRes.data.total_count || 0;
      } catch (err) {
        console.warn(
          "Commits retrieval failed; score will be incomplete until next refresh:",
          err,
        );
        commits = 0;
      }

      let prs = 0;
      try {
        const prsRes = await axios.get(
          `https://api.github.com/search/issues?q=author:${username}+type:pr`,
          { headers },
        );
        prs = prsRes.data.total_count || 0;
      } catch (err) {
        console.warn(
          "PRs retrieval failed; score will be incomplete until next refresh:",
          err,
        );
        prs = 0;
      }

      let reviews = 0;
      try {
        const reviewsRes = await axios.get(
          `https://api.github.com/search/issues?q=reviewed-by:${username}`,
          { headers },
        );
        reviews = reviewsRes.data.total_count || 0;
      } catch (err) {
        console.warn(
          "Reviews retrieval failed; score will be incomplete until next refresh:",
          err,
        );
        reviews = 0;
      }

      const gitRankPoints = commits * 2 + prs * 5 + reviews * 10;

      return {
        commits,
        prs,
        reviews,
        publicRepos,
        stars,
        followers,
        primaryLanguage,
        gitRankPoints,
      };
    } catch (error) {
      console.error("Error executing GitHub stats fetcher snapshot:", error);
      return {
        commits: 0,
        prs: 0,
        reviews: 0,
        publicRepos: 0,
        stars: 0,
        followers: 0,
        primaryLanguage: "JavaScript",
        gitRankPoints: 0,
      };
    }
  };

  const syncGitHubData = async () => {
    if (!user || !userData?.githubUsername) return;

    if (userData.lastSync) {
      const lastSyncTime = new Date(userData.lastSync).getTime();
      const cooldownMs = 5 * 60 * 1000;
      if (Date.now() - lastSyncTime < cooldownMs) {
        console.log("Background GitHub sync skipped: Cooldown active.");
        return;
      }
    }

    try {
      const ghStats = await fetchGitHubStats(user.uid, userData.githubUsername);
      const userRef = doc(db, "users", user.uid);

      // Phase 1: Retrieve Live Data
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error("User document does not exist in Firestore!");
      }

      const liveData = userDoc.data();
      const currentReferralPoints = liveData.points?.referralPoints || 0;
      const currentCodingVersePoints = liveData.points?.codingVersePoints || 0;
      const currentStreakPoints = liveData.points?.streakPoints || 0;

      const newGitRankPoints = ghStats.gitRankPoints;
      const newTotalPoints =
        newGitRankPoints +
        currentReferralPoints +
        currentCodingVersePoints +
        currentStreakPoints;

      // Phase 2: Issue Atomic Batch Write
      const batch = writeBatch(db);

      batch.update(userRef, {
        "githubStats.commits": ghStats.commits,
        "githubStats.prs": ghStats.prs,
        "githubStats.reviews": ghStats.reviews,
        "githubStats.repos": ghStats.publicRepos,
        "githubStats.stars": ghStats.stars,
        "githubStats.followers": ghStats.followers,
        "githubStats.primaryLanguage": ghStats.primaryLanguage,
        "points.gitRankPoints": newGitRankPoints,
        "points.totalPoints": newTotalPoints,
        lastSync: new Date().toISOString(),
      });

      // Execute atomic transaction
      await batch.commit();

      console.log(
        "Background GitHub sync completed successfully via atomic batch.",
      );
    } catch (error) {
      console.error("Background GitHub sync failed:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        isOnboarding,
        login,
        logout,
        fetchGitHubStats,
        syncGitHubData,
        ghAccessToken,
        setUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
