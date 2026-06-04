/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  getAdditionalUserInfo
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  writeBatch
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
    
    const newTotalPoints = (data.points?.gitRankPoints || 0) + 
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
        "points.totalPoints": newTotalPoints
      });
    } catch (err) {
      // Silent failure for streak updates to avoid exposing internal errors
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
        const token = sessionStorage.getItem(`gh_token_${currentUser.uid}`) || sessionStorage.getItem("gh_access_token");
        if (token) {
          setGhAccessToken(token);
        }
        
        const userDocRef = doc(db, "users", currentUser.uid);
        
        unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
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
        }, (error) => {
          // Silent error handling to avoid exposing internal system errors
          setLoading(false);
        });

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
      const { user: authUser, accessToken, result } = await signInWithGitHub(requestRepoScope);

      const additionalInfo = getAdditionalUserInfo(result);
      const githubUsername = (additionalInfo?.username || authUser.displayName || "").trim();
      const githubId = additionalInfo?.profile?.id || null;
      const avatar = additionalInfo?.profile?.avatar_url || authUser.photoURL || "";

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
          githubStreak: 0,
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          points: {
            gitRankPoints: 0, 
            codingVersePoints: 0,
            streakPoints: 0,
            referralPoints: 0,
            totalPoints: 0
          }
        };
        await setDoc(userDocRef, skeletalUser);
      } else {
        await setDoc(userDocRef, {
          lastLogin: new Date().toISOString(),
          ...(requestRepoScope && { privateRepoSyncEnabled: true })
        }, { merge: true });
      }

      return authUser;
    } catch (error) {
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
      // Silent error handling for logout
    } finally {
      setLoading(false);
    }
  };

  const fetchGitHubStats = async (uid, username) => {
    // Validate GitHub username per GitHub's rules: 1-39 characters,
    // alphanumeric + hyphens only, no leading/trailing hyphens.
    if (!username || typeof username !== "string") {
      throw new Error("GitHub username is required and must be a string.");
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length === 0 || trimmedUsername.length > 39) {
      throw new Error("GitHub username must be between 1 and 39 characters.");
    }

    if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(trimmedUsername)) {
      throw new Error("GitHub username can only contain letters, digits, and hyphens, and cannot start or end with a hyphen.");
    }

    // URL-encode the username to prevent injection attacks, though axios should
    // handle this automatically.
    const encodedUsername = encodeURIComponent(trimmedUsername);

    const token = ghAccessToken;
    const headers = token ? { Authorization: `token ${token}` } : {};

    try {
      const profileRes = await axios.get(`https://api.github.com/users/${encodedUsername}`, { headers });
      const publicRepos = profileRes.data.public_repos || 0;
      const followers = profileRes.data.followers || 0;
      
      let stars = 0;
      let primaryLanguage = "JavaScript";
      try {
        const reposRes = await axios.get(`https://api.github.com/users/${encodedUsername}/repos?per_page=100&type=owner`, { headers });
        stars = reposRes.data.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
        
        const langCounts = {};
        reposRes.data.forEach(r => {
          if (r.language) {
            langCounts[r.language] = (langCounts[r.language] || 0) + 1;
          }
        });
        const sortedLangs = Object.keys(langCounts).sort((a, b) => langCounts[b] - langCounts[a]);
        if (sortedLangs.length > 0) {
          primaryLanguage = sortedLangs[0];
        }
      } catch (err) {
        console.warn("Stars/Language retrieval warning, defaulting:", err);
      }

      let commits = 0;
      try {
        const commitsRes = await axios.get(`https://api.github.com/search/commits?q=author:${encodedUsername}`, { headers });
        commits = commitsRes.data.total_count || 0;
      } catch (err) {
        console.warn("Commits retrieval failed; score will be incomplete until next refresh:", err);
        commits = 0;
      }

      let prs = 0;
      try {
        const prsRes = await axios.get(`https://api.github.com/search/issues?q=author:${encodedUsername}+type:pr`, { headers });
        prs = prsRes.data.total_count || 0;
      } catch (err) {
        console.warn("PRs retrieval failed; score will be incomplete until next refresh:", err);
        prs = 0;
      }

      let reviews = 0;
      try {
        const reviewsRes = await axios.get(`https://api.github.com/search/issues?q=reviewed-by:${encodedUsername}`, { headers });
        reviews = reviewsRes.data.total_count || 0;
      } catch (err) {
        console.warn("Reviews retrieval failed; score will be incomplete until next refresh:", err);
        reviews = 0;
      }

      // --- NEW GITHUB LIVE STREAK CALCULATION LOGIC ---
      let githubStreak = 0;
      try {
        const eventsRes = await axios.get(`https://api.github.com/users/${username}/events?per_page=100`, { headers });
        const events = eventsRes.data;
        
        // Extract unique dates of events (YYYY-MM-DD format)
        const eventDates = new Set(
          events
            .filter(e => e.created_at)
            .map(e => e.created_at.split('T')[0])
        );
        
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let dateToCheck = new Date(today);
        
        if (eventDates.has(todayStr)) {
          // Streak is active today
        } else if (eventDates.has(yesterdayStr)) {
          // Streak was active yesterday, count from yesterday
          dateToCheck = yesterday;
        } else {
          // No active streak
          dateToCheck = null;
        }

        if (dateToCheck) {
          while (true) {
            const checkStr = dateToCheck.toISOString().split('T')[0];
            if (eventDates.has(checkStr)) {
              githubStreak++;
              dateToCheck.setDate(dateToCheck.getDate() - 1);
            } else {
              break; // Streak broken
            }
          }
        }
      } catch (err) {
        console.warn("GitHub events retrieval failed for streak:", err);
      }

      // Add points for each day of the active GitHub streak (+10 XP per day)
      const gitRankPoints = (commits * 2) + (prs * 5) + (reviews * 10) + (githubStreak * 10);

      return {
        commits,
        prs,
        reviews,
        publicRepos,
        stars,
        followers,
        primaryLanguage,
        githubStreak,
        gitRankPoints
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
        githubStreak: 0,
        gitRankPoints: 0
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
      const newTotalPoints = newGitRankPoints + currentReferralPoints + currentCodingVersePoints + currentStreakPoints;

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
        "githubStreak": ghStats.githubStreak, // Syncs live streak to Firestore
        "points.gitRankPoints": newGitRankPoints,
        "points.totalPoints": newTotalPoints,
        "lastSync": new Date().toISOString()
      });

      // Execute atomic transaction
      await batch.commit();

      console.log("Background GitHub sync completed successfully via atomic batch.");
    } catch (error) {
      console.error("Background GitHub sync failed:", error);
    }
  };

  return (
<AuthContext.Provider value={{ user, userData, loading, isOnboarding, login, logout, fetchGitHubStats, syncGitHubData, ghAccessToken, setUserData }}>
      {children}
    </AuthContext.Provider>
  );
};