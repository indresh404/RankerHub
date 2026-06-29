import React, { useState, useEffect } from "react";
import axios from "axios";
import { RateLimitContext } from "./rateLimitContextValue";

export const RateLimitProvider = ({ children }) => {
  const [isRateLimited, setIsRateLimited] = useState(false);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (
          error.response &&
          error.response.status === 403 &&
          error.response.headers["x-ratelimit-remaining"] === "0"
        ) {
          setIsRateLimited(true);
        }
        return Promise.reject(error);
      },
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const resetRateLimit = () => setIsRateLimited(false);

  return (
    <RateLimitContext.Provider value={{ isRateLimited, resetRateLimit }}>
      {children}
    </RateLimitContext.Provider>
  );
};
