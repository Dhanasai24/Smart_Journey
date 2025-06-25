"use client"

import { useEffect, useRef, useState } from "react"
import { io } from "socket.io-client"
import { useAuth } from "../assets/Context/AuthContext"
import { getNetworkSocketUrl } from "../assets/Utils/Constants"

// Global socket instance to prevent recreation
let globalSocket = null
let globalSocketInitialized = false

export const useSocket = () => {
  const { user, token } = useAuth()
  const socketRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const [matchedTravelers, setMatchedTravelers] = useState([])
  const [messages, setMessages] = useState([])
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [onlineUsers, setOnlineUsers] = useState(new Map())
  const [connectionRequests, setConnectionRequests] = useState([])

  // UI refresh trigger
  const [uiRefreshTrigger, setUiRefreshTrigger] = useState(0)

  // ✅ NEW: Message deduplication
  const messageCache = useRef(new Set())
  const CONNECTION_REQUEST_CACHE = useRef(new Set())

  // Initialize socket connection only once
  useEffect(() => {
    if (!user || !token) return

    // If global socket already exists and is connected, use it
    if (globalSocket && globalSocket.connected && globalSocketInitialized) {
      console.log(`🔄 Reusing existing socket connection: ${globalSocket.id}`)
      socketRef.current = globalSocket
      setIsConnected(true)
      return
    }

    // Only create new socket if none exists or it's disconnected
    if (!globalSocket || !globalSocket.connected) {
      const SOCKET_URL = getNetworkSocketUrl()
      console.log(`🔌 Creating new Socket.IO connection to ${SOCKET_URL}`)

      const newSocket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ["websocket", "polling"],
        timeout: 20000,
        forceNew: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        auth: {
          token: token,
        },
      })

      globalSocket = newSocket
      globalSocketInitialized = true
      window.socket = newSocket
    }

    socketRef.current = globalSocket
    const socket = socketRef.current

    // Connection events
    const handleConnect = () => {
      console.log(`🔌 Connected to server: ${socket.id}`)
      setIsConnected(true)
      socket.emit("register-user", {
        userId: user.id,
        token,
        userInfo: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar_url: user.avatar_url,
        },
      })
    }

    const handleDisconnect = (reason) => {
      console.log(`🔌 Disconnected from server: ${reason}`)
      setIsConnected(false)
    }

    const handleConnectError = (error) => {
      console.log(`🔌 Connection error: ${error.message}`)
      setIsConnected(false)
    }

    // Match events
    const handleMatchedTravelers = (travelers) => {
      console.log("👥 Received matched travelers:", travelers.length)
      setMatchedTravelers(travelers)
    }

    const handleNewTravelerOnline = (traveler) => {
      console.log("🆕 New traveler online:", traveler)
    }

    // Connection request events
    const handleConnectionRequested = (data) => {
      console.log("🔔 Received connection request:", data)

      // ✅ FIXED: Prevent duplicate connection requests
      const requestKey = `${data.fromUserId}_${data.toUserId}_${data.roomId}`
      if (CONNECTION_REQUEST_CACHE.current.has(requestKey)) {
        console.log("🚫 Duplicate connection request blocked")
        return
      }

      CONNECTION_REQUEST_CACHE.current.add(requestKey)

      // Clear cache after 30 seconds
      setTimeout(() => {
        CONNECTION_REQUEST_CACHE.current.delete(requestKey)
      }, 30000)

      setConnectionRequests((prev) => [
        ...prev,
        {
          id: Date.now(),
          ...data,
          timestamp: new Date().toISOString(),
        },
      ])
    }

    const handleConnectionRequestSent = (data) => {
      console.log("📤 Connection request sent:", data)
    }

    const handleConnectionAccepted = (data) => {
      console.log("✅ Connection request accepted:", data)
      setUiRefreshTrigger((prev) => prev + 1)
    }

    const handleConnectionRejected = (data) => {
      console.log("❌ Connection request rejected:", data)
    }

    const handleRefreshUI = (data) => {
      console.log("🔄 UI refresh triggered:", data)
      setUiRefreshTrigger((prev) => prev + 1)
    }

    const handleConnectionReady = (data) => {
      console.log("🚀 Connection ready:", data)
      setUiRefreshTrigger((prev) => prev + 1)
    }

    const handleForceUIRefresh = (data) => {
      console.log("🔄 Force UI refresh:", data)
      setUiRefreshTrigger((prev) => prev + 1)
    }

    // ✅ ENHANCED: Message events with better handling
    const handleNewMessage = (message) => {
      console.log("💬 New message received:", message)
      setMessages((prev) => {
        // ✅ ENHANCED: Better duplicate detection
        const exists = prev.some(
          (msg) =>
            msg.id === message.id ||
            (msg.message === message.message &&
              msg.sender_id === message.sender_id &&
              Math.abs(new Date(msg.created_at).getTime() - new Date(message.created_at).getTime()) < 1000),
        )
        if (exists) {
          console.log("🚫 Duplicate message blocked:", message.id)
          return prev
        }
        return [...prev, message]
      })
    }

    const handleMessageSent = (message) => {
      console.log("✅ Message sent confirmation:", message)
    }

    const handleChatHistory = (data) => {
      console.log("📜 Chat history received:", data.messages?.length || 0)
      setMessages(data.messages || [])
    }

    // Typing events
    const handleUserTyping = (data) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev)
        if (data.typing && data.userId !== user.id) {
          newSet.add(data.userId)
        } else {
          newSet.delete(data.userId)
        }
        return newSet
      })
    }

    // Status events
    const handleUserStatusChanged = (data) => {
      setOnlineUsers((prev) => {
        const newMap = new Map(prev)
        newMap.set(data.userId, data.status)
        return newMap
      })
    }

    const handleUserDisconnected = (data) => {
      console.log("👤 User disconnected:", data)
      setOnlineUsers((prev) => {
        const newMap = new Map(prev)
        newMap.delete(data.userId)
        return newMap
      })
    }

    // Error handling
    const handleError = (error) => {
      console.error("❌ Socket error:", error)
    }

    // Add event listeners
    socket.on("connect", handleConnect)
    socket.on("disconnect", handleDisconnect)
    socket.on("connect_error", handleConnectError)
    socket.on("matched-travelers", handleMatchedTravelers)
    socket.on("new-traveler-online", handleNewTravelerOnline)
    socket.on("connection-requested", handleConnectionRequested)
    socket.on("connection-request-sent", handleConnectionRequestSent)
    socket.on("connection-accepted", handleConnectionAccepted)
    socket.on("connection-rejected", handleConnectionRejected)
    socket.on("refresh-ui", handleRefreshUI)
    socket.on("connection-ready", handleConnectionReady)
    socket.on("force-ui-refresh", handleForceUIRefresh)
    socket.on("new_message", handleNewMessage)
    socket.on("message-sent", handleMessageSent)
    socket.on("chat_history", handleChatHistory)
    socket.on("user_typing", handleUserTyping)
    socket.on("user-status-changed", handleUserStatusChanged)
    socket.on("user-disconnected", handleUserDisconnected)
    socket.on("error", handleError)

    // If socket is already connected, trigger connect handler
    if (socket.connected) {
      handleConnect()
    }

    // Cleanup function - DON'T close the socket, just remove listeners
    return () => {
      console.log("🧹 Cleaning up socket event listeners (keeping connection alive)")

      socket.off("connect", handleConnect)
      socket.off("disconnect", handleDisconnect)
      socket.off("connect_error", handleConnectError)
      socket.off("matched-travelers", handleMatchedTravelers)
      socket.off("new-traveler-online", handleNewTravelerOnline)
      socket.off("connection-requested", handleConnectionRequested)
      socket.off("connection-request-sent", handleConnectionRequestSent)
      socket.off("connection-accepted", handleConnectionAccepted)
      socket.off("connection-rejected", handleConnectionRejected)
      socket.off("refresh-ui", handleRefreshUI)
      socket.off("connection-ready", handleConnectionReady)
      socket.off("force-ui-refresh", handleForceUIRefresh)
      socket.off("new_message", handleNewMessage)
      socket.off("message-sent", handleMessageSent)
      socket.off("chat_history", handleChatHistory)
      socket.off("user_typing", handleUserTyping)
      socket.off("user-status-changed", handleUserStatusChanged)
      socket.off("user-disconnected", handleUserDisconnected)
      socket.off("error", handleError)
    }
  }, [user, token])

  // Socket methods
  const joinPlanning = (planningData) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("join-planning", {
        userId: user?.id,
        ...planningData,
      })
    }
  }

  const updateStatus = (status) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("update-status", {
        userId: user?.id,
        status,
      })
    }
  }

  const sendConnectionRequest = (toUserId, tripId, message) => {
    if (socketRef.current?.connected) {
      const roomId = `room_${Math.min(user.id, toUserId)}_${Math.max(user.id, toUserId)}`
      socketRef.current.emit("send-connection-request", {
        fromUserId: user.id,
        fromUserName: user.name,
        fromUserAvatar: user.avatar_url,
        toUserId,
        tripId,
        roomId,
        message: message || `${user.name} wants to connect with you`,
      })
    }
  }

  const respondToConnectionRequest = (request, accepted) => {
    if (socketRef.current?.connected) {
      if (accepted) {
        socketRef.current.emit("accept-connection-request", {
          roomId: request.roomId,
          fromUserId: request.fromUserId,
          toUserId: user?.id,
        })
      } else {
        socketRef.current.emit("reject-connection-request", {
          roomId: request.roomId,
          fromUserId: request.fromUserId,
          toUserId: user?.id,
        })
      }
    }
  }

  // ✅ ENHANCED: Send message with better error handling and immediate feedback
  const sendMessage = (roomId, message, messageType = "text") => {
    return new Promise((resolve, reject) => {
      if (socketRef.current?.connected) {
        const timeout = setTimeout(() => {
          reject(new Error("Message send timeout"))
        }, 10000)

        // ✅ FIXED: Generate unique message ID to prevent duplicates
        const tempMessageId = `temp_${Date.now()}_${Math.random()}`

        socketRef.current.emit(
          "send_message",
          {
            roomId,
            message,
            messageType,
            senderId: user?.id,
            tempMessageId, // Add temp ID for tracking
          },
          (response) => {
            clearTimeout(timeout)
            if (response?.success) {
              console.log("✅ Message send confirmed:", response)
              resolve({
                id: response.messageId || tempMessageId,
                text: message,
                senderId: user.id,
                timestamp: Date.now(),
                isOwn: true,
                messageData: response.messageData,
              })
            } else {
              console.error("❌ Message send failed:", response)
              reject(new Error(response?.error || "Failed to send message"))
            }
          },
        )
      } else {
        reject(new Error("Socket not connected"))
      }
    })
  }

  const joinChat = (roomId) => {
    if (socketRef.current?.connected) {
      console.log(`🚪 Joining chat room: ${roomId}`)
      socketRef.current.emit("join_room", {
        roomId,
        userId: user?.id,
      })
      setMessages([])
    }
  }

  const leaveChat = (roomId) => {
    if (socketRef.current?.connected) {
      console.log(`🚪 Leaving chat room: ${roomId}`)
      socketRef.current.emit("leave_room", {
        roomId,
        userId: user?.id,
      })
    }
  }

  const startTyping = (roomId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("start_typing", {
        userId: user?.id,
        roomId,
      })
    }
  }

  const stopTyping = (roomId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("stop_typing", {
        userId: user?.id,
        roomId,
      })
    }
  }

  const disconnectFromUser = (targetUserId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("disconnect-user", {
        fromUserId: user?.id,
        toUserId: targetUserId,
      })
    }
  }

  const updateLocation = (latitude, longitude, location) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("update-location", {
        userId: user?.id,
        latitude,
        longitude,
        location,
      })
    }
  }

  const refreshMatches = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("refresh-matches", {
        userId: user?.id,
      })
    }
  }

  return {
    socket: socketRef.current,
    isConnected,
    matchedTravelers,
    messages,
    setMessages,
    typingUsers,
    onlineUsers,
    connectionRequests,
    setConnectionRequests,

    // UI refresh trigger
    uiRefreshTrigger,

    // Methods
    joinPlanning,
    updateStatus,
    sendConnectionRequest,
    respondToConnectionRequest,
    sendMessage,
    joinChat,
    leaveChat,
    startTyping,
    stopTyping,
    updateLocation,
    refreshMatches,
    disconnectFromUser,
  }
}

// Function to manually close the global socket (call this on app unmount)
export const closeGlobalSocket = () => {
  if (globalSocket) {
    console.log("🔌 Manually closing global socket connection")
    globalSocket.close()
    globalSocket = null
    globalSocketInitialized = false
    window.socket = null
  }
}
