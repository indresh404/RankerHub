import { createContext, useContext } from "react";

export const RateLimitContext = createContext();

export const useRateLimit = () => useContext(RateLimitContext);
