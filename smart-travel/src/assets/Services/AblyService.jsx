import { Realtime } from "ably"
import { getAblyTokenUrl } from "../Utils/Constants"

class AblyService {
  constructor() {
    this.client = null
    this.isConnected = false
    this.currentUserId = null
    this.channels = new Map()
    this.connectionPromise = null

    // Event handlers
    this.messageHandlers = []
    this.connectionHandlers = []
    this.userStatusHandlers = []
    this.typingHandlers = []
    this.callHandlers = []
    this.presenceHandlers = []

    // Connection state
    this.connectionState = "disconnected"
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
  }

  // Initialize Ably connection with token authentication
  async initialize(userId, token) {
    try {
      if (this.client && this.isConnected) {
        console.log("✅ Ably already connected")
        return Promise.resolve(this.client)
      }

      if (this.connectionPromise) {
        console.log("🔄 Ably connection already in progress...")
        return this.connectionPromise
      }

      console.log("🚀 Initializing Ably connection for user:", userId)

      this.connectionPromise = new Promise((resolve, reject) => {
        // Initialize Ably client with token authentication
        this.client = new Realtime({
          authUrl: getAblyTokenUrl(),
          authMethod: "POST",
          authHeaders: {
            "Content-Type": "application/json",
          },
          authParams: {
            clientId: `user_${userId}`,
          },
          clientId: `user_${userId}`,
          autoConnect: true,
          recover: true,
          disconnectedRetryTimeout: 5000,
          suspendedRetryTimeout: 10000,
          closeOnUnload: true,
          queueMessages: true,
        })

        this.currentUserId = userId

        // Setup connection event handlers
        this.client.connection.on("connected", () => {
          console.log("✅ Ably connected:", this.client.connection.id)
          this.isConnected = true
          this.connectionState = "connected"
          this.reconnectAttempts = 0
          this.connectionPromise = null
          this.setupChannels()
          this.notifyConnectionHandlers({
            type: "connected",
            connectionId: this.client.connection.id,
            clientId: this.client.clientId,
          })
          resolve(this.client)
        })

        this.client.connection.on("connecting", () => {
          console.log("🔄 Ably connecting...")
          this.connectionState = "connecting"
          this.notifyConnectionHandlers({ type: "connecting" })
        })

        this.client.connection.on("disconnected", () => {
          console.log("❌ Ably disconnected")
          this.isConnected = false
          this.connectionState = "disconnected"
          this.notifyConnectionHandlers({ type: "disconnected" })
        })

        this.client.connection.on("failed", (error) => {
          console.error("❌ Ably connection failed:", error)
          this.isConnected = false
          this.connectionState = "failed"
          this.connectionPromise = null
          this.notifyConnectionHandlers({ type: "error", error: error.message })
          reject(error)
        })

        this.client.connection.on("suspended", () => {
          console.log("⚠️ Ably connection suspended")
          this.isConnected = false
          this.connectionState = "suspended"
          this.notifyConnectionHandlers({ type: "suspended" })
        })

        this.client.connection.on("closed", () => {
          console.log("🔒 Ably connection closed")
          this.isConnected = false
          this.connectionState = "closed"
          this.notifyConnectionHandlers({ type: "closed" })
        })

        // Timeout fallback
        setTimeout(() => {
          if (!this.isConnected && this.connectionState !== "connected") {
            console.error("❌ Ably connection timeout")
            this.connectionPromise = null
            reject(new Error("Connection timeout"))
          }
        }, 15000)
      })

      return this.connectionPromise
    } catch (error) {
      console.error("❌ Failed to initialize Ably:", error)
      this.connectionPromise = null
      throw error
    }
  }

