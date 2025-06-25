// AgoraRTCService.js - Only for Audio/Video calls (Fixed)
import AgoraRTC from "agora-rtc-sdk-ng"

const APP_ID = "575ee05e13944b2fa1611a6088081542"

class AgoraRTCService {
  constructor() {
    this.client = null
    this.localTracks = {
      audio: null,
      video: null,
    }
    this.remoteTracks = new Map()
    this.isJoined = false
    this.currentChannel = null
    this.currentUserId = null
  }

  // Initialize RTC client
  async initialize() {
    try {
      if (!this.client) {
        console.log("🚀 Initializing Agora RTC client...")

        this.client = AgoraRTC.createClient({
          mode: "rtc",
          codec: "vp8",
        })

        this.setupEventListeners()
        console.log("✅ Agora RTC client initialized")
      }

      return this.client
    } catch (error) {
      console.error("❌ Failed to initialize Agora RTC:", error)
      throw error
    }
  }

  // Setup event listeners
  setupEventListeners() {
    if (!this.client) return

    console.log("🔧 Setting up RTC event listeners...")

    // User joined
    this.client.on("user-joined", async (user) => {
      console.log("👤 User joined RTC:", user.uid)
    })

    // User published
    this.client.on("user-published", async (user, mediaType) => {
      console.log(`📡 User published ${mediaType}:`, user.uid)

      await this.client.subscribe(user, mediaType)

      if (mediaType === "video") {
        const remoteVideoTrack = user.videoTrack
        this.remoteTracks.set(`${user.uid}_video`, remoteVideoTrack)

        // Play remote video
        const playerContainer = document.getElementById(`player-${user.uid}`)
        if (playerContainer) {
          remoteVideoTrack.play(playerContainer)
        }
      }

      if (mediaType === "audio") {
        const remoteAudioTrack = user.audioTrack
        this.remoteTracks.set(`${user.uid}_audio`, remoteAudioTrack)
        remoteAudioTrack.play()
      }
    })

    // User unpublished
    this.client.on("user-unpublished", (user, mediaType) => {
      console.log(`📡 User unpublished ${mediaType}:`, user.uid)

      if (mediaType === "video") {
        this.remoteTracks.delete(`${user.uid}_video`)
      }
      if (mediaType === "audio") {
        this.remoteTracks.delete(`${user.uid}_audio`)
      }
    })

    // User left
    this.client.on("user-left", (user) => {
      console.log("👤 User left RTC:", user.uid)
      this.remoteTracks.delete(`${user.uid}_video`)
      this.remoteTracks.delete(`${user.uid}_audio`)
    })

    console.log("✅ RTC event listeners set up")
  }

  // Join RTC channel
  async joinChannel(channelName, userId, token = null) {
    try {
      if (!this.client) {
        await this.initialize()
      }

      if (this.isJoined) {
        await this.leaveChannel()
      }

      console.log(`📡 Joining RTC channel: ${channelName}`)

      await this.client.join(APP_ID, channelName, token, userId)

      this.isJoined = true
      this.currentChannel = channelName
      this.currentUserId = userId

      console.log(`✅ Joined RTC channel: ${channelName}`)
    } catch (error) {
      console.error("❌ Failed to join RTC channel:", error)
      throw error
    }
  }

  // Start audio call
  async startAudioCall() {
    try {
      console.log("🎤 Starting audio call...")

      // Create audio track
      this.localTracks.audio = await AgoraRTC.createMicrophoneAudioTrack()

      // Publish audio track
      await this.client.publish([this.localTracks.audio])

      console.log("✅ Audio call started")
      return { audio: this.localTracks.audio }
    } catch (error) {
      console.error("❌ Failed to start audio call:", error)
      throw error
    }
  }

  // Start video call
  async startVideoCall() {
    try {
      console.log("📹 Starting video call...")

      // Create audio and video tracks
      this.localTracks.audio = await AgoraRTC.createMicrophoneAudioTrack()
      this.localTracks.video = await AgoraRTC.createCameraVideoTrack()

      // Publish tracks
      await this.client.publish([this.localTracks.audio, this.localTracks.video])

      console.log("✅ Video call started")
      return {
        audio: this.localTracks.audio,
        video: this.localTracks.video,
      }
    } catch (error) {
      console.error("❌ Failed to start video call:", error)
      throw error
    }
  }

  // Mute/unmute audio
  async toggleAudio() {
    if (this.localTracks.audio) {
      await this.localTracks.audio.setMuted(!this.localTracks.audio.muted)
      return !this.localTracks.audio.muted
    }
    return false
  }

  // Mute/unmute video
  async toggleVideo() {
    if (this.localTracks.video) {
      await this.localTracks.video.setMuted(!this.localTracks.video.muted)
      return !this.localTracks.video.muted
    }
    return false
  }

  // Leave channel
  async leaveChannel() {
    try {
      if (!this.isJoined) return

      console.log("📡 Leaving RTC channel...")

      // Stop and close local tracks
      if (this.localTracks.audio) {
        this.localTracks.audio.stop()
        this.localTracks.audio.close()
        this.localTracks.audio = null
      }

      if (this.localTracks.video) {
        this.localTracks.video.stop()
        this.localTracks.video.close()
        this.localTracks.video = null
      }

      // Clear remote tracks
      this.remoteTracks.clear()

      // Leave channel
      await this.client.leave()

      this.isJoined = false
      this.currentChannel = null
      this.currentUserId = null

      console.log("✅ Left RTC channel")
    } catch (error) {
      console.error("❌ Failed to leave RTC channel:", error)
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isJoined: this.isJoined,
      currentChannel: this.currentChannel,
      currentUserId: this.currentUserId,
      hasAudio: !!this.localTracks.audio,
      hasVideo: !!this.localTracks.video,
    }
  }

  // Cleanup
  async destroy() {
    try {
      console.log("🧹 Destroying RTC service...")
      await this.leaveChannel()

      if (this.client) {
        this.client.removeAllListeners()
        this.client = null
      }

      console.log("✅ RTC service destroyed")
    } catch (error) {
      console.error("❌ RTC service destruction failed:", error)
    }
  }
}

// Export singleton instance
export default new AgoraRTCService()
