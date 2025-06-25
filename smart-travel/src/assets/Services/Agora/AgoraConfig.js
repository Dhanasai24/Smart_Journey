// AgoraConfig.js - Fixed channel name generation for consistent connections
// ✅ Agora Configuration - Replace with your actual credentials
export const AGORA_CONFIG = {
  // 🔥 IMPORTANT: Replace with your actual Agora App ID from console
  APP_ID: "575ee05e13944b2fa1611a6088081542", // Your actual App ID

  // Token settings
  TOKEN_EXPIRATION_TIME: 24 * 3600, // 24 hours

  // RTM Configuration
  RTM_CONFIG: {
    enableLogUpload: false,
    logFilter: "INFO",
  },

  // RTC Configuration for calls
  RTC_CONFIG: {
    mode: "rtc",
    codec: "vp8",
    enableAudioVolumeIndicator: true,
  },

  // Video settings
  VIDEO_PROFILE: {
    width: 640,
    height: 480,
    frameRate: 15,
    bitrate: 500,
  },

  // Audio settings
  AUDIO_PROFILE: "music_standard",
}

// Generate unique channel name for chat between two users
export const generateChannelName = (userId1, userId2) => {
  const sortedIds = [userId1, userId2].sort()
  return `chat_${sortedIds[0]}_${sortedIds[1]}`
}

// ✅ FIXED: Add the missing generateCallChannelName function
export const generateCallChannelName = (userId1, userId2, type = "call") => {
  const sortedIds = [userId1, userId2].sort()
  const timestamp = Date.now()
  return `${type}_${sortedIds[0]}_${sortedIds[1]}_${timestamp}`
}

// ✅ NEW: Generate room-based channel name (more reliable)
export const generateRoomChannelName = (roomId) => {
  return `room_${roomId}`
}

// ✅ NEW: Generate direct chat channel name
export const generateDirectChatChannel = (currentUserId, otherUserId) => {
  const sortedIds = [Number.parseInt(currentUserId), Number.parseInt(otherUserId)].sort((a, b) => a - b)
  return `direct_${sortedIds[0]}_${sortedIds[1]}`
}

export default AGORA_CONFIG
