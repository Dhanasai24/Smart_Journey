// AgoraRTMService.js - Using npm package instead of CDN
import AgoraRTM from "agora-rtm-sdk"

const APP_ID = "575ee05e13944b2fa1611a6088081542"

class AgoraRTMService {
  constructor() {
    this.client = null
    this.channel = null
    this.userId = null
    this.isLoggedIn = false
    this.isChannelJoined = false
    this.isInitialized = false

    // Event handlers
    this.messageHandlers = []
    this.connectionHandlers = []
    this.memberHandlers = []
  }

  // Initialize RTM client
  async initialize() {
    try {
      if (!this.isInitialized) {
        console.log("🚀 Initializing Agora RTM with npm package...")
        this.isInitialized = true
      }

      if (!this.client) {
        // Create RTM client using the npm package
        this.client = AgoraRTM.createInstance(APP_ID)

        if (!this.client) {
          throw new Error("Failed to create RTM client instance")
        }

        this.setupEventListeners()
        console.log("✅ Agora RTM client initialized successfully")
      }

      return this.client
    } catch (error) {
      console.error("❌ Failed to initialize Agora RTM:", error)
      this.isInitialized = false
      throw error
    }
  }

  // Setup event listeners
  setupEventListeners() {
    if (!this.client) return

    console.log("🔧 Setting up RTM event listeners...")

    // Connection state changes
    this.client.on("ConnectionStateChanged", (newState, reason) => {
      console.log(`🔄 RTM Connection state changed: ${newState}, reason: ${reason}`)
      this.connectionHandlers.forEach((handler) => {
        try {
          handler({ state: newState, reason })
        } catch (error) {
          console.error("Error in connection handler:", error)
        }
      })
    })

    // Message from peer
    this.client.on("MessageFromPeer", (message, peerId) => {
      console.log(`💬 Message from peer ${peerId}:`, message.text)
      this.messageHandlers.forEach((handler) => {
        try {
          handler({
            text: message.text,
            senderId: peerId,
            timestamp: Date.now(),
            type: "peer",
          })
        } catch (error) {
          console.error("Error in message handler:", error)
        }
      })
    })

    // Peer online/offline status
    this.client.on("PeersOnlineStatusChanged", (peersStatus) => {
      console.log("👥 Peers status changed:", peersStatus)
      Object.entries(peersStatus).forEach(([peerId, isOnline]) => {
        this.connectionHandlers.forEach((handler) => {
          try {
            handler({ type: "peer_status", peerId, isOnline })
          } catch (error) {
            console.error("Error in peer status handler:", error)
          }
        })
      })
    })

    console.log("✅ RTM event listeners set up successfully")
  }

  // Login to RTM
  async login(userId, token = null) {
    try {
      if (!this.client) {
        await this.initialize()
      }

      if (this.isLoggedIn && this.userId === userId.toString()) {
        console.log("✅ Already logged in as", userId)
        return
      }

      console.log(`🔑 Logging in with userId: ${userId}, token: ${token ? "provided" : "null"}`)

      // Convert userId to string as required by Agora
      const userIdString = userId.toString()

      await this.client.login({ uid: userIdString, token })
      this.userId = userIdString
      this.isLoggedIn = true

      console.log(`✅ RTM login successful for user: ${userIdString}`)
    } catch (error) {
      console.error("❌ RTM login failed:", error)
      this.isLoggedIn = false
      this.userId = null
      throw error
    }
  }

  // Logout from RTM
  async logout() {
    try {
      if (this.client && this.isLoggedIn) {
        await this.leaveChannel()
        await this.client.logout()
        this.isLoggedIn = false
        this.userId = null
        console.log("✅ RTM logout successful")
      }
    } catch (error) {
      console.error("❌ RTM logout failed:", error)
    }
  }

  // Join channel
  async joinChannel(channelName) {
    try {
      if (!this.isLoggedIn) {
        throw new Error("Must login before joining channel")
      }

      if (this.channel && this.isChannelJoined) {
        await this.leaveChannel()
      }

      console.log(`📡 Joining RTM channel: ${channelName}`)

      this.channel = this.client.createChannel(channelName)
      this.setupChannelEventListeners()

      await this.channel.join()
      this.isChannelJoined = true

      console.log(`✅ Joined RTM channel: ${channelName}`)
    } catch (error) {
      console.error("❌ Failed to join RTM channel:", error)
      this.isChannelJoined = false
      throw error
    }
  }