  // Setup channels for different types of communication
  setupChannels() {
    if (!this.client || !this.isConnected) return

    console.log("🔧 Setting up Ably channels...")

    try {
      // User-specific channel for direct communications
      const userChannel = this.client.channels.get(`user:${this.currentUserId}`)
      this.channels.set("user", userChannel)

      // Global social channel for general updates
      const socialChannel = this.client.channels.get("social-travel")
      this.channels.set("social", socialChannel)

      // Setup channel event listeners
      this.setupChannelListeners()

      // Enter presence on user channel
      userChannel.presence.enter({
        userId: this.currentUserId,
        status: "online",
        timestamp: Date.now(),
      })

      console.log("✅ Ably channels set up successfully")
    } catch (error) {
      console.error("❌ Error setting up Ably channels:", error)
    }
  }

  // Setup event listeners for all channels
  setupChannelListeners() {
    const userChannel = this.channels.get("user")
    const socialChannel = this.channels.get("social")

    if (userChannel) {
      // Connection requests
      userChannel.subscribe("connection-request", (message) => {
        console.log("🔔 Received connection request:", message.data)
        this.notifyConnectionHandlers({ type: "connection-request", ...message.data })
      })

      // Connection responses
      userChannel.subscribe("connection-accepted", (message) => {
        console.log("✅ Connection accepted:", message.data)
        this.notifyConnectionHandlers({ type: "connection-accepted", ...message.data })
      })

      userChannel.subscribe("connection-rejected", (message) => {
        console.log("❌ Connection rejected:", message.data)
        this.notifyConnectionHandlers({ type: "connection-rejected", ...message.data })
      })

      userChannel.subscribe("connection-ready", (message) => {
        console.log("🚀 Connection ready:", message.data)
        this.notifyConnectionHandlers({ type: "connection-ready", ...message.data })
      })

      userChannel.subscribe("connection-disconnected", (message) => {
        console.log("🔌 User disconnected:", message.data)
        this.notifyConnectionHandlers({ type: "connection-disconnected", ...message.data })
      })

      // Chat messages
      userChannel.subscribe("chat-message", (message) => {
        console.log("💬 Received message:", message.data)
        this.notifyMessageHandlers({
          id: message.data.id,
          text: message.data.message,
          senderId: message.data.senderId,
          senderName: message.data.senderName,
          timestamp: message.data.timestamp,
          roomId: message.data.roomId,
          isOwn: message.data.senderId === this.currentUserId,
        })
      })

      // Typing indicators
      userChannel.subscribe("typing-start", (message) => {
        console.log("⌨️ User started typing:", message.data)
        this.notifyTypingHandlers({ type: "typing", ...message.data })
      })

      userChannel.subscribe("typing-stop", (message) => {
        console.log("⌨️ User stopped typing:", message.data)
        this.notifyTypingHandlers({ type: "stopped_typing", ...message.data })
      })

      // Call events
      userChannel.subscribe("incoming-call", (message) => {
        console.log("📞 Incoming call:", message.data)
        this.notifyCallHandlers({ type: "incoming_call", ...message.data })
      })

      userChannel.subscribe("call-accepted", (message) => {
        console.log("✅ Call accepted:", message.data)
        this.notifyCallHandlers({ type: "call_accepted", ...message.data })
      })

      userChannel.subscribe("call-rejected", (message) => {
        console.log("❌ Call rejected:", message.data)
        this.notifyCallHandlers({ type: "call_rejected", ...message.data })
      })

      userChannel.subscribe("call-ended", (message) => {
        console.log("📞 Call ended:", message.data)
        this.notifyCallHandlers({ type: "call_ended", ...message.data })
      })

      // UI refresh triggers
      userChannel.subscribe("ui-refresh", (message) => {
        console.log("🔄 UI refresh:", message.data)
        this.notifyConnectionHandlers({ type: "ui-refresh", ...message.data })
      })

      // Message notifications
      userChannel.subscribe("message-notification", (message) => {
        console.log("🔔 Message notification:", message.data)
        this.notifyConnectionHandlers({ type: "message-notification", ...message.data })
      })
    }

    if (socialChannel) {
      // Global social updates
      socialChannel.subscribe("traveler-online", (message) => {
        console.log("🟢 Traveler online:", message.data)
        this.notifyUserStatusHandlers({ type: "online", ...message.data })
      })

      socialChannel.subscribe("traveler-offline", (message) => {
        console.log("⚪ Traveler offline:", message.data)
        this.notifyUserStatusHandlers({ type: "offline", ...message.data })
      })
    }

    console.log("✅ Ably channel listeners set up successfully")
  }

