/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  getAdditionalUserInfo,
  getRedirectResult,
  GithubAuthProvider
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  runTransaction
} from "firebase/firestore";
import axios from "axios";
import { auth, db, signInWithGitHub, signOutUser } from "../lib/firebase";
import { validateUserData } from "../utils/inputValidation";
import { userDataCache, listenerOptimizer } from "../utils/firestoreOptimization";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

const checkAndUpdateStreak = async (data, docRef) => {
  if (!data || data.onboardingStatus !== "complete") return;
  const now = new Date();
  const lastLoginDate = data.lastLogin ? new Date(data.lastLogin) : null;

  // GUARD 1 (Client-side): 
  if (lastLoginDate && lastLoginDate.toDateString() === now.toDateString()) {
    return;
  }

  try {
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(docRef);
      if (!userDoc.exists()) return;

      const latestData = userDoc.data();
      const currentNow = new Date();
      const latestLastLogin = latestData.lastLogin ? new Date(latestData.lastLogin) : null;

      // GUARD 2 (Server-side Atomic Check):
      if (latestLastLogin && latestLastLogin.toDateString() === currentNow.toDateString()) {
        return;
      }

      let newStreak = latestData.streak || 1;
      let newStreakPoints = latestData.points?.streakPoints || 0;

      if (latestLastLogin) {
        const yesterday = new Date(currentNow);
        yesterday.setDate(yesterday.getDate() - 1);

        if (latestLastLogin.toDateString() === yesterday.toDateString()) {
          newStreak += 1;
          newStreakPoints += 10;
        } else {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      const newTotalPoints = (latestData.points?.gitRankPoints || 0) + 
                             (latestData.points?.referralPoints || 0) + 
                             (latestData.points?.codingVersePoints || 0) + 
                             newStreakPoints;
                             
      const newLongestStreak = Math.max(latestData.longestStreak || 0, newStreak);

      transaction.update(docRef, {
        streak: newStreak,
        longestStreak: newLongestStreak,
        lastLogin: currentNow.toISOString(),
        "points.streakPoints": newStreakPoints,
        "points.totalPoints": newTotalPoints,
        hubCoins: (data.hubCoins || 0) + 10
      });
    });
    console.log("Streak updated successfully via Thread-Safe Atomic Transaction.");
  } catch (err) {
    console.error("Failed to update streak atomically:", err);
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(auth ? true : false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [ghAccessToken, setGhAccessToken] = useState(null);

  useEffect(() => {
    if (!auth) {
      console.warn("Firebase auth is not initialized; auth listener skipped.");
      return undefined;
    }

    let unsubscribeSnapshot = null;

    getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
          const authUser = result.user;
          const credential = GithubAuthProvider.credentialFromResult(result);
          const accessToken = credential?.accessToken || null;
          if (accessToken) {
            setGhAccessToken(accessToken);
            sessionStorage.setItem(`gh_token_${authUser.uid}`, accessToken);
          }

          const additionalInfo = getAdditionalUserInfo(result);
          const githubUsername = (additionalInfo?.username || authUser.displayName || "").trim();
          const githubId = additionalInfo?.profile?.id || null;
          const avatar = additionalInfo?.profile?.avatar_url || authUser.photoURL || "";

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
              privateRepoSyncEnabled: true,
              city: "",
              streak: 0,
              longestStreak: 0,
              githubStreak: 0,
              lastLogin: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              points: {
                gitRankPoints: 0, codingVersePoints: 0, streakPoints: 0, referralPoints: 0, auditorPoints: 0, totalPoints: 0
              },
              lastAuditReward: null
            };
            await setDoc(userDocRef, skeletalUser);
          } else {
            await setDoc(userDocRef, { lastLogin: new Date().toISOString() }, { merge: true });
          }
        }
      })
      .catch((error) => console.error("Redirect sign-in resolution failure:", error));

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, "users", currentUser.uid);
        
        const docPath = `users/${currentUser.uid}`;
        const cachedData = userDataCache.get(docPath);
        if (cachedData) {
          setUserData(cachedData);
          setIsOnboarding(cachedData.onboardingStatus === "incomplete");
          setLoading(false);
        }

        unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            userDataCache.set(docPath, data);

            listenerOptimizer.debounce(currentUser.uid, (userData) => {
              setUserData(userData);
              setIsOnboarding(userData.onboardingStatus === "incomplete");
              setLoading(false);
            }, data);

            checkAndUpdateStreak(data, userDocRef);
          } else {
            userDataCache.delete(docPath);
            listenerOptimizer.debounce(currentUser.uid, () => {
              setUserData(null);
              setIsOnboarding(true);
              setLoading(false);
            }, null);
          }
        }, () => setLoading(false));

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
    try {
      const response = await signInWithGitHub(requestRepoScope);
      setLoading(true);
      if (!response) return null;

      const { user: authUser, accessToken, result } = response;
      const additionalInfo = getAdditionalUserInfo(result);
      const rawUserData = {
        githubUsername: additionalInfo?.username || authUser.displayName || "",
        name: authUser.displayName || additionalInfo?.username || "Developer",
        email: authUser.email || "",
        avatar: additionalInfo?.profile?.avatar_url || authUser.photoURL || ""
      };

      const validation = validateUserData(rawUserData);
      const sanitizedUserData = validation.sanitized;
      const githubId = additionalInfo?.profile?.id || null;

      setGhAccessToken(accessToken);
      sessionStorage.setItem(`gh_token_${authUser.uid}`, accessToken);

      const userDocRef = doc(db, "users", authUser.uid);
      const docSnap = await getDoc(userDocRef);
      const today = new Date();

      if (!docSnap.exists()) {
        const skeletalUser = {
          uid: authUser.uid,
          githubUsername: sanitizedUserData.githubUsername,
          githubId,
          name: sanitizedUserData.name,
          email: sanitizedUserData.email,
          avatar: sanitizedUserData.avatar,
          onboardingStatus: "incomplete",
          privateRepoSyncEnabled: requestRepoScope,
          city: "", streak: 1, longestStreak: 0, githubStreak: 0,
          lastLogin: today.toISOString(), createdAt: today.toISOString(),
          points: { gitRankPoints: 0, codingVersePoints: 0, streakPoints: 10, referralPoints: 0, auditorPoints: 0, totalPoints: 10 },
          hubCoins: 500, inventory: ["oliver"], activeMascot: "oliver", lastAuditReward: null
        };
        await setDoc(userDocRef, skeletalUser);
      } else {
        await setDoc(userDocRef, {
          lastLogin: today.toISOString(),
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
      await signOutUser();
      if (user?.uid) sessionStorage.removeItem(`gh_token_${user.uid}`);
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

  const purchaseMascot = async (mascotId, price) => {
    if (!user || !userData) throw new Error("Not authenticated");
    const currentCoins = userData.hubCoins ?? 500;
    if (currentCoins < price) throw new Error("Insufficient HubCoins");
    const currentInventory = userData.inventory || ["oliver"];
    if (currentInventory.includes(mascotId)) throw new Error("Mascot already owned");
    
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      hubCoins: currentCoins - price,
      inventory: [...currentInventory, mascotId],
      updatedAt: new Date().toISOString()
    });
  };

  const equipMascot = async (mascotId) => {
    if (!user || !userData) throw new Error("Not authenticated");
    const currentInventory = userData.inventory || ["oliver"];
    if (!currentInventory.includes(mascotId)) throw new Error("Mascot not owned");
    
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      activeMascot: mascotId,
      updatedAt: new Date().toISOString()
    });
  };

  // =========================================================================
  // ISSUE #441: Web Worker Integration for Offloading Heavy GitHub Iterations
  // =========================================================================
  const fetchGitHubStats = async (uid, username) => {
    if (!username || typeof username !== "string") throw new Error("GitHub username is required.");
    const trimmedUsername = username.trim();
    if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(trimmedUsername)) {
      throw new Error("Invalid GitHub username format.");
    }

    const encodedUsername = encodeURIComponent(trimmedUsername);
    const headers = ghAccessToken ? { Authorization: `token ${ghAccessToken}` } : {};

    try {
      // 1. Fetch raw payloads from GitHub
      const profileRes = await axios.get(`https://api.github.com/users/${encodedUsername}`, { headers }).catch(() => ({ data: {} }));
      const reposRes = await axios.get(`https://api.github.com/users/${encodedUsername}/repos?per_page=100&type=owner`, { headers }).catch(() => ({ data: [] }));
      const eventsRes = await axios.get(`https://api.github.com/users/${encodedUsername}/events?per_page=100`, { headers }).catch(() => ({ data: [] }));

      const profileData = profileRes.data;
      const reposData = reposRes.data;
      const eventsData = eventsRes.data;

      // 2. Offload heavy aggregation to the Web Worker
      const workerResult = await new Promise((resolve, reject) => {
        // Instantiate the worker using Vite's native URL pattern
        const worker = new Worker(new URL('../workers/gitRankCalculator.worker.js', import.meta.url), { type: 'module' });

        worker.onmessage = (e) => {
          if (e.data.status === "success") {
            resolve(e.data.data);
          } else {
            reject(new Error(e.data.error));
          }
          worker.terminate(); // Prevent memory leaks
        };

        worker.onerror = (err) => {
          reject(err);
          worker.terminate(); // Cleanup on failure
        };

        // Post the raw data for background processing
        worker.postMessage({ 
          repos: reposData, 
          events: eventsData, 
          userProfile: profileData 
        });
      });

      // 3. Compute continuous GitHub streak locally (Lightweight operation)
      let githubStreak = 0;
      try {
        const eventDates = new Set(
          eventsData
            .filter(e => e.created_at)
            .map(e => e.created_at.split('T')[0])
        );
        
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let dateToCheck = eventDates.has(todayStr) ? today : (eventDates.has(yesterdayStr) ? yesterday : null);

        if (dateToCheck) {
          while (true) {
            const checkStr = dateToCheck.toISOString().split('T')[0];
            if (eventDates.has(checkStr)) {
              githubStreak++;
              dateToCheck.setDate(dateToCheck.getDate() - 1);
            } else {
              break;
            }
          }
        }
      } catch (err) {
        console.warn("GitHub events retrieval failed for streak calculation:", err);
      }

      // 4. Combine Worker results with local calculations
      const finalGitRankPoints = workerResult.gitRankPoints + (githubStreak * 10);

      return {
        ...workerResult.githubStats, // Includes commits, prs, reviews, repos, stars, followers, primaryLanguage
        githubStreak,
        gitRankPoints: finalGitRankPoints
      };

    } catch (error) {
      console.error("Error executing GitHub stats fetcher snapshot via Worker:", error);
      return {
        commits: 0, prs: 0, reviews: 0, publicRepos: 0, stars: 0, followers: 0,
        primaryLanguage: "JavaScript", githubStreak: 0, gitRankPoints: 0
      };
    }
  };

  const syncGitHubData = async () => {
    if (!user || !userData?.githubUsername) return;

    if (userData.lastSync) {
      const getTimestamp = (val) => val?.toMillis ? val.toMillis() : (val?.seconds ? val.seconds * 1000 : new Date(val).getTime());
      if (Date.now() - getTimestamp(userData.lastSync) < 5 * 60 * 1000) return;
    }

    try {
      const ghStats = await fetchGitHubStats(user.uid, userData.githubUsername);
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) throw new Error("User document does not exist in Firestore!");

      const liveData = userDoc.data();
      const newTotalPoints = ghStats.gitRankPoints + (liveData.points?.referralPoints || 0) + (liveData.points?.codingVersePoints || 0) + (liveData.points?.streakPoints || 0);

      const batch = writeBatch(db);
      batch.update(userRef, {
        "githubStats.commits": ghStats.commits,
        "githubStats.prs": ghStats.prs,
        "githubStats.reviews": ghStats.reviews,
        "githubStats.repos": ghStats.publicRepos,
        "githubStats.stars": ghStats.stars,
        "githubStats.followers": ghStats.followers,
        "githubStats.primaryLanguage": ghStats.primaryLanguage,
        "githubStreak": ghStats.githubStreak,
        "points.gitRankPoints": ghStats.gitRankPoints,
        "points.totalPoints": newTotalPoints,
        "lastSync": serverTimestamp()
      });

      await batch.commit();
    } catch (error) {
      console.error("Background GitHub sync failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, isOnboarding, login, logout, fetchGitHubStats, syncGitHubData, ghAccessToken, setUserData, purchaseMascot, equipMascot }}>
      {children}
    </AuthContext.Provider>
  );
};