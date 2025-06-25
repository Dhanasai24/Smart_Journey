import { StreamChat } from "stream-chat"

class StreamChatService {
  constructor() {
    this.client = null
    this.currentUser = null
    this.currentChannel = null
    this.isConnected = false
    this.connectionPromise = null
    this.retryCount = 0
    this.maxRetries = 3

    // Event handlers
    this.messageHandlers = []
    this.connectionHandlers = []
    this.typingHandlers = []
    this.userStatusHandlers = []
    this.callHandlers = []
    this.errorHandlers = []

    // Channel subscriptions for real-time updates
    this.subscribedChannels = new Map()
    this.globalChannel = null

    // Error tracking
    this.lastError = null
    this.errorCount = 0
    this.criticalErrors = new Set(["reserved field", "invalid token", "unauthorized"])

    // Configuration - will be set dynamically
    this.apiKey = null
    this.baseURL = "https://chat.stream-io-api.com"
  }

  // Enhanced error handling
  handleError(error, context = "Unknown") {
    console.error(`❌ StreamChatService Error in ${context}:`, error)

    const errorMessage = error.message || error.toString()

    // Check if this is a critical error that should stop retries
    const isCriticalError = Array.from(this.criticalErrors).some((criticalError) =>
      errorMessage.toLowerCase().includes(criticalError),
    )

    this.lastError = {
      message: errorMessage,
      context,
      timestamp: new Date().toISOString(),
      isCritical: isCriticalError,
    }

    this.errorCount++
    this.notifyErrorHandlers(this.lastError)

    return this.lastError
  }

