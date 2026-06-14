import React, { createContext, useContext, useRef, useState, useEffect } from 'react';

const CacheContext = createContext();

export const FirestoreCacheProvider = ({ children }) => {
  // Map store to hold cached data and timestamps
  const cache = useRef(new Map());

  return (
    <CacheContext.Provider value={cache}>
      {children}
    </CacheContext.Provider>
  );
};

export const useFirestoreCache = (cacheKey, fetcherFn, ttl = 60000) => {
  const cache = useContext(CacheContext);
  if (!cache) {
    throw new Error("useFirestoreCache must be used within a FirestoreCacheProvider");
  }

  // Initialize with cached data if it exists
  const [data, setData] = useState(() => {
    const cached = cache.current.get(cacheKey);
    return cached ? cached.data : null;
  });
  
  // Only show loading spinner if we have absolutely no data
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const executeFetch = async () => {
      const cached = cache.current.get(cacheKey);
      const now = Date.now();
      
      // If data exists and is within TTL, skip fetching entirely
      if (cached && (now - cached.ts < ttl)) {
        setLoading(false);
        return;
      }

      try {
        const freshData = await fetcherFn();
        if (!isMounted) return;

        // Deep Comparison Check (prevents unnecessary re-renders)
        const isDataChanged = !cached || JSON.stringify(cached.data) !== JSON.stringify(freshData);

        if (isDataChanged) {
          setData(freshData);
          cache.current.set(cacheKey, { data: freshData, ts: Date.now() });
        }
      } catch (err) {
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    executeFetch();

    return () => {
      isMounted = false;
    };
  }, [cacheKey]); // Important: fetcherFn is omitted to prevent infinite loops

  // Function to manually invalidate cache (e.g., after a mutation)
  const invalidateCache = () => {
    cache.current.delete(cacheKey);
  };

  return { data, loading, error, invalidateCache };
};