import { useState, useCallback } from "react";
import { fetchUserProfileByUsername } from "../services/comparisonService";

const STORAGE_KEY = "rankerhub_recent_comparisons";
const MAX_RECENT = 5;

const getStoredComparisons = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const storeComparisons = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
  } catch {
    // silently fail
  }
};

export const useComparison = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [compareUser, setCompareUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recentComparisons, setRecentComparisons] = useState(getStoredComparisons);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => {
    setIsOpen(false);
    setCompareUser(null);
    setError(null);
  }, []);

  const selectUser = useCallback(async (username) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserProfileByUsername(username);
      if (!data) {
        throw new Error("User not found");
      }
      setCompareUser(data);

      setRecentComparisons((prev) => {
        const filtered = prev.filter((u) => u.username !== (data.githubUsername || data.username || username));
        const next = [
          {
            username: data.githubUsername || data.username || username,
            name: data.name || username,
            avatar: data.avatar || data.photoURL || `https://ui-avatars.com/api/?name=${data.name || username}&background=random`
          },
          ...filtered,
        ];
        storeComparisons(next);
        return next;
      });
    } catch (err) {
      setError(err.message || "Failed to load user");
    } finally {
      setLoading(false);
    }
  }, []);

  const clearRecent = useCallback(() => {
    setRecentComparisons([]);
    storeComparisons([]);
  }, []);

  return {
    isOpen,
    openModal,
    closeModal,
    compareUser,
    loading,
    error,
    selectUser,
    recentComparisons,
    clearRecent,
  };
};

export default useComparison;