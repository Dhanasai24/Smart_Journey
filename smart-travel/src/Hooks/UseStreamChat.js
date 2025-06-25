"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useAuth } from "../assets/Context/AuthContext"
import StreamChatService from "../assets/Services/StreamChatService"
import axios from "axios"
import { getStreamTokenUrl } from "../assets/Utils/Constants"

export const useStreamChat = () => {
  const { user, token } = useAuth()

  // Connection state
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)

  // Chat state
  const [matchedTravelers, setMatchedTravelers] = useState([])
  const [messages, setMessages] = useState([])
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [onlineUsers, setOnlineUsers] = useState(new Map())
  const [connectionRequests, setConnectionRequests] = useState([])

  // Call state management
  const [incomingCall, setIncomingCall] = useState(null)
  const [activeCall, setActiveCall] = useState(null)
  const [callStatus, setCallStatus] = useState(null)
  const [callStartTime, setCallStartTime] = useState(null)

  // UI refresh trigger
  const [uiRefreshTrigger, setUiRefreshTrigger] = useState(0)

  // Connection status tracking for real-time updates
  const [connectionStatuses, setConnectionStatuses] = useState(new Map())

  // Audio management for call sounds
  const ringingAudioRef = useRef(null)
  const dialingAudioRef = useRef(null)
  const retryTimeoutRef = useRef(null)
  const initializationRef = useRef(false)
  const retryCount = useRef(0)
  const maxRetries = 3

  // Enhanced toast notification
  const showToast = useCallback((message, type = "info") => {
    try {
      const toast = document.createElement("div")
      toast.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
        type === "success"
          ? "bg-green-500 text-white"
          : type === "error"
            ? "bg-red-500 text-white"
            : type === "warning"
              ? "bg-yellow-500 text-white"
              : "bg-blue-500 text-white"
      }`
      toast.textContent = message
      document.body.appendChild(toast)

      setTimeout(() => {
        toast.style.opacity = "0"
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast)
          }
        }, 300)
      }, 4000)
    } catch (error) {
      console.error("Error showing toast:", error)
    }
  }, [])

  // Enhanced error handler
  const handleError = useCallback(
    (error, context = "Unknown") => {
      console.error(`❌ useStreamChat Error in ${context}:`, error)

      let message = "An unknown error occurred"

      if (error?.message) {
        const errorMsg = error.message.toLowerCase()
        if (errorMsg.includes("reserved field")) {
          message = "Stream Chat configuration error. Please contact support."
        } else if (errorMsg.includes("network") || errorMsg.includes("connection")) {
          message = "Network connection error. Please check your internet."
        } else if (errorMsg.includes("token") || errorMsg.includes("auth")) {
          message = "Authentication error. Please try logging in again."
        } else if (errorMsg.includes("timeout")) {
          message = "Connection timeout. Please try again."
        } else if (errorMsg.includes("connectuser")) {
          message = "Chat service not ready. Please wait a moment and try again."
        } else {
          message = error.message
        }
      }

      setConnectionError({ message, context, timestamp: new Date().toISOString() })
      showToast(message, "error")
    },
    [showToast],
  )

  // ✅ GENERALIZED: Update connection status for ANY user pair
  const updateConnectionStatus = useCallback(
    (userId, status, roomId, persist = true) => {
      console.log(`🔄 Updating connection status: User ${userId} -> ${status} (Room: ${roomId})`)

      setConnectionStatuses((prev) => {
        const newMap = new Map(prev)
        newMap.set(userId.toString(), {
          status,
          roomId,
          timestamp: Date.now(),
          persistent: persist,
        })
        return newMap
      })

      // Store in localStorage for persistence across page refreshes
      if (persist && status === "connected") {
        try {
          const persistentConnections = JSON.parse(localStorage.getItem("streamchat_connections") || "{}")
          persistentConnections[userId.toString()] = {
            status,
            roomId,
            timestamp: Date.now(),
            connectedBy: user?.id,
          }
          localStorage.setItem("streamchat_connections", JSON.stringify(persistentConnections))
          console.log(`💾 Saved persistent connection for user ${userId}`)
        } catch (error) {
          console.warn("Failed to save persistent connection:", error)
        }
      } else if (status === "none") {
        try {
          const persistentConnections = JSON.parse(localStorage.getItem("streamchat_connections") || "{}")
          delete persistentConnections[userId.toString()]
          localStorage.setItem("streamchat_connections", JSON.stringify(persistentConnections))
          console.log(`🗑️ Removed persistent connection for user ${userId}`)
        } catch (error) {
          console.warn("Failed to remove persistent connection:", error)
        }
      }

      // Trigger UI refresh
      setUiRefreshTrigger((prev) => prev + 1)
    },
    [user?.id],
  )

  // Load persistent connections on initialization
  const loadPersistentConnections = useCallback(() => {
    try {
      const persistentConnections = JSON.parse(localStorage.getItem("streamchat_connections") || "{}")
      const currentTime = Date.now()
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours

      Object.entries(persistentConnections).forEach(([userId, connection]) => {
        if (
          connection.connectedBy === user?.id &&
          currentTime - connection.timestamp < maxAge &&
          connection.status === "connected"
        ) {
          setConnectionStatuses((prev) => {
            const newMap = new Map(prev)
            newMap.set(userId, {
              status: connection.status,
              roomId: connection.roomId,
              timestamp: connection.timestamp,
              persistent: true,
            })
            return newMap
          })
          console.log(`🔄 Restored persistent connection for user ${userId}`)
        }
      })
    } catch (error) {
      console.warn("Failed to load persistent connections:", error)
    }
  }, [user?.id])

  // Initialize Stream Chat connection with proper error handling
  const initializeStreamChat = useCallback(async () => {
    if (!user?.id || !token || initializationRef.current) {
      return
    }

    try {
      initializationRef.current = true
      setIsConnecting(true)
      setConnectionError(null)

      console.log(`🔌 Initializing Stream Chat connection for user ${user.id}`)

      const tokenUrl = getStreamTokenUrl()
      console.log(`📡 Requesting token from: ${tokenUrl}`)

      // Get Stream Chat token from backend
      const response = await axios.post(
        tokenUrl,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        },
      )

      if (!response.data?.success || !response.data?.token) {
        throw new Error("Failed to get Stream Chat token from server")
      }

      console.log("✅ Received Stream Chat token from server")

      // Initialize Stream Chat with the token (API key can be configured)
      await StreamChatService.initialize(
        user.id.toString(),
        user.name || `User ${user.id}`,
        response.data.token,
        "69sdct4v7bn2", // You can make this configurable
      )

      setIsConnected(true)
      setConnectionError(null)
      retryCount.current = 0

      // Load persistent connections after successful connection
      loadPersistentConnections()

      console.log("✅ Stream Chat initialized successfully")
    } catch (error) {
      console.error("❌ Failed to initialize Stream Chat:", error)
      setIsConnected(false)
      handleError(error, "initializeStreamChat")

      // Check if this is a critical error that should stop retries
      const errorMessage = error?.message?.toLowerCase() || ""
      const isCriticalError =
        errorMessage.includes("reserved field") ||
        errorMessage.includes("invalid token") ||
        errorMessage.includes("unauthorized") ||
        error?.response?.status === 404

      if (isCriticalError) {
        console.error("❌ Critical error detected. Stopping retries.")
        return
      }

      // Retry logic with exponential backoff for non-critical errors
      if (retryCount.current < maxRetries) {
        retryCount.current++
        const delay = Math.min(1000 * Math.pow(2, retryCount.current), 10000)

        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current)
        }

        console.log(`🔄 Retrying connection in ${delay}ms (attempt ${retryCount.current}/${maxRetries})`)

        retryTimeoutRef.current = setTimeout(() => {
          initializationRef.current = false
          initializeStreamChat()
        }, delay)
      } else {
        console.error("❌ Max retry attempts reached. Stopping retries.")
      }
    } finally {
      setIsConnecting(false)
      initializationRef.current = false
    }
  }, [user, token, handleError, loadPersistentConnections])

  // Setup event handlers
  useEffect(() => {
    if (!user?.id) return

    console.log("🎧 Setting up Stream Chat event handlers")

    // Set up periodic channel discovery for real-time updates
    const channelDiscoveryInterval = setInterval(() => {
      if (isConnected && StreamChatService.client) {
        console.log("🔄 Periodic channel discovery...")
        StreamChatService.discoverAndWatchChannels().catch((error) => {
          console.warn("⚠️ Periodic channel discovery failed:", error)
        })
      }
    }, 30000)

    // ✅ GENERALIZED: Connection event handler for ANY user
    const unsubscribeConnection = StreamChatService.onConnection((data) => {
      console.log("🔌 Connection event received by user", user.id, ":", data)

      try {
        switch (data.type) {
          case "connected":
            setIsConnected(true)
            setConnectionError(null)
            retryCount.current = 0
            showToast("Connected to chat service", "success")

            setTimeout(() => {
              StreamChatService.discoverAndWatchChannels().catch((error) => {
                console.warn("⚠️ Initial channel discovery failed:", error)
              })
            }, 2000)
            break

          case "disconnected":
          case "suspended":
            setIsConnected(false)
            showToast("Disconnected from chat service", "warning")
            break

          case "error":
            setIsConnected(false)
            if (data.error?.isCritical) {
              console.error("❌ Critical error received. Stopping retries.")
              return
            }
            handleError(data.error, "connection event")
            break

          case "recovered":
            setIsConnected(true)
            setConnectionError(null)
            retryCount.current = 0
            showToast("Connection recovered", "success")

            setTimeout(() => {
              StreamChatService.discoverAndWatchChannels().catch((error) => {
                console.warn("⚠️ Recovery channel discovery failed:", error)
              })
            }, 1000)
            break

          case "connection-request":
            console.log(`🔔 User ${user.id} received connection request from ${data.fromUserId}:`, data)

            // ✅ GENERALIZED: Process connection requests for ANY user (not just specific ones)
            if (data.fromUserId && data.fromUserId.toString() !== user.id.toString()) {
              setConnectionRequests((prev) => {
                // Check for duplicates based on fromUserId and roomId
                const exists = prev.some(
                  (req) => req.fromUserId.toString() === data.fromUserId.toString() && req.roomId === data.roomId,
                )

                if (exists) {
                  console.log("⚠️ Duplicate connection request ignored")
                  return prev
                }

                const newRequest = {
                  id: `${data.fromUserId}_${data.roomId}_${Date.now()}`,
                  fromUserId: data.fromUserId.toString(),
                  fromUserName: data.fromUserName || "Anonymous",
                  fromUserAvatar: data.fromUserAvatar || null,
                  roomId: data.roomId,
                  tripId: data.tripId,
                  message: data.message || "Wants to connect",
                  timestamp: data.timestamp || new Date().toISOString(),
                }

                console.log("✅ Adding new connection request for user", user.id, ":", newRequest)
                return [...prev, newRequest]
              })
              showToast(`🔔 ${data.fromUserName || "Someone"} wants to connect with you!`, "info")
            } else {
              console.log("⚠️ Ignoring own connection request or invalid sender")
            }
            break

          case "connection-accepted":
            console.log(`✅ User ${user.id} received connection acceptance from ${data.fromUserId}:`, data)

            // ✅ GENERALIZED: Process acceptance for ANY user
            if (data.fromUserId && data.fromUserId.toString() !== user.id.toString()) {
              // Update connection status immediately
              if (data.connectionUpdate) {
                updateConnectionStatus(
                  data.connectionUpdate.userId,
                  data.connectionUpdate.status,
                  data.connectionUpdate.roomId,
                  true,
                )
              } else {
                updateConnectionStatus(data.fromUserId, "connected", data.roomId, true)
              }
              showToast(`✅ ${data.fromUserName || "Someone"} accepted your connection request!`, "success")

              // Force UI refresh after a short delay
              setTimeout(() => {
                setUiRefreshTrigger((prev) => prev + 1)
              }, 1000)
            }
            break

          case "connection-rejected":
            console.log("❌ Connection rejected:", data)
            if (data.fromUserId && data.fromUserId.toString() !== user.id.toString()) {
              updateConnectionStatus(data.fromUserId, "none", null, false)
              showToast("❌ Your connection request was declined", "info")
            }
            break

          case "connection-disconnected":
            console.log("🔌 User disconnected:", data)
            if (data.fromUserId && data.fromUserId.toString() !== user.id.toString()) {
              updateConnectionStatus(data.fromUserId, "none", null, false)
              showToast(`🔌 ${data.fromUserName || "Someone"} disconnected from you`, "info")
            }
            break

          default:
            console.log("Unknown connection event type:", data.type)
            break
        }
      } catch (error) {
        handleError(error, "connection event handler")
      }
    })

    // Message event handler
    const unsubscribeMessages = StreamChatService.onMessage((message) => {
      console.log("💬 Message event:", message)

      try {
        if (!message?.id) {
          console.warn("⚠️ Invalid message received")
          return
        }

        setMessages((prev) => {
          const exists = prev.some((msg) => msg.id === message.id)
          if (exists) return prev
          return [...prev, message]
        })
      } catch (error) {
        handleError(error, "message event handler")
      }
    })

    // Typing event handler
    const unsubscribeTyping = StreamChatService.onTyping((data) => {
      try {
        setTypingUsers((prev) => {
          const newSet = new Set(prev)
          if (data.type === "typing" && data.userId !== user.id.toString()) {
            newSet.add(data.userId)
          } else {
            newSet.delete(data.userId)
          }
          return newSet
        })
      } catch (error) {
        handleError(error, "typing event handler")
      }
    })

    // User status event handler
    const unsubscribeUserStatus = StreamChatService.onUserStatus((data) => {
      try {
        setOnlineUsers((prev) => {
          const newMap = new Map(prev)
          if (data.type === "online") {
            newMap.set(data.userId, "online")
          } else if (data.type === "offline") {
            newMap.delete(data.userId)
          }
          return newMap
        })
      } catch (error) {
        handleError(error, "user status event handler")
      }
    })

    // Error event handler
    const unsubscribeError = StreamChatService.onError((error) => {
      handleError(error, "StreamChatService")
    })

    // Initialize connection
    initializeStreamChat()

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up Stream Chat event handlers")

      try {
        if (channelDiscoveryInterval) {
          clearInterval(channelDiscoveryInterval)
        }

        stopAllSounds()

        if (typeof unsubscribeConnection === "function") unsubscribeConnection()
        if (typeof unsubscribeMessages === "function") unsubscribeMessages()
        if (typeof unsubscribeTyping === "function") unsubscribeTyping()
        if (typeof unsubscribeUserStatus === "function") unsubscribeUserStatus()
        if (typeof unsubscribeError === "function") unsubscribeError()

        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current)
          retryTimeoutRef.current = null
        }

        StreamChatService.disconnect().catch((error) => {
          console.warn("⚠️ Error during StreamChat cleanup:", error)
        })
      } catch (error) {
        console.warn("⚠️ Error during useStreamChat cleanup:", error)
      }
    }
  }, [user, token, initializeStreamChat, handleError, updateConnectionStatus])

  // Audio management functions
  const stopAllSounds = useCallback(() => {
    try {
      if (ringingAudioRef.current) {
        clearInterval(ringingAudioRef.current.interval)
        ringingAudioRef.current.audioContext?.close()
        ringingAudioRef.current = null
      }
      if (dialingAudioRef.current) {
        clearInterval(dialingAudioRef.current.interval)
        dialingAudioRef.current.audioContext?.close()
        dialingAudioRef.current = null
      }
    } catch (error) {
      console.log("Error stopping sounds:", error)
    }
  }, [])

  // ✅ GENERALIZED: Stream Chat methods for ANY user combination
  const sendConnectionRequest = useCallback(
    async (toUserId, tripId, message) => {
      // Check connection state before proceeding
      if (!isConnected) {
        showToast("Chat service not connected. Please wait a moment and try again.", "warning")
        return
      }

      // Wait for connection to be fully ready
      const isReady = await StreamChatService.waitForConnection(5000)
      if (!isReady) {
        showToast("Chat service not ready. Please wait a moment and try again.", "warning")
        return
      }

      try {
        // ✅ GENERALIZED: Create consistent room ID format for ANY user pair
        const roomId = `room_${Math.min(user?.id, toUserId)}_${Math.max(user?.id, toUserId)}`
        console.log(`📤 User ${user?.id} sending connection request to user ${toUserId} with roomId: ${roomId}`)

        // Update status immediately for sender
        updateConnectionStatus(toUserId, "pending", roomId, false)

        await StreamChatService.sendConnectionRequest(
          toUserId.toString(),
          user?.name || "Anonymous",
          user?.avatar_url || null,
          roomId,
          tripId,
          message,
        )
        showToast("Connection request sent successfully!", "success")
      } catch (error) {
        // Revert status on error
        updateConnectionStatus(toUserId, "none", null, false)
        handleError(error, "sendConnectionRequest")
        throw error
      }
    },
    [isConnected, user, handleError, showToast, updateConnectionStatus],
  )

  const respondToConnectionRequest = useCallback(
    async (request, accepted) => {
      if (!isConnected) {
        showToast("Chat service not connected. Please wait a moment and try again.", "warning")
        return
      }

      // Wait for connection to be fully ready
      const isReady = await StreamChatService.waitForConnection(5000)
      if (!isReady) {
        showToast("Chat service not ready. Please wait a moment and try again.", "warning")
        return
      }

      try {
        console.log(`📝 User ${user?.id} responding to connection request from ${request.fromUserId}:`, {
          request,
          accepted,
        })

        if (accepted) {
          // Update connection status immediately for both users with persistence
          updateConnectionStatus(request.fromUserId, "connected", request.roomId, true)

          await StreamChatService.acceptConnectionRequest(request.fromUserId, request.roomId)
          showToast("Connection request accepted!", "success")

          // Update backend connection status
          try {
            const api = axios.create({
              baseURL: "http://localhost:3000/api",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            })

            await api.post("/chat/connect", {
              targetUserId: request.fromUserId,
            })

            console.log("✅ Backend connection status updated")
          } catch (backendError) {
            console.warn("⚠️ Failed to update backend connection status:", backendError)
          }
        } else {
          await StreamChatService.rejectConnectionRequest(request.fromUserId, request.roomId)
          showToast("Connection request declined", "info")
        }

        // Remove the request from the list
        setConnectionRequests((prev) => prev.filter((req) => req.id !== request.id))
      } catch (error) {
        handleError(error, "respondToConnectionRequest")
        throw error
      }
    },
    [isConnected, token, user, handleError, showToast, updateConnectionStatus],
  )

  const sendMessage = useCallback(
    async (roomId, message, messageType = "text") => {
      if (!isConnected) {
        showToast("Chat service not connected. Please wait a moment and try again.", "warning")
        throw new Error("Not connected to chat service")
      }

      try {
        return await StreamChatService.sendMessage(roomId, message, messageType)
      } catch (error) {
        handleError(error, "sendMessage")
        throw error
      }
    },
    [isConnected, handleError, showToast],
  )

  const joinChat = useCallback(
    async (roomId, otherUserId, otherUserName) => {
      if (!isConnected) {
        showToast("Chat service not connected. Please wait a moment and try again.", "warning")
        return
      }

      try {
        await StreamChatService.createChannel(roomId, otherUserId, otherUserName)
        setMessages([])
      } catch (error) {
        handleError(error, "joinChat")
        throw error
      }
    },
    [isConnected, handleError, showToast],
  )

  const leaveChat = useCallback(
    async (roomId) => {
      if (!isConnected) return

      try {
        await StreamChatService.leaveChannel(roomId)
      } catch (error) {
        handleError(error, "leaveChat")
      }
    },
    [isConnected, handleError],
  )

  const startTyping = useCallback(
    async (roomId) => {
      if (!isConnected) return

      try {
        await StreamChatService.sendTypingStart(roomId)
      } catch (error) {
        handleError(error, "startTyping")
      }
    },
    [isConnected, handleError],
  )

  const stopTyping = useCallback(
    async (roomId) => {
      if (!isConnected) return

      try {
        await StreamChatService.sendTypingStop(roomId)
      } catch (error) {
        handleError(error, "stopTyping")
      }
    },
    [isConnected, handleError],
  )

  const updateLocation = useCallback(
    async (latitude, longitude, location) => {
      if (!isConnected) return

      try {
        await StreamChatService.updateStatus("online")
      } catch (error) {
        handleError(error, "updateLocation")
      }
    },
    [isConnected, handleError],
  )

  const refreshMatches = useCallback(async () => {
    if (!isConnected) return

    try {
      await StreamChatService.updateStatus("online")
      setUiRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      handleError(error, "refreshMatches")
    }
  }, [isConnected, handleError])

  const disconnectFromUser = useCallback(
    async (toUserId) => {
      if (!isConnected) {
        showToast("Chat service not connected. Please wait a moment and try again.", "warning")
        return
      }

      // Wait for connection to be fully ready
      const isReady = await StreamChatService.waitForConnection(5000)
      if (!isReady) {
        showToast("Chat service not ready. Please wait a moment and try again.", "warning")
        return
      }

      try {
        await StreamChatService.disconnectFromUser(toUserId)
        updateConnectionStatus(toUserId, "none", null, false)
        showToast("Successfully disconnected from user", "success")
      } catch (error) {
        handleError(error, "disconnectFromUser")
        throw error
      }
    },
    [isConnected, handleError, showToast, updateConnectionStatus],
  )

  // Retry connection function
  const retryConnection = useCallback(async () => {
    if (isConnecting) return

    try {
      setConnectionError(null)
      retryCount.current = 0
      await initializeStreamChat()
    } catch (error) {
      handleError(error, "retryConnection")
    }
  }, [isConnecting, initializeStreamChat, handleError])

  // Get connection status for a specific user with persistence check
  const getConnectionStatus = useCallback(
    (userId) => {
      const status = connectionStatuses.get(userId.toString())
      return status?.status || "none"
    },
    [connectionStatuses],
  )

  return {
    // Connection state
    isConnected,
    isConnecting,
    connectionError,
    matchedTravelers,
    messages,
    setMessages,
    typingUsers,
    onlineUsers,
    connectionRequests,
    setConnectionRequests,

    // Call state
    incomingCall,
    setIncomingCall,
    activeCall,
    setActiveCall,
    callStatus,
    setCallStatus,
    callStartTime,
    setCallStartTime,

    // UI refresh trigger
    uiRefreshTrigger,
    setUiRefreshTrigger,

    // Connection status tracking
    connectionStatuses,
    getConnectionStatus,

    // Methods
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
    retryConnection,

    // Call methods (placeholder - implement with Agora or other service)
    initiateCall: () => {},
    acceptCall: () => {},
    rejectCall: () => {},
    endCall: () => {},
    stopAllSounds,

    // Stream Chat service reference
    streamChatService: StreamChatService,

    // Error handling
    handleError,
    showToast,
  }
}
