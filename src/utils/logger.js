const logger = {
  info: (message, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[INFO] ${message}`, sanitizeData(data));
    }
  },

  error: (message, error, context = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ERROR] ${message}`, error, sanitizeData(context));
    }
  },

  warn: (message, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[WARN] ${message}`, sanitizeData(data));
    }
  },

  debug: (message, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, sanitizeData(data));
    }
  },
};

const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveKeys = [
    'userId',
    'uid',
    'email',
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'sessionId',
    'personalInfo',
    'username',
    'githubUsername',
    'apiKey',
    'secret',
  ];

  const sanitized = { ...data };

  sensitiveKeys.forEach((key) => {
    if (key in sanitized) {
      sanitized[key] = '[REDACTED]';
    }
  });

  return sanitized;
};

export default logger;
