export const APP_NAME = "LITHY AI";
export const APP_VERSION = "1.0.0";

export const PLANS = {
  FREE: "FREE",
  PRO: "PRO",
  PREMIUM: "PREMIUM",
} as const;

export const SUBSCRIPTION_INTERVALS = {
  MONTHLY: "month",
  YEARLY: "year",
} as const;

export const AI_MODELS = {
  GPT4O: "gpt-4o",
} as const;

export const FILE_UPLOAD = {
  MAX_SIZE: 20 * 1024 * 1024,
  ALLOWED_TYPES: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "image/jpeg", "image/png"],
} as const;

export const RATE_LIMITS = {
  AUTH: 5,
  API: 100,
  AI_GENERATION: 3,
} as const;
