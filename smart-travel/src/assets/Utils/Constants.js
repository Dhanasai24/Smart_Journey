// ✅ ENVIRONMENT DETECTION
const isProduction = window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
const isDevelopment = !isProduction

// ✅ PRODUCTION URLs (Your deployed services)
const PRODUCTION_CONFIG = {
  FRONTEND_URL: "https://ai-trip-planner24.netlify.app",
  BACKEND_URL: "https://smart-travel-backend-7mzh.onrender.com",
  API_BASE_URL: "https://smart-travel-backend-7mzh.onrender.com/api",
  SOCKET_URL: "https://smart-travel-backend-7mzh.onrender.com",
  GOOGLE_AUTH_URL: "https://smart-travel-backend-7mzh.onrender.com/auth/google",
}

// ✅ DEVELOPMENT URLs (Local development)
const DEVELOPMENT_CONFIG = {
  FRONTEND_URL: "http://localhost:5173",
  BACKEND_URL: "http://localhost:3000",
  API_BASE_URL: "http://localhost:3000/api",
  SOCKET_URL: "http://localhost:3000",
  GOOGLE_AUTH_URL: "http://localhost:3000/auth/google",
}

// ✅ CURRENT CONFIGURATION based on environment
const CURRENT_CONFIG = isProduction ? PRODUCTION_CONFIG : DEVELOPMENT_CONFIG

// ✅ EXPORTED CONSTANTS
export const API_BASE_URL = CURRENT_CONFIG.API_BASE_URL
export const SOCKET_URL = CURRENT_CONFIG.SOCKET_URL
export const GOOGLE_AUTH_URL = CURRENT_CONFIG.GOOGLE_AUTH_URL

// ✅ UPDATED: Stream Chat Configuration with your actual credentials
export const STREAM_API_KEY = "69sdct4v7bn2"
export const STREAM_BASE_URL = "https://chat.stream-io-api.com"
export const STREAM_TOKEN_ENDPOINT = `${CURRENT_CONFIG.API_BASE_URL}/chat/stream-token`

// ✅ NETWORK SUPPORT FUNCTIONS (Updated for production)
export const getNetworkApiUrl = () => {
  if (isProduction) {
    return PRODUCTION_CONFIG.API_BASE_URL
  }

  const hostname = window.location.hostname
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return DEVELOPMENT_CONFIG.API_BASE_URL
  } else {
    // Use the same hostname as the frontend for API calls in local network
    return `http://${hostname}:3000/api`
  }
}

export const getNetworkSocketUrl = () => {
  if (isProduction) {
    return PRODUCTION_CONFIG.SOCKET_URL
  }

  const hostname = window.location.hostname
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return DEVELOPMENT_CONFIG.SOCKET_URL
  } else {
    // Use the same hostname as the frontend for socket connection in local network
    return `http://${hostname}:3000`
  }
}

export const getStreamTokenUrl = () => {
  if (isProduction) {
    return `${PRODUCTION_CONFIG.API_BASE_URL}/chat/stream-token`
  }

  const hostname = window.location.hostname
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `${DEVELOPMENT_CONFIG.API_BASE_URL}/chat/stream-token`
  } else {
    return `http://${hostname}:3000/api/chat/stream-token`
  }
}

// ✅ ENVIRONMENT INFO (for debugging)
export const ENV_INFO = {
  isProduction,
  isDevelopment,
  hostname: window.location.hostname,
  currentConfig: CURRENT_CONFIG,
}

// ✅ LOG CURRENT CONFIGURATION (for debugging)
console.log("🌍 Environment:", isProduction ? "PRODUCTION" : "DEVELOPMENT")
console.log("🔗 API Base URL:", API_BASE_URL)
console.log("🔌 Socket URL:", SOCKET_URL)
console.log("🔐 Google Auth URL:", GOOGLE_AUTH_URL)

// ✅ PRESERVED: Your original app config
export const APP_CONFIG = {
  name: "Smart Journey",
  description: "AI-Powered Travel Planning",
  version: "1.0.0",
}

// ✅ PRESERVED: Your original routes
export const ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  TRIP_PLANNER: "/trip-planner",
  SOCIAL_TRAVEL: "/social-travel",
  CHAT: "/chat",
  AUTH_SUCCESS: "/auth-success",
}