  // Setup channel event listeners
  setupChannelEventListeners() {
    if (!this.channel) return

    console.log("🔧 Setting up channel event listeners...")

    // Channel message
    this.channel.on("ChannelMessage", (message, memberId) => {
      console.log(`💬 Channel message from ${memberId}:`, message.text)
      this.messageHandlers.forEach((handler) => {
        try {
          handler({
            text: message.text,
            senderId: memberId,
            timestamp: Date.now(),
            type: "channel",
          })
        } catch (error) {
          console.error("Error in channel message handler:", error)
        }
      })
    })

    // Member joined
    this.channel.on("MemberJoined", (memberId) => {
      console.log(`👤 Member joined: ${memberId}`)
      this.memberHandlers.forEach((handler) => {
        try {
          handler({ type: "joined", memberId })
        } catch (error) {
          console.error("Error in member joined handler:", error)
        }
      })
    })

    // Member left
    this.channel.on("MemberLeft", (memberId) => {
      console.log(`👤 Member left: ${memberId}`)
      this.memberHandlers.forEach((handler) => {
        try {
          handler({ type: "left", memberId })
        } catch (error) {
          console.error("Error in member left handler:", error)
        }
      })
    })

    console.log("✅ Channel event listeners set up successfully")
  }

  // Leave channel
  async leaveChannel() {
    try {
      if (this.channel && this.isChannelJoined) {
        await this.channel.leave()
        this.channel = null
        this.isChannelJoined = false
        console.log("✅ Left RTM channel")
      }
    } catch (error) {
      console.error("❌ Failed to leave RTM channel:", error)
    }
  }

  // Send channel message
  async sendChannelMessage(text) {
    try {
      if (!this.channel || !this.isChannelJoined) {
        throw new Error("Must join channel before sending messages")
      }

      if (!text || text.trim().length === 0) {
        throw new Error("Message text cannot be empty")
      }

      const message = { text: text.trim(), type: "TEXT" }
      await this.channel.sendMessage(message)

      console.log("✅ Channel message sent:", text)

      return {
        text: text.trim(),
        senderId: this.userId,
        timestamp: Date.now(),
        type: "channel",
      }
    } catch (error) {
      console.error("❌ Failed to send channel message:", error)
      throw error
    }
  }

  // Send peer message
  async sendPeerMessage(peerId, text) {
    try {
      if (!this.isLoggedIn) {
        throw new Error("Must login before sending peer messages")
      }

      if (!text || text.trim().length === 0) {
        throw new Error("Message text cannot be empty")
      }

      const message = { text: text.trim(), type: "TEXT" }
      await this.client.sendMessageToPeer(message, peerId.toString())

      console.log(`✅ Peer message sent to ${peerId}:`, text)

      return {
        text: text.trim(),
        senderId: this.userId,
        timestamp: Date.now(),
        type: "peer",
      }
    } catch (error) {
      console.error("❌ Failed to send peer message:", error)
      throw error
    }
  }

  // Event handler registration
  onMessage(handler) {
    if (typeof handler !== "function") {
      throw new Error("Message handler must be a function")
    }
    this.messageHandlers.push(handler)
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler)
    }
  }

  onConnection(handler) {
    if (typeof handler !== "function") {
      throw new Error("Connection handler must be a function")
    }
    this.connectionHandlers.push(handler)
    return () => {
      this.connectionHandlers = this.connectionHandlers.filter((h) => h !== handler)
    }
  }

  onMember(handler) {
    if (typeof handler !== "function") {
      throw new Error("Member handler must be a function")
    }
    this.memberHandlers.push(handler)
    return () => {
      this.memberHandlers = this.memberHandlers.filter((h) => h !== handler)
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isInitialized: this.isInitialized,
      isLoggedIn: this.isLoggedIn,
      isChannelJoined: this.isChannelJoined,
      userId: this.userId,
      hasClient: !!this.client,
      hasChannel: !!this.channel,
    }
  }

  // Cleanup
  async destroy() {
    try {
      console.log("🧹 Destroying RTM service...")

      await this.logout()

      if (this.client) {
        this.client.removeAllListeners()
        this.client = null
      }

      this.messageHandlers = []
      this.connectionHandlers = []
      this.memberHandlers = []
      this.isInitialized = false

      console.log("✅ RTM service destroyed successfully")
    } catch (error) {
      console.error("❌ RTM service destruction failed:", error)
    }
  }
}

// Export singleton instance
export default new AgoraRTMService()
