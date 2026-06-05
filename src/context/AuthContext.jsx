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
import { userDataCache, listenerOptimizer } from "../utils/firestoreOptimization";

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
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      const lastLoginDateStr = lastLoginDate.toDateString();
      const todayStr = now.toDateString();
      const yesterdayStr = yesterday.toDateString();

      if (lastLoginDateStr === yesterdayStr) {
        newStreak += 1;
        newStreakPoints += 10;
      } else if (lastLoginDateStr !== todayStr) {
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
      console.log("Streak updated successfully. New Streak:", newStreak, "| Longest:", newLongestStreak);
    } catch (err) {
      console.error("Failed to update streak:", err);
    }
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(auth ? true : false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  // GitHub OAuth access token stored only in memory, not persisted to storage
  // Firebase Auth handles session persistence securely via HTTP-only cookies
  const [ghAccessToken, setGhAccessToken] = useState(null);

  useEffect(() => {
    // If Firebase wasn't configured (app === null), `auth` will be null.
    // Avoid calling `onAuthStateChanged` with a null auth instance which
    // causes a runtime error in the browser bundle.
    if (!auth) {
      console.warn("Firebase auth is not initialized; auth listener skipped.");
      return undefined;
    }

    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (currentUser) {
        setUser(currentUser);
        // Token is only available during the current session in memory
        // It will be null on page refresh, requiring fresh authentication
        // This is the secure default behavior

        const userDocRef = doc(db, "users", currentUser.uid);
        
        // Try to load from cache first to reduce initial load time
        const docPath = `users/${currentUser.uid}`;
        const cachedData = userDataCache.get(docPath);
        if (cachedData) {
          setUserData(cachedData);
          setIsOnboarding(cachedData.onboardingStatus === "incomplete");
          setLoading(false);
        }

        // Subscribe to real-time updates with debouncing to reduce re-renders
        unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();

            // Update cache immediately for fast subsequent reads
            userDataCache.set(docPath, data);

            // Debounce state updates to prevent excessive re-renders from rapid changes
            listenerOptimizer.debounce(currentUser.uid, (userData) => {
              setUserData(userData);
              setIsOnboarding(userData.onboardingStatus === "incomplete");
              setLoading(false);
            }, data);

            // Update streak asynchronously
            checkAndUpdateStreak(data, userDocRef);
          } else {
            userDataCache.delete(docPath);
            listenerOptimizer.debounce(currentUser.uid, () => {
              setUserData(null);
              setIsOnboarding(true);
              setLoading(false);
            }, null);
          }
        }, (error) => {
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

      // Store token only in memory for current session
      // Firebase Auth handles persistent session via secure HTTP-only cookies
      // Token is not persisted to localStorage or sessionStorage to prevent XSS theft
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
      console.error("Login service failure:", error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      // No need to remove from storage since token is only in memory
      // Firebase Auth session will be cleared by signOutUser()
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