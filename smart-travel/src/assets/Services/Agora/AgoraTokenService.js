// AgoraTokenService.js - Generate Agora tokens
import { API_BASE_URL } from "../../Utils/Constants"

class AgoraTokenService {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  // Generate RTC token for audio/video calls
  async generateRTCToken(channelName, userId, role = "publisher") {
    try {
      console.log(`🎫 Generating RTC token for channel: ${channelName}, user: ${userId}`)

      const response = await fetch(`${this.baseURL}/api/agora/rtc-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          channelName,
          userId: userId.toString(),
          role,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.token) {
        console.log("✅ RTC token generated successfully")
        return data.token
      } else {
        throw new Error(data.message || "Failed to generate RTC token")
      }
    } catch (error) {
      console.error("❌ Failed to generate RTC token:", error)

      // ✅ FALLBACK: Return null for development (works without token in some cases)
      console.warn("⚠️ Using null token for development - this may cause issues in production")
      return null
    }
  }

  // Generate RTM token for messaging (optional)
  async generateRTMToken(userId) {
    try {
      console.log(`🎫 Generating RTM token for user: ${userId}`)

      const response = await fetch(`${this.baseURL}/api/agora/rtm-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          userId: userId.toString(),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.token) {
        console.log("✅ RTM token generated successfully")
        return data.token
      } else {
        throw new Error(data.message || "Failed to generate RTM token")
      }
    } catch (error) {
      console.error("❌ Failed to generate RTM token:", error)

      // ✅ FALLBACK: Return null for development
      console.warn("⚠️ Using null token for development")
      return null
    }
  }

  // Get token info
  async getTokenInfo(token) {
    try {
      const response = await fetch(`${this.baseURL}/api/agora/token-info`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("❌ Failed to get token info:", error)
      return null
    }
  }
}

// Export singleton instance
export default new AgoraTokenService()