// ✅ PRESERVED: Your original chat configuration
export const CHAT_CONFIG = {
  MAX_MESSAGE_LENGTH: 1000,
  TYPING_TIMEOUT: 2000,
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 1000,
}

// ✅ PRESERVED: WebRTC configuration for calling system
export const WEBRTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
  iceCandidatePoolSize: 10,
}

// ✅ PRESERVED: Call configuration
export const CALL_CONFIG = {
  CALL_TIMEOUT: 30000, // 30 seconds
  RING_TIMEOUT: 60000, // 1 minute
  MAX_CALL_DURATION: 3600000, // 1 hour
  AUDIO_CONSTRAINTS: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 44100,
  },
  VIDEO_CONSTRAINTS: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  },
}

// ✅ PRESERVED: Call event types
export const CALL_EVENTS = {
  CALL_USER: "call-user",
  INCOMING_CALL: "incoming-call",
  ANSWER_CALL: "answer-call",
  REJECT_CALL: "reject-call",
  CALL_ENDED: "call-ended",
  USER_DISCONNECTED: "user-disconnected",
  SENDING_SIGNAL: "sending-signal",
  RETURNING_SIGNAL: "returning-signal",
  RECEIVING_SIGNAL: "receiving-signal",
  RECEIVING_RETURNED_SIGNAL: "receiving-returned-signal",
}

// ✅ PRESERVED: Stream Chat specific constants
export const STREAM_CHANNELS = {
  SOCIAL: "social-travel",
  USER_PREFIX: "user:",
  ROOM_PREFIX: "messaging:",
  GLOBAL: "global-updates",
}

export const STREAM_EVENTS = {
  // Connection events
  CONNECTION_REQUEST: "connection.request",
  CONNECTION_ACCEPTED: "connection.accepted",
  CONNECTION_REJECTED: "connection.rejected",
  CONNECTION_READY: "connection.ready",
  CONNECTION_DISCONNECTED: "connection.disconnected",

  // Chat events (Stream handles these automatically)
  MESSAGE_NEW: "message.new",
  MESSAGE_UPDATED: "message.updated",
  MESSAGE_DELETED: "message.deleted",
  TYPING_START: "typing.start",
  TYPING_STOP: "typing.stop",

  // Call events
  INCOMING_CALL: "call.incoming",
  CALL_ACCEPTED: "call.accepted",
  CALL_REJECTED: "call.rejected",
  CALL_ENDED: "call.ended",

  // Status events
  USER_PRESENCE_CHANGED: "user.presence.changed",
  USER_UPDATED: "user.updated",
}

// ✅ PRESERVED: Additional configuration for enhanced functionality
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
export const SUPPORTED_FILE_TYPES = [...SUPPORTED_IMAGE_TYPES, "application/pdf", "text/plain"]

export const NOTIFICATION_DURATION = 4000 // 4 seconds
export const MAX_NOTIFICATIONS = 5

export const DEFAULT_LOCATION_RADIUS = 50 // km
export const LOCATION_UPDATE_INTERVAL = 300000 // 5 minutes

export const THEME_STORAGE_KEY = "social-travel-theme"
export const DEFAULT_THEME = "dark"

export const CONNECTION_LOCK_DURATION = 3600000 // 1 hour

// ✅ PRESERVED: Message types for enhanced chat
export const MESSAGE_TYPES = {
  TEXT: "text",
  IMAGE: "image",
  FILE: "file",
  SYSTEM: "system",
  CALL_START: "call_start",
  CALL_END: "call_end",
  CONNECTION_REQUEST: "connection_request",
  CONNECTION_ACCEPTED: "connection_accepted",
}

// ✅ PRESERVED: Connection status types
export const CONNECTION_STATUS = {
  NONE: "none",
  PENDING: "pending",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTING: "disconnecting",
  FAILED: "failed",
}

// ✅ PRESERVED: User status types
export const USER_STATUS = {
  ONLINE: "online",
  OFFLINE: "offline",
  AWAY: "away",
  BUSY: "busy",
}

// ✅ PRESERVED: Stream Chat channel types
export const CHANNEL_TYPES = {
  MESSAGING: "messaging", // 1-on-1 chats
  TEAM: "team", // Group chats
  SOCIAL: "livestream", // Social updates
  SUPPORT: "support", // Support channels
}

