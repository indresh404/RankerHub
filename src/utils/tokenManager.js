const TOKEN_KEY = (uid) => `gh_token_${uid}`;

export const TokenManager = {
  store(uid, token) {
    if (!uid || !token) return;
    sessionStorage.setItem(TOKEN_KEY(uid), token);
  },

  get(uid) {
    if (!uid) return null;
    return sessionStorage.getItem(TOKEN_KEY(uid));
  },

  remove(uid) {
    if (!uid) return;
    sessionStorage.removeItem(TOKEN_KEY(uid));
  },

  clear() {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith("gh_token_")) {
        sessionStorage.removeItem(key);
      }
    });
  },
};
