// SocketChatService.js - Real-time chat using Socket.IO
import io from "socket.io-client"
import { SOCKET_URL } from "../Utils/Constants"

class SocketChatService {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.currentUserId = null
    this.currentRoomId = null
    this.connectionPromise = null

    // Event handlers
    this.messageHandlers = []
    this.connectionHandlers = []
    this.userStatusHandlers = []
    this.typingHandlers = []
  }

  // Initialize socket connection
  initialize(userId, token) {
    try {
      if (this.socket && this.isConnected) {
        console.log("✅ Socket already connected")
        return Promise.resolve(this.socket)
      }

      if (this.connectionPromise) {
        console.log("🔄 Connection already in progress...")
        return this.connectionPromise
      }

      console.log("🚀 Initializing Socket.IO connection...")

      this.connectionPromise = new Promise((resolve, reject) => {
        // Create socket connection with correct URL
        this.socket = io(SOCKET_URL, {
          auth: {
            token: token || localStorage.getItem("token"),
            userId: userId,
          },
          transports: ["websocket", "polling"],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          forceNew: true,
        })

        this.currentUserId = userId

        // Setup connection handlers
        this.socket.on("connect", () => {
          console.log("✅ Socket.IO connected:", this.socket.id)
          this.isConnected = true
          this.connectionPromise = null
          this.notifyConnectionHandlers({ type: "connected", socketId: this.socket.id })
          resolve(this.socket)
        })

        this.socket.on("connect_error", (error) => {
          console.error("❌ Socket.IO connection error:", error)
          this.isConnected = false
          this.connectionPromise = null
          this.notifyConnectionHandlers({ type: "error", error: error.message })
          reject(error)
        })

        this.socket.on("disconnect", (reason) => {
          console.log("❌ Socket.IO disconnected:", reason)
          this.isConnected = false
          this.notifyConnectionHandlers({ type: "disconnected", reason })
        })

        this.setupEventListeners()

        // Timeout fallback
        setTimeout(() => {
          if (!this.isConnected) {
            console.error("❌ Socket.IO connection timeout")
            this.connectionPromise = null
            reject(new Error("Connection timeout"))
          }
        }, 15000)
      })

      return this.connectionPromise
    } catch (error) {
      console.error("❌ Failed to initialize Socket.IO:", error)
      this.connectionPromise = null
      throw error
    }
  }

  // Setup socket event listeners
  setupEventListeners() {
    if (!this.socket) return

    console.log("🔧 Setting up Socket.IO event listeners...")

    // Chat events
    this.socket.on("new_message", (messageData) => {
      console.log("💬 Received message:", messageData)
      this.notifyMessageHandlers({
        id: messageData.id,
        text: messageData.message,
        senderId: messageData.sender_id,
        senderName: messageData.sender_name,
        timestamp: new Date(messageData.created_at).getTime(),
        roomId: messageData.room_id,
        isOwn: messageData.sender_id === this.currentUserId,
      })
    })

    // User status events
    this.socket.on("user_joined", (data) => {
      console.log("👤 User joined:", data)
      this.notifyUserStatusHandlers({ type: "joined", ...data })
    })

    this.socket.on("user_left", (data) => {
      console.log("👤 User left:", data)
      this.notifyUserStatusHandlers({ type: "left", ...data })
    })

    this.socket.on("user_online", (data) => {
      console.log("🟢 User online:", data)
      this.notifyUserStatusHandlers({ type: "online", ...data })
    })

    this.socket.on("user_offline", (data) => {
      console.log("⚪ User offline:", data)
      this.notifyUserStatusHandlers({ type: "offline", ...data })
    })

    // Typing events
    this.socket.on("user_typing", (data) => {
      console.log("⌨️ User typing:", data)
      this.notifyTypingHandlers({ type: "typing", ...data })
    })

    this.socket.on("user_stopped_typing", (data) => {
      console.log("⌨️ User stopped typing:", data)
      this.notifyTypingHandlers({ type: "stopped_typing", ...data })
    })

    // Call events (for Agora integration)
    this.socket.on("incoming_call", (data) => {
      console.log("📞 Incoming call:", data)
      this.notifyConnectionHandlers({ type: "incoming_call", ...data })
    })

    this.socket.on("call_ended", (data) => {
      console.log("📞 Call ended:", data)
      this.notifyConnectionHandlers({ type: "call_ended", ...data })
    })

    console.log("✅ Socket.IO event listeners set up successfully")
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
      // Wait for connection first
      await this.waitForConnection()

      if (!this.socket || !this.isConnected) {
        throw new Error("Socket not connected")
      }

      console.log(`📡 Joining room: ${roomId} with user: ${otherUserId}`)

      this.currentRoomId = roomId
      this.socket.emit("join_room", {
        roomId,
        otherUserId,
        userId: this.currentUserId,
      })

      return Promise.resolve()
    } catch (error) {
      console.error("❌ Failed to join room:", error)
      throw error
    }
  }

  // Leave current room
  leaveRoom() {
    if (!this.socket || !this.currentRoomId) return

    console.log(`📡 Leaving room: ${this.currentRoomId}`)

    this.socket.emit("leave_room", {
      roomId: this.currentRoomId,
      userId: this.currentUserId,
    })

    this.currentRoomId = null
  }

  // Send message
  async sendMessage(roomId, message, otherUserId) {
    try {
      await this.waitForConnection()

      if (!this.socket || !this.isConnected) {
        throw new Error("Socket not connected")
      }

      if (!message.trim()) {
        throw new Error("Message cannot be empty")
      }

      console.log(`📤 Sending message to room ${roomId}:`, message)

      return new Promise((resolve, reject) => {
        this.socket.emit(
          "send_message",
          {
            roomId,
            message: message.trim(),
            otherUserId,
            senderId: this.currentUserId,
          },
          (response) => {
            if (response.success) {
              console.log("✅ Message sent successfully")
              resolve({
                id: response.messageId,
                text: message.trim(),
                senderId: this.currentUserId,
                timestamp: Date.now(),
                isOwn: true,
              })
            } else {
              console.error("❌ Failed to send message:", response.error)
              reject(new Error(response.error))
            }
          },
        )
      })
    } catch (error) {
      console.error("❌ Failed to send message:", error)
      throw error
    }
  }

  // Send typing indicator
  async sendTyping(roomId, otherUserId, isTyping = true) {
    try {
      await this.waitForConnection()

      if (!this.socket || !this.isConnected) return

      this.socket.emit(isTyping ? "start_typing" : "stop_typing", {
        roomId,
        otherUserId,
        userId: this.currentUserId,
      })
    } catch (error) {
      console.error("❌ Failed to send typing indicator:", error)
    }
  }

  // Start call (notify other user)
  async startCall(otherUserId, callType = "audio", channelName) {
    try {
      await this.waitForConnection()

      if (!this.socket || !this.isConnected) {
        throw new Error("Socket not connected")
      }

      console.log(`📞 Starting ${callType} call with user ${otherUserId}`)

      this.socket.emit("start_call", {
        otherUserId,
        callType,
        channelName,
        callerId: this.currentUserId,
      })
    } catch (error) {
      console.error("❌ Failed to start call:", error)
      throw error
    }
  }

  // End call
  async endCall(otherUserId, channelName) {
    try {
      await this.waitForConnection()

      if (!this.socket || !this.isConnected) return

      console.log(`📞 Ending call with user ${otherUserId}`)

      this.socket.emit("end_call", {
        otherUserId,
        channelName,
        callerId: this.currentUserId,
      })
    } catch (error) {
      console.error("❌ Failed to end call:", error)
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

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      currentUserId: this.currentUserId,
      currentRoomId: this.currentRoomId,
    }
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      console.log("🧹 Disconnecting Socket.IO...")
      this.leaveRoom()
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this.currentUserId = null
      this.currentRoomId = null
      this.connectionPromise = null
    }
  }

  // Cleanup
  destroy() {
    this.disconnect()
    this.messageHandlers = []
    this.connectionHandlers = []
    this.userStatusHandlers = []
    this.typingHandlers = []
    console.log("✅ SocketChatService destroyed")
  }
}

// Export singleton instance
export default new SocketChatService()