// ✅ UPDATED: Stream Chat Configuration with your actual credentials
export const STREAM_CHAT_API_KEY = "69sdct4v7bn2"
export const STREAM_CHAT_TOKEN_ENDPOINT = `${CURRENT_CONFIG.API_BASE_URL}/chat/stream-token`

// ✅ PRESERVED: Stream Chat event types
export const STREAM_CHAT_EVENTS = {
  MESSAGE_NEW: "message.new",
  MESSAGE_UPDATED: "message.updated",
  MESSAGE_DELETED: "message.deleted",
  TYPING_START: "typing.start",
  TYPING_STOP: "typing.stop",
  USER_PRESENCE_CHANGED: "user.presence.changed",
  USER_UPDATED: "user.updated",
  USER_WATCHING_START: "user_watching.start",
  USER_WATCHING_STOP: "user_watching.stop",
  CONNECTION_CHANGED: "connection.changed",
  CONNECTION_RECOVERED: "connection.recovered",
  NOTIFICATION_MESSAGE_NEW: "notification.message_new",
  NOTIFICATION_ADDED_TO_CHANNEL: "notification.added_to_channel",
  NOTIFICATION_REMOVED_FROM_CHANNEL: "notification.removed_from_channel",
}

// ✅ NEW: Enhanced error handling for Stream Chat
export const ERROR_TYPES = {
  NETWORK_ERROR: "NETWORK_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  PERMISSION_ERROR: "PERMISSION_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  STREAM_ERROR: "STREAM_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
}

// ✅ NEW: Error messages for better user experience
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network connection failed. Please check your internet connection.",
  AUTHENTICATION_ERROR: "Authentication failed. Please log in again.",
  PERMISSION_ERROR: "You don't have permission to perform this action.",
  VALIDATION_ERROR: "Invalid data provided. Please check your input.",
  STREAM_ERROR: "Chat service error. Please try again.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
  CONNECTION_TIMEOUT: "Connection timeout. Please try again.",
  MESSAGE_SEND_FAILED: "Failed to send message. Please try again.",
  CHANNEL_JOIN_FAILED: "Failed to join chat. Please try again.",
  TOKEN_EXPIRED: "Session expired. Please log in again.",
}

// ✅ NEW: Stream Chat Configuration object
export const STREAM_CONFIG = {
  API_KEY: STREAM_CHAT_API_KEY,
  BASE_URL: STREAM_BASE_URL,
  TIMEOUT: 15000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
}

// ✅ NEW: Enhanced chat configuration for Stream Chat
export const ENHANCED_CHAT_CONFIG = {
  ...CHAT_CONFIG,
  MESSAGE_PAGINATION_LIMIT: 50,
  CHANNEL_WATCH_TIMEOUT: 10000,
  CONNECTION_TIMEOUT: 15000,
  TYPING_INDICATOR_TIMEOUT: 3000,
  MESSAGE_RETRY_ATTEMPTS: 3,
  CHANNEL_RETRY_ATTEMPTS: 3,
}

// ✅ NEW: Mini chat window configuration
export const MINI_CHAT_CONFIG = {
  DEFAULT_WIDTH: 350,
  DEFAULT_HEIGHT: 500,
  MIN_WIDTH: 300,
  MIN_HEIGHT: 400,
  MAX_WIDTH: 500,
  MAX_HEIGHT: 700,
  ANIMATION_DURATION: 300,
  AUTO_HIDE_DELAY: 5000,
}

// ✅ NEW: Notification configuration
export const NOTIFICATION_CONFIG = {
  DURATION: NOTIFICATION_DURATION,
  MAX_NOTIFICATIONS: MAX_NOTIFICATIONS,
  POSITION: "bottom-right",
  SOUND_ENABLED: true,
  DESKTOP_NOTIFICATIONS: true,
}

// ✅ NEW: File upload configuration
export const FILE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE,
  SUPPORTED_IMAGE_TYPES,
  SUPPORTED_FILE_TYPES,
  UPLOAD_TIMEOUT: 30000,
  CHUNK_SIZE: 1024 * 1024, // 1MB chunks
}
