/**
 * Input validation and sanitization utilities for GitHub user data
 * Prevents XSS and data corruption attacks
 */

// Regular expressions for validation
const GITHUB_USERNAME_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/.+$/i;

// Dangerous patterns that indicate XSS attempts
const DANGEROUS_PATTERNS = [
  /<script[\s\S]*?<\/script>/i,
  /<iframe[\s\S]*?<\/iframe>/i,
  /javascript:/i,
  /on(load|error|click|focus|blur|submit)\s*=/i,
  /<img[\s\S]*?on/i,
  /eval\(/i,
  /expression\(/i,
];

// Global version of dangerous patterns for sanitization to remove all occurrences
const DANGEROUS_PATTERNS_GLOBAL = DANGEROUS_PATTERNS.map(
  (pattern) => new RegExp(pattern.source, pattern.flags + "g"),
);

/**
 * Sanitize text by removing dangerous HTML and JavaScript
 * @param {string} text - Input text to sanitize
 * @returns {string} Sanitized text
 */
export const sanitizeText = (text) => {
  if (!text || typeof text !== "string") return "";

  let sanitized = text.trim();

  // Remove dangerous patterns (all occurrences)
  for (const pattern of DANGEROUS_PATTERNS_GLOBAL) {
    sanitized = sanitized.replace(pattern, "");
  }

  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, " ");

  // Limit length to prevent storage abuse
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 500);
  }

  return sanitized;
};

/**
 * Validate and sanitize GitHub username
 * GitHub username rules: 1-39 characters, alphanumeric and hyphens only, cannot start/end with hyphen
 * @param {string} username - GitHub username to validate
 * @returns {object} { isValid: boolean, sanitized: string, error: string }
 */
export const validateGitHubUsername = (username) => {
  if (!username || typeof username !== "string") {
    return {
      isValid: false,
      sanitized: "",
      error: "Username must be a non-empty string",
    };
  }

  const trimmed = username.trim();

  // Check GitHub username format
  if (!GITHUB_USERNAME_REGEX.test(trimmed)) {
    return {
      isValid: false,
      sanitized: "",
      error:
        "Invalid GitHub username format. Usernames must be 1-39 characters, alphanumeric and hyphens only",
    };
  }

  // Additional length check (GitHub limit is 39 characters)
  if (trimmed.length > 39) {
    return {
      isValid: false,
      sanitized: "",
      error: "Username exceeds maximum length of 39 characters",
    };
  }

  return {
    isValid: true,
    sanitized: trimmed,
    error: null,
  };
};

/**
 * Validate and sanitize email address
 * @param {string} email - Email to validate
 * @returns {object} { isValid: boolean, sanitized: string, error: string }
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== "string") {
    return {
      isValid: true, // Email is optional
      sanitized: "",
      error: null,
    };
  }

  const trimmed = email.trim().toLowerCase();

  // Check length
  if (trimmed.length > 254) {
    return {
      isValid: false,
      sanitized: "",
      error: "Email exceeds maximum length",
    };
  }

  // Check format
  if (!EMAIL_REGEX.test(trimmed)) {
    return {
      isValid: false,
      sanitized: "",
      error: "Invalid email format",
    };
  }

  return {
    isValid: true,
    sanitized: trimmed,
    error: null,
  };
};

/**
 * Validate and sanitize display name
 * @param {string} name - Display name to validate
 * @returns {object} { isValid: boolean, sanitized: string, error: string }
 */
export const validateDisplayName = (name) => {
  if (!name || typeof name !== "string") {
    return {
      isValid: true, // Name is optional
      sanitized: "Developer",
      error: null,
    };
  }

  const trimmed = sanitizeText(name);

  // Check length
  if (trimmed.length === 0) {
    return {
      isValid: true,
      sanitized: "Developer",
      error: null,
    };
  }

  if (trimmed.length > 100) {
    return {
      isValid: false,
      sanitized: "",
      error: "Display name exceeds maximum length of 100 characters",
    };
  }

  return {
    isValid: true,
    sanitized: trimmed,
    error: null,
  };
};

/**
 * Validate and sanitize avatar URL
 * @param {string} url - Avatar URL to validate
 * @returns {object} { isValid: boolean, sanitized: string, error: string }
 */
export const validateAvatarUrl = (url) => {
  if (!url || typeof url !== "string") {
    return {
      isValid: true, // Avatar is optional
      sanitized: "",
      error: null,
    };
  }

  const trimmed = url.trim();

  // Check URL format
  if (!URL_REGEX.test(trimmed)) {
    return {
      isValid: false,
      sanitized: "",
      error: "Invalid avatar URL. Must be a valid HTTP(S) URL",
    };
  }

  // Check length to prevent storage abuse
  if (trimmed.length > 2048) {
    return {
      isValid: false,
      sanitized: "",
      error: "Avatar URL exceeds maximum length",
    };
  }

  // Ensure it's from trusted domain (avatar.githubusercontent.com)
  const url_obj = new URL(trimmed);
  if (!url_obj.hostname.includes("githubusercontent.com")) {
    return {
      isValid: false,
      sanitized: "",
      error: "Avatar must be from trusted GitHub image host",
    };
  }

  return {
    isValid: true,
    sanitized: trimmed,
    error: null,
  };
};

/**
 * Validate and sanitize complete user data object
 * @param {object} userData - User data from GitHub OAuth
 * @returns {object} { isValid: boolean, sanitized: object, errors: array }
 */
export const validateUserData = (userData) => {
  const errors = [];
  const sanitized = {
    githubUsername: "",
    name: "Developer",
    email: "",
    avatar: "",
  };

  // Validate username (required)
  const usernameValidation = validateGitHubUsername(userData?.githubUsername);
  if (!usernameValidation.isValid) {
    errors.push(usernameValidation.error);
  } else {
    sanitized.githubUsername = usernameValidation.sanitized;
  }

  // Validate email (optional)
  const emailValidation = validateEmail(userData?.email);
  if (!emailValidation.isValid) {
    errors.push(emailValidation.error);
  } else {
    sanitized.email = emailValidation.sanitized;
  }

  // Validate name (optional)
  const nameValidation = validateDisplayName(userData?.name);
  if (!nameValidation.isValid) {
    errors.push(nameValidation.error);
  } else {
    sanitized.name = nameValidation.sanitized;
  }

  // Validate avatar (optional)
  const avatarValidation = validateAvatarUrl(userData?.avatar);
  if (!avatarValidation.isValid) {
    errors.push(avatarValidation.error);
  } else {
    sanitized.avatar = avatarValidation.sanitized;
  }

  return {
    isValid: errors.length === 0,
    sanitized,
    errors,
  };
};

/**
 * Quick check if text contains XSS patterns
 * @param {string} text - Text to check
 * @returns {boolean} True if dangerous patterns detected
 */
export const containsXSSPatterns = (text) => {
  if (!text || typeof text !== "string") return false;

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }

  return false;
};