  // Wait for connection
  async waitForConnection(timeout = 10000) {
    if (this.isConnected) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Connection timeout"))
      }, timeout)

      const checkConnection = () => {
        if (this.isConnected) {
          clearTimeout(timeoutId)
          resolve()
        } else {
          setTimeout(checkConnection, 100)
        }
      }

      checkConnection()
    })
  }

  // Join a chat room
  async joinRoom(roomId, otherUserId) {
    try {
      await this.waitForConnection()

      if (!this.client || !this.isConnected) {
        throw new Error("Ably not connected")
      }

      console.log(`📡 Joining room: ${roomId} with user: ${otherUserId}`)

      // Subscribe to room-specific channel
      const roomChannel = this.client.channels.get(`room:${roomId}`)
      this.channels.set(`room:${roomId}`, roomChannel)

      // Listen for messages in this room
      roomChannel.subscribe("message", (message) => {
        console.log(`💬 Room ${roomId} message:`, message.data)
        this.notifyMessageHandlers({
          id: message.data.id,
          text: message.data.message,
          senderId: message.data.senderId,
          senderName: message.data.senderName,
          timestamp: message.data.timestamp,
          roomId: roomId,
          isOwn: message.data.senderId === this.currentUserId,
        })
      })

      // Listen for typing indicators in this room
      roomChannel.subscribe("typing", (message) => {
        if (message.data.userId !== this.currentUserId) {
          this.notifyTypingHandlers({ type: "typing", roomId, ...message.data })
        }
      })

      roomChannel.subscribe("typing-stop", (message) => {
        if (message.data.userId !== this.currentUserId) {
          this.notifyTypingHandlers({ type: "stopped_typing", roomId, ...message.data })
        }
      })

      // Announce joining
      await roomChannel.publish("user-joined", {
        userId: this.currentUserId,
        roomId,
        otherUserId,
        timestamp: Date.now(),
      })

      console.log(`✅ Successfully joined room: ${roomId}`)
      return Promise.resolve()
    } catch (error) {
      console.error("❌ Failed to join room:", error)
      throw error
    }
  }

  // Leave a room
  async leaveRoom(roomId) {
    try {
      const roomChannel = this.channels.get(`room:${roomId}`)
      if (roomChannel) {
        await roomChannel.publish("user-left", {
          userId: this.currentUserId,
          roomId,
          timestamp: Date.now(),
        })

        roomChannel.unsubscribe()
        this.channels.delete(`room:${roomId}`)
        console.log(`📡 Left room: ${roomId}`)
      }
    } catch (error) {
      console.error("❌ Failed to leave room:", error)
    }
  }

  // Send message to a room
  async sendMessage(roomId, message, otherUserId) {
    try {
      await this.waitForConnection()

      if (!this.client || !this.isConnected) {
        throw new Error("Ably not connected")
      }

      if (!message.trim()) {
        throw new Error("Message cannot be empty")
      }

      console.log(`📤 Sending message to room ${roomId}:`, message)

      const roomChannel = this.channels.get(`room:${roomId}`)
      if (!roomChannel) {
        throw new Error("Room channel not found. Join the room first.")
      }

      const messageData = {
        id: Date.now() + Math.random(),
        message: message.trim(),
        senderId: this.currentUserId,
        senderName: "You", // This should come from user context
        timestamp: Date.now(),
        roomId,
      }

      await roomChannel.publish("message", messageData)

      console.log(`✅ Message sent successfully to room: ${roomId}`)

      return {
        id: messageData.id,
        text: messageData.message,
        senderId: this.currentUserId,
        timestamp: messageData.timestamp,
        isOwn: true,
      }
    } catch (error) {
      console.error("❌ Failed to send message:", error)
      throw error
    }
  }

  // Send typing indicator
  async sendTyping(roomId, otherUserId, isTyping = true) {
    try {
      await this.waitForConnection()

      if (!this.client || !this.isConnected) return

      const roomChannel = this.channels.get(`room:${roomId}`)
      if (roomChannel) {
        await roomChannel.publish(isTyping ? "typing" : "typing-stop", {
          userId: this.currentUserId,
          roomId,
          otherUserId,
          timestamp: Date.now(),
        })
      }
    } catch (error) {
      console.error("❌ Failed to send typing indicator:", error)
    }
  }

  // Send connection request
  async sendConnectionRequest(toUserId, fromUserName, fromUserAvatar, roomId, tripId, message) {
    try {
      await this.waitForConnection()

      if (!this.client || !this.isConnected) {
        throw new Error("Ably not connected")
      }

      const targetChannel = this.client.channels.get(`user:${toUserId}`)

      await targetChannel.publish("connection-request", {
        fromUserId: this.currentUserId,
        fromUserName,
        fromUserAvatar,
        toUserId,
        roomId,
        tripId,
        message,
        timestamp: new Date().toISOString(),
      })

      console.log(`🔔 Connection request sent to user ${toUserId}`)
    } catch (error) {
      console.error("❌ Failed to send connection request:", error)
      throw error
    }
  }

  // Accept connection request
  async acceptConnectionRequest(fromUserId, roomId) {
    try {
      await this.waitForConnection()

      const targetChannel = this.client.channels.get(`user:${fromUserId}`)

      await targetChannel.publish("connection-accepted", {
        fromUserId: this.currentUserId,
        toUserId: fromUserId,
        roomId,
        timestamp: new Date().toISOString(),
        connectionUpdate: {
          userId: this.currentUserId,
          status: "connected",
          roomId,
        },
      })

      // Also send connection-ready event
      await targetChannel.publish("connection-ready", {
        roomId,
        otherUserId: this.currentUserId,
        status: "connected",
        connectionUpdate: {
          userId: this.currentUserId,
          status: "connected",
          roomId,
        },
      })

      console.log(`✅ Connection accepted for user ${fromUserId}`)
    } catch (error) {
      console.error("❌ Failed to accept connection:", error)
      throw error
    }
  }

  // Reject connection request
  async rejectConnectionRequest(fromUserId, roomId) {
    try {
      await this.waitForConnection()

      const targetChannel = this.client.channels.get(`user:${fromUserId}`)

      await targetChannel.publish("connection-rejected", {
        fromUserId: this.currentUserId,
        toUserId: fromUserId,
        roomId,
        timestamp: new Date().toISOString(),
      })

      console.log(`❌ Connection rejected for user ${fromUserId}`)
    } catch (error) {
      console.error("❌ Failed to reject connection:", error)
      throw error
    }
  }

  // Disconnect from user
  async disconnectFromUser(toUserId) {
    try {
      await this.waitForConnection()

      const targetChannel = this.client.channels.get(`user:${toUserId}`)

      await targetChannel.publish("connection-disconnected", {
        fromUserId: this.currentUserId,
        toUserId,
        timestamp: new Date().toISOString(),
      })

      console.log(`🔌 Disconnected from user ${toUserId}`)
    } catch (error) {
      console.error("❌ Failed to disconnect from user:", error)
      throw error
    }
  }

  // Start call
  async startCall(otherUserId, callType, channelName) {
    try {
      await this.waitForConnection()

      const targetChannel = this.client.channels.get(`user:${otherUserId}`)

      await targetChannel.publish("incoming-call", {
        callType,
        channelName,
        callerId: this.currentUserId,
        callerName: "You", // Should come from user context
        timestamp: Date.now(),
      })

      console.log(`📞 Started ${callType} call with user ${otherUserId}`)
    } catch (error) {
      console.error("❌ Failed to start call:", error)
      throw error
    }
  }

  // End call
  async endCall(otherUserId, channelName) {
    try {
      await this.waitForConnection()

      const targetChannel = this.client.channels.get(`user:${otherUserId}`)

      await targetChannel.publish("call-ended", {
        callerId: this.currentUserId,
        channelName,
        timestamp: Date.now(),
      })

      console.log(`📞 Ended call with user ${otherUserId}`)
    } catch (error) {
      console.error("❌ Failed to end call:", error)
    }
  }

  // Update user status
  async updateStatus(status) {
    try {
      await this.waitForConnection()

      const socialChannel = this.channels.get("social")
      if (socialChannel) {
        await socialChannel.publish(`traveler-${status}`, {
          userId: this.currentUserId,
          status,
          timestamp: Date.now(),
        })
      }
    } catch (error) {
      console.error("❌ Failed to update status:", error)
    }
  }

  // Event handler registration
  onMessage(handler) {
    this.messageHandlers.push(handler)
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler)
    }
  }

  onConnection(handler) {
    this.connectionHandlers.push(handler)
    return () => {
      this.connectionHandlers = this.connectionHandlers.filter((h) => h !== handler)
    }
  }

  onUserStatus(handler) {
    this.userStatusHandlers.push(handler)
    return () => {
      this.userStatusHandlers = this.userStatusHandlers.filter((h) => h !== handler)
    }
  }

  onTyping(handler) {
    this.typingHandlers.push(handler)
    return () => {
      this.typingHandlers = this.typingHandlers.filter((h) => h !== handler)
    }
  }

  onCall(handler) {
    this.callHandlers.push(handler)
    return () => {
      this.callHandlers = this.callHandlers.filter((h) => h !== handler)
    }
  }

  onPresence(handler) {
    this.presenceHandlers.push(handler)
    return () => {
      this.presenceHandlers = this.presenceHandlers.filter((h) => h !== handler)
    }
  }

  // Notify handlers
  notifyMessageHandlers(data) {
    this.messageHandlers.forEach((handler) => {
      try {
        handler(data)
      } catch (error) {
        console.error("Error in message handler:", error)
      }
    })
  }

  notifyConnectionHandlers(data) {
    this.connectionHandlers.forEach((handler) => {
      try {
        handler(data)
      } catch (error) {
        console.error("Error in connection handler:", error)
      }
    })
  }

  notifyUserStatusHandlers(data) {
    this.userStatusHandlers.forEach((handler) => {
      try {
        handler(data)
      } catch (error) {
        console.error("Error in user status handler:", error)
      }
    })
  }

  notifyTypingHandlers(data) {
    this.typingHandlers.forEach((handler) => {
      try {
        handler(data)
      } catch (error) {
        console.error("Error in typing handler:", error)
      }
    })
  }

  notifyCallHandlers(data) {
    this.callHandlers.forEach((handler) => {
      try {
        handler(data)
      } catch (error) {
        console.error("Error in call handler:", error)
      }
    })
  }

  notifyPresenceHandlers(data) {
    this.presenceHandlers.forEach((handler) => {
      try {
        handler(data)
      } catch (error) {
        console.error("Error in presence handler:", error)
      }
    })
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      connectionId: this.client?.connection?.id,
      currentUserId: this.currentUserId,
      state: this.client?.connection?.state,
      connectionState: this.connectionState,
    }
  }

  // Get channel info
  getChannelInfo(channelName) {
    const channel = this.channels.get(channelName)
    if (channel) {
      return {
        name: channelName,
        state: channel.state,
        presence: channel.presence,
      }
    }
    return null
  }

  // Disconnect
  disconnect() {
    if (this.client) {
      console.log("🧹 Disconnecting Ably...")

      // Leave presence on all channels
      this.channels.forEach((channel, key) => {
        channel.unsubscribe()
      })
      this.channels.clear()

      this.client.close()
      this.client = null
      this.isConnected = false
      this.currentUserId = null
      this.connectionPromise = null
      this.connectionState = "disconnected"
    }
  }

  // Cleanup
  destroy() {
    this.disconnect()
    this.messageHandlers = []
    this.connectionHandlers = []
    this.userStatusHandlers = []
    this.typingHandlers = []
    this.callHandlers = []
    this.presenceHandlers = []
    console.log("✅ AblyService destroyed")
  }
}

// Export singleton instance
export default new AblyService()