  // ✅ GENERALIZED: Wait for connection to be ready for any user
  async waitForConnection(timeout = 10000) {
    if (this.isConnected && this.client && this.client.user) {
      return true
    }

    if (this.connectionPromise) {
      try {
        await Promise.race([
          this.connectionPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error("Connection timeout")), timeout)),
        ])
        return this.isConnected && this.client && this.client.user
      } catch (error) {
        console.warn("⚠️ Connection wait timeout:", error)
        return false
      }
    }

    return false
  }

  // ✅ GENERALIZED: Ensure client is ready for operations for any user
  async ensureClientReady() {
    if (!this.client) {
      throw new Error("StreamChat client not initialized")
    }

    if (!this.isConnected) {
      throw new Error("StreamChat not connected")
    }

    if (!this.client.user) {
      throw new Error("StreamChat user not authenticated")
    }

    return true
  }

  async initialize(userId, userName, token, apiKey = "69sdct4v7bn2") {
    try {
      if (this.client && this.isConnected && this.currentUser === userId.toString()) {
        console.log("✅ Stream Chat already connected for user:", userId)
        return Promise.resolve(this.client)
      }

      if (this.connectionPromise) {
        console.log("🔄 Stream Chat connection already in progress...")
        return this.connectionPromise
      }

      console.log("🚀 Initializing Stream Chat connection for user:", userId)

      // Validate inputs
      if (!userId || !token) {
        throw new Error("User ID and token are required")
      }

      // Set API key dynamically
      this.apiKey = apiKey

      // Create a new connection promise with timeout
      this.connectionPromise = new Promise(async (resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error("Connection timeout"))
        }, 15000)

        try {
          // Initialize Stream Chat client with dynamic API key
          this.client = StreamChat.getInstance(this.apiKey, {
            baseURL: this.baseURL,
            timeout: 15000,
          })

          // Create user object with ONLY allowed fields
          const userObject = {
            id: userId.toString(),
            name: userName || `User ${userId}`,
            image: `https://getstream.io/random_png/?id=${userId}&name=${encodeURIComponent(userName || userId)}`,
          }

          console.log("🔗 Connecting user to Stream Chat:", userObject)

          await this.client.connectUser(userObject, token)

          this.currentUser = userId.toString()
          this.isConnected = true
          this.connectionPromise = null
          this.retryCount = 0

          console.log("✅ Stream Chat connected successfully for user:", userId)

          // Setup event listeners
          this.setupEventListeners()

          // Subscribe to global notifications channel
          await this.subscribeToGlobalChannel()

          // Notify connection handlers
          this.notifyConnectionHandlers({
            type: "connected",
            userId: this.currentUser,
            timestamp: new Date().toISOString(),
          })

          clearTimeout(timeoutId)
          resolve(this.client)
        } catch (error) {
          clearTimeout(timeoutId)
          this.isConnected = false
          this.connectionPromise = null

          const errorInfo = this.handleError(error, "initialize")
          this.notifyConnectionHandlers({
            type: "error",
            error: errorInfo,
            timestamp: new Date().toISOString(),
          })

          reject(error)
        }
      })

      return this.connectionPromise
    } catch (error) {
      this.connectionPromise = null
      this.handleError(error, "initialize")
      throw error
    }
  }

  // ✅ GENERALIZED: Subscribe to global notifications for any user
  async subscribeToGlobalChannel() {
    try {
      if (!this.client || !this.isConnected) return

      const globalChannelId = `global_notifications_${this.currentUser}`
      console.log(`📡 Subscribing to global channel: ${globalChannelId}`)

      this.globalChannel = this.client.channel("messaging", globalChannelId, {
        members: [this.currentUser],
        name: "Global Notifications",
        created_by_id: this.currentUser,
      })

      await this.globalChannel.create()
      await this.globalChannel.watch()

      console.log(`✅ Subscribed to global channel: ${globalChannelId}`)

      // Discover and watch existing channels
      await this.discoverAndWatchChannels()
    } catch (error) {
      console.warn("⚠️ Failed to subscribe to global channel:", error)
    }
  }

  // ✅ GENERALIZED: Discover channels for any user
  async discoverAndWatchChannels() {
    try {
      if (!this.client || !this.isConnected) return

      console.log(`🔍 Discovering channels for user ${this.currentUser}`)

      // Query channels where this user is a member
      const filter = {
        type: "messaging",
        members: { $in: [this.currentUser] },
      }

      const sort = { last_message_at: -1, created_at: -1 }
      const options = {
        state: true,
        watch: true,
        presence: true,
        limit: 100,
      }

      const channels = await this.client.queryChannels(filter, sort, options)

      console.log(`📡 Found ${channels.length} channels to watch for user ${this.currentUser}`)

      // Process channels in batches to avoid overwhelming the system
      const batchSize = 10
      for (let i = 0; i < channels.length; i += batchSize) {
        const batch = channels.slice(i, i + batchSize)

        await Promise.all(
          batch.map(async (channel) => {
            try {
              if (!channel.initialized) {
                await channel.watch()
              }

              this.subscribedChannels.set(channel.id, channel)
              console.log(`✅ Now watching channel: ${channel.id}`)
            } catch (channelError) {
              console.warn(`⚠️ Failed to watch channel ${channel.id}:`, channelError)
            }
          }),
        )
      }

      console.log(`✅ Successfully watching ${this.subscribedChannels.size} channels`)
    } catch (error) {
      console.warn("⚠️ Failed to discover channels:", error)
    }
  }

  setupEventListeners() {
    if (!this.client) {
      console.warn("⚠️ Cannot setup event listeners: client not initialized")
      return
    }

    try {
      console.log("🎧 Setting up Stream Chat event listeners")

      // ✅ GENERALIZED: Listen for new messages across ALL channels for any user
      this.client.on("message.new", (event) => {
        try {
          console.log(`💬 New message received by user ${this.currentUser}:`, event)

          if (!event.message || !event.user) {
            console.warn("⚠️ Invalid message event received")
            return
          }

          // Skip messages from current user to avoid self-processing
          if (event.user.id === this.currentUser) {
            console.log(`⚠️ Skipping own message from user ${this.currentUser}`)
            return
          }

          // Handle system notifications for channel refresh - UNIVERSAL
          if (event.message.refresh_channels === true) {
            console.log("🔄 Received channel refresh notification")
            setTimeout(() => {
              this.discoverAndWatchChannels()
            }, 1000)
            return
          }

          const message = {
            id: event.message.id,
            text: event.message.text || "",
            senderId: event.user.id,
            senderName: event.user.name || event.user.id,
            timestamp: new Date(event.created_at || event.message.created_at).getTime(),
            roomId: event.channel_id || event.cid,
            isOwn: false, // Since we already filtered out own messages
            type: event.message.type || "text",
            attachments: event.message.attachments || [],
            // Connection-related fields
            isConnectionRequest: event.message.connection_request === true,
            connectionAccepted: event.message.connection_accepted === true,
            connectionRejected: event.message.connection_rejected === true,
            fromUserId: event.message.fromUserId || event.user.id,
            fromUserName: event.message.fromUserName || event.user.name,
            fromUserAvatar: event.message.fromUserAvatar,
            toUserId: event.message.toUserId,
            tripId: event.message.tripId,
          }

          // ✅ GENERALIZED: Handle connection request messages for ANY user combination
          if (message.isConnectionRequest) {
            console.log(`🔔 User ${this.currentUser} processing connection request from ${message.fromUserId}`)

            // Check if this message is intended for current user
            const channelId = event.channel_id || event.cid
            const isForCurrentUser =
              channelId.includes(`_${this.currentUser}_`) ||
              channelId.includes(`_${this.currentUser}`) ||
              channelId.endsWith(`_${this.currentUser}`) ||
              message.toUserId === this.currentUser

            if (isForCurrentUser) {
              const roomId = message.roomId.replace("messaging:", "")

              this.notifyConnectionHandlers({
                type: "connection-request",
                fromUserId: message.fromUserId,
                fromUserName: message.fromUserName || message.senderName,
                fromUserAvatar: message.fromUserAvatar,
                roomId: roomId,
                tripId: message.tripId,
                message: message.text,
                timestamp: new Date().toISOString(),
              })
              return
            } else {
              console.log(`⚠️ Connection request not for user ${this.currentUser}, ignoring`)
              return
            }
          }

          // ✅ GENERALIZED: Handle connection accepted messages for ANY user
          if (message.connectionAccepted) {
            console.log(`✅ User ${this.currentUser} received connection acceptance from ${message.senderId}`)

            const roomId = message.roomId.replace("messaging:", "")

            this.notifyConnectionHandlers({
              type: "connection-accepted",
              fromUserId: message.senderId,
              fromUserName: message.senderName,
              roomId: roomId,
              timestamp: new Date().toISOString(),
              connectionUpdate: {
                userId: message.senderId,
                status: "connected",
                roomId: roomId,
              },
            })
            return
          }

          // ✅ GENERALIZED: Handle connection rejected messages for ANY user
          if (message.connectionRejected) {
            console.log("❌ Processing connection rejected:", message)
            this.notifyConnectionHandlers({
              type: "connection-rejected",
              fromUserId: message.senderId,
              fromUserName: message.senderName,
              roomId: message.roomId.replace("messaging:", ""),
              timestamp: new Date().toISOString(),
            })
            return
          }

          // Handle regular messages (not connection-related)
          if (!message.isConnectionRequest && !message.connectionAccepted && !message.connectionRejected) {
            this.notifyMessageHandlers(message)
          }
        } catch (error) {
          this.handleError(error, "message.new event")
        }
      })

      // Listen for typing indicators
      this.client.on("typing.start", (event) => {
        try {
          if (event.user && event.user.id !== this.currentUser) {
            this.notifyTypingHandlers({
              type: "typing",
              userId: event.user.id,
              userName: event.user.name,
              roomId: event.channel_id || event.cid,
              timestamp: new Date().toISOString(),
            })
          }
        } catch (error) {
          this.handleError(error, "typing.start event")
        }
      })

      this.client.on("typing.stop", (event) => {
        try {
          if (event.user && event.user.id !== this.currentUser) {
            this.notifyTypingHandlers({
              type: "stopped_typing",
              userId: event.user.id,
              userName: event.user.name,
              roomId: event.channel_id || event.cid,
              timestamp: new Date().toISOString(),
            })
          }
        } catch (error) {
          this.handleError(error, "typing.stop event")
        }
      })

      // Listen for user presence changes
      this.client.on("user.presence.changed", (event) => {
        try {
          if (event.user) {
            this.notifyUserStatusHandlers({
              type: event.user.online ? "online" : "offline",
              userId: event.user.id,
              userName: event.user.name,
              timestamp: new Date().toISOString(),
            })
          }
        } catch (error) {
          this.handleError(error, "user.presence.changed event")
        }
      })

      // Listen for connection changes
      this.client.on("connection.changed", (event) => {
        try {
          console.log("🔌 Connection changed:", event)
          this.isConnected = event.online || false
          this.notifyConnectionHandlers({
            type: event.online ? "connected" : "disconnected",
            timestamp: new Date().toISOString(),
          })
        } catch (error) {
          this.handleError(error, "connection.changed event")
        }
      })

      // Listen for connection recovery
      this.client.on("connection.recovered", () => {
        try {
          console.log("🔄 Connection recovered")
          this.isConnected = true
          this.retryCount = 0
          this.notifyConnectionHandlers({
            type: "recovered",
            timestamp: new Date().toISOString(),
          })
        } catch (error) {
          this.handleError(error, "connection.recovered event")
        }
      })

      console.log("✅ Stream Chat event listeners setup complete")
    } catch (error) {
      this.handleError(error, "setupEventListeners")
    }
  }

  async createChannel(channelId, otherUserId, otherUserName) {
    try {
      await this.ensureClientReady()

      if (!channelId || !otherUserId) {
        throw new Error("Channel ID and other user ID are required")
      }

      console.log(`📡 Creating/joining channel: ${channelId} with user: ${otherUserId}`)

      const channel = this.client.channel("messaging", channelId, {
        members: [this.currentUser, otherUserId.toString()],
        name: `Chat with ${otherUserName || otherUserId}`,
        created_by_id: this.currentUser,
      })

      await channel.watch()
      this.subscribedChannels.set(channelId, channel)
      this.currentChannel = channel

      console.log(`✅ Successfully joined channel: ${channelId}`)
      return channel
    } catch (error) {
      this.handleError(error, "createChannel")
      throw error
    }
  }

  async leaveChannel(channelId) {
    try {
      if (!this.client || !this.isConnected) {
        console.log(`ℹ️ Cannot leave channel ${channelId}: client not connected`)
        return
      }

      console.log(`📡 Leaving channel: ${channelId}`)

      const channel = this.subscribedChannels.get(channelId)

      if (channel && typeof channel.stopWatching === "function") {
        try {
          await channel.stopWatching()
        } catch (stopWatchError) {
          console.warn(`⚠️ Error stopping watch for channel ${channelId}:`, stopWatchError)
        }
      }

      this.subscribedChannels.delete(channelId)

      if (this.currentChannel && this.currentChannel.id === channelId) {
        this.currentChannel = null
      }

      console.log(`✅ Left channel: ${channelId}`)
    } catch (error) {
      console.warn(`⚠️ Error leaving channel ${channelId}:`, error)
      this.subscribedChannels.delete(channelId)
      if (this.currentChannel && this.currentChannel.id === channelId) {
        this.currentChannel = null
      }
    }
  }

  async sendMessage(channelId, message, messageType = "regular") {
    try {
      await this.ensureClientReady()

      if (!message || !message.trim()) {
        throw new Error("Message cannot be empty")
      }

      if (message.length > 1000) {
        throw new Error("Message too long. Maximum 1000 characters allowed.")
      }

      console.log(`📤 Sending message to channel ${channelId}:`, message)

      const channel = this.subscribedChannels.get(channelId) || this.client.channel("messaging", channelId)

      const messageData = {
        text: message.trim(),
        type: messageType === "system" ? "regular" : messageType,
        user_id: this.currentUser,
      }

      const response = await channel.sendMessage(messageData)

      if (!response || !response.message) {
        throw new Error("Invalid response from Stream Chat")
      }

      console.log(`✅ Message sent successfully to channel: ${channelId}`)

      return {
        id: response.message.id,
        text: response.message.text,
        senderId: this.currentUser,
        timestamp: new Date(response.message.created_at).getTime(),
        isOwn: true,
        type: messageType,
      }
    } catch (error) {
      this.handleError(error, "sendMessage")
      throw error
    }
  }

  async sendTypingStart(channelId) {
    try {
      if (!this.client || !this.isConnected) return

      const channel = this.subscribedChannels.get(channelId) || this.client.channel("messaging", channelId)
      await channel.keystroke()
    } catch (error) {
      this.handleError(error, "sendTypingStart")
    }
  }

  async sendTypingStop(channelId) {
    try {
      if (!this.client || !this.isConnected) return

      const channel = this.subscribedChannels.get(channelId) || this.client.channel("messaging", channelId)
      await channel.stopTyping()
    } catch (error) {
      this.handleError(error, "sendTypingStop")
    }
  }

  // ✅ GENERALIZED: Send connection request between ANY two users
  async sendConnectionRequest(toUserId, fromUserName, fromUserAvatar, roomId, tripId, message) {
    try {
      await this.ensureClientReady()

      if (!toUserId || !roomId) {
        throw new Error("Target user ID and room ID are required")
      }

      console.log(`🔔 User ${this.currentUser} sending connection request to user ${toUserId} via room ${roomId}`)

      // ✅ GENERALIZED: Create consistent room ID format for ANY user pair
      const channelId = roomId.startsWith("room_")
        ? roomId
        : `room_${Math.min(Number.parseInt(this.currentUser), Number.parseInt(toUserId))}_${Math.max(Number.parseInt(this.currentUser), Number.parseInt(toUserId))}`

      // Create the main channel for communication with both users as members
      const channel = this.client.channel("messaging", channelId, {
        members: [this.currentUser, toUserId.toString()],
        connection_request: true,
        tripId,
        created_by_id: this.currentUser,
        name: `Connection Request: ${fromUserName} → User ${toUserId}`,
        connection_request_from: this.currentUser,
        connection_request_to: toUserId.toString(),
      })

      await channel.create()
      await channel.watch()
      this.subscribedChannels.set(channelId, channel)

      console.log(`✅ Channel created and watched: ${channelId}`)

      // Send connection request message with all required fields
      const requestMessage = {
        text: message || `🔗 ${fromUserName || "Someone"} wants to connect with you!`,
        type: "regular",
        connection_request: true,
        fromUserId: this.currentUser,
        fromUserName: fromUserName || "Anonymous",
        fromUserAvatar: fromUserAvatar || null,
        toUserId: toUserId.toString(),
        tripId,
        roomId: channelId,
        timestamp: new Date().toISOString(),
      }

      console.log(`📤 Sending connection request message:`, requestMessage)

      const messageResponse = await channel.sendMessage(requestMessage)
      console.log(`✅ Connection request sent successfully:`, messageResponse)

      // ✅ GENERALIZED: Notify recipient to refresh channels for ANY user
      try {
        await this.notifyUserToRefreshChannels(toUserId)
      } catch (notifyError) {
        console.warn("⚠️ Failed to notify recipient to refresh channels:", notifyError)
      }
    } catch (error) {
      this.handleError(error, "sendConnectionRequest")
      throw error
    }
  }

  // ✅ GENERALIZED: Notify any user to refresh their channel list
  async notifyUserToRefreshChannels(userId) {
    try {
      const notificationChannelId = `global_notifications_${userId}`
      const notificationChannel = this.client.channel("messaging", notificationChannelId)

      await notificationChannel.sendMessage({
        text: "refresh_channels",
        type: "regular",
        system_notification: true,
        refresh_channels: true,
      })

      console.log(`📨 Sent channel refresh notification to user ${userId}`)
    } catch (error) {
      console.warn(`⚠️ Failed to send refresh notification to user ${userId}:`, error)
    }
  }

  async acceptConnectionRequest(fromUserId, roomId) {
    try {
      await this.ensureClientReady()

      console.log(`✅ User ${this.currentUser} accepting connection request from user ${fromUserId}`)

      // ✅ GENERALIZED: Ensure consistent channel ID format for ANY user pair
      const channelId = roomId.startsWith("room_")
        ? roomId
        : `room_${Math.min(Number.parseInt(fromUserId), Number.parseInt(this.currentUser))}_${Math.max(Number.parseInt(fromUserId), Number.parseInt(this.currentUser))}`

      const channel = this.subscribedChannels.get(channelId) || this.client.channel("messaging", channelId)

      await channel.watch()
      this.subscribedChannels.set(channelId, channel)

      // Send acceptance message with proper fields
      await channel.sendMessage({
        text: `✅ ${this.client.user?.name || `User ${this.currentUser}`} accepted your connection request! You can now chat.`,
        type: "regular",
        connection_accepted: true,
        timestamp: new Date().toISOString(),
        acceptedBy: this.currentUser,
        acceptedByName: this.client.user?.name || `User ${this.currentUser}`,
        roomId: channelId,
        fromUserId: this.currentUser,
        toUserId: fromUserId,
      })

      console.log(`✅ Connection accepted for user ${fromUserId}`)
    } catch (error) {
      this.handleError(error, "acceptConnectionRequest")
      throw error
    }
  }

  async rejectConnectionRequest(fromUserId, roomId) {
    try {
      await this.ensureClientReady()

      console.log(`❌ User ${this.currentUser} rejecting connection request from user ${fromUserId}`)

      const channel = this.subscribedChannels.get(roomId) || this.client.channel("messaging", roomId)

      await channel.sendMessage({
        text: "❌ Connection request was declined",
        type: "regular",
        connection_rejected: true,
        timestamp: new Date().toISOString(),
      })

      console.log(`✅ Connection rejected for user ${fromUserId}`)
    } catch (error) {
      this.handleError(error, "rejectConnectionRequest")
      throw error
    }
  }

  // ✅ GENERALIZED: Disconnect from any user
  async disconnectFromUser(toUserId) {
    try {
      await this.ensureClientReady()

      console.log(`🔌 User ${this.currentUser} disconnecting from user ${toUserId}`)

      const filter = {
        type: "messaging",
        members: { $in: [toUserId.toString()] },
      }

      const channels = await this.client.queryChannels(
        filter,
        {},
        {
          watch: false,
          state: true,
          limit: 10,
        },
      )

      for (const channel of channels) {
        try {
          await channel.sendMessage({
            text: "🔌 User disconnected",
            type: "regular",
            connection_disconnected: true,
            timestamp: new Date().toISOString(),
          })

          await channel.stopWatching()
          this.subscribedChannels.delete(channel.id)
        } catch (channelError) {
          console.warn(`⚠️ Failed to update channel ${channel.id}:`, channelError)
        }
      }

      console.log(`✅ Disconnected from user ${toUserId}`)
    } catch (error) {
      this.handleError(error, "disconnectFromUser")
      throw error
    }
  }

  async updateStatus(status) {
    try {
      if (!this.client || !this.isConnected) return

      await this.client.partialUpdateUser({
        id: this.currentUser,
        set: {
          status,
        },
      })

      console.log(`✅ Status updated to: ${status}`)
    } catch (error) {
      this.handleError(error, "updateStatus")
    }
  }

  // Event handler registration
  onMessage(handler) {
    if (typeof handler !== "function") return () => {}
    this.messageHandlers.push(handler)
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler)
    }
  }

  onConnection(handler) {
    if (typeof handler !== "function") return () => {}
    this.connectionHandlers.push(handler)
    return () => {
      this.connectionHandlers = this.connectionHandlers.filter((h) => h !== handler)
    }
  }

  onTyping(handler) {
    if (typeof handler !== "function") return () => {}
    this.typingHandlers.push(handler)
    return () => {
      this.typingHandlers = this.typingHandlers.filter((h) => h !== handler)
    }
  }

  onUserStatus(handler) {
    if (typeof handler !== "function") return () => {}
    this.userStatusHandlers.push(handler)
    return () => {
      this.userStatusHandlers = this.userStatusHandlers.filter((h) => h !== handler)
    }
  }

  onCall(handler) {
    if (typeof handler !== "function") return () => {}
    this.callHandlers.push(handler)
    return () => {
      this.callHandlers = this.callHandlers.filter((h) => h !== handler)
    }
  }

  onError(handler) {
    if (typeof handler !== "function") return () => {}
    this.errorHandlers.push(handler)
    return () => {
      this.errorHandlers = this.errorHandlers.filter((h) => h !== handler)
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

  notifyTypingHandlers(data) {
    this.typingHandlers.forEach((handler) => {
      try {
        handler(data)
      } catch (error) {
        console.error("Error in typing handler:", error)
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

  notifyCallHandlers(data) {
    this.callHandlers.forEach((handler) => {
      try {
        handler(data)
      } catch (error) {
        console.error("Error in call handler:", error)
      }
    })
  }

  notifyErrorHandlers(data) {
    this.errorHandlers.forEach((handler) => {
      try {
        handler(data)
      } catch (error) {
        console.error("Error in error handler:", error)
      }
    })
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      currentUser: this.currentUser,
      currentChannel: this.currentChannel?.id,
      subscribedChannels: Array.from(this.subscribedChannels.keys()),
      lastError: this.lastError,
      errorCount: this.errorCount,
      retryCount: this.retryCount,
    }
  }

  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        console.log("🧹 Disconnecting Stream Chat...")

        const channelCleanupPromises = []

        for (const [channelId, channel] of this.subscribedChannels) {
          try {
            if (channel && typeof channel.stopWatching === "function") {
              channelCleanupPromises.push(
                channel.stopWatching().catch((error) => {
                  console.warn(`⚠️ Failed to stop watching channel ${channelId}:`, error)
                }),
              )
            }
          } catch (error) {
            console.warn(`⚠️ Error preparing to stop watching channel ${channelId}:`, error)
          }
        }

        if (this.globalChannel && typeof this.globalChannel.stopWatching === "function") {
          try {
            channelCleanupPromises.push(
              this.globalChannel.stopWatching().catch((error) => {
                console.warn("⚠️ Failed to stop watching global channel:", error)
              }),
            )
          } catch (error) {
            console.warn("⚠️ Error preparing to stop watching global channel:", error)
          }
        }

        try {
          await Promise.race([Promise.all(channelCleanupPromises), new Promise((resolve) => setTimeout(resolve, 2000))])
        } catch (error) {
          console.warn("⚠️ Channel cleanup timeout or error:", error)
        }

        this.subscribedChannels.clear()
        this.currentChannel = null
        this.globalChannel = null

        try {
          await this.client.disconnectUser()
          console.log("✅ Stream Chat client disconnected successfully")
        } catch (disconnectError) {
          console.warn("⚠️ Error during client disconnect:", disconnectError)
        }

        this.client = null
        this.isConnected = false
        this.currentUser = null
        this.connectionPromise = null
        this.retryCount = 0

        console.log("✅ Stream Chat disconnected successfully")
      } else {
        console.log("ℹ️ Stream Chat already disconnected or not initialized")
      }
    } catch (error) {
      console.warn("⚠️ Error during Stream Chat disconnect:", error)

      this.client = null
      this.isConnected = false
      this.currentUser = null
      this.connectionPromise = null
      this.subscribedChannels.clear()
      this.currentChannel = null
      this.globalChannel = null
    }
  }

  destroy() {
    try {
      this.disconnect()
      this.messageHandlers = []
      this.connectionHandlers = []
      this.typingHandlers = []
      this.userStatusHandlers = []
      this.callHandlers = []
      this.errorHandlers = []
      this.lastError = null
      this.errorCount = 0
      console.log("✅ StreamChatService destroyed")
    } catch (error) {
      console.error("Error destroying StreamChatService:", error)
    }
  }
}

export default new StreamChatService()
