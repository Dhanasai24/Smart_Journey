"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "../assets/Context/AuthContext"
import { useTheme } from "../assets/Context/ThemeContext"
import SocketChatService from "../assets/Services/SocketChatService"
import AgoraRTCService from "../assets/Services/Agora/AgoraRTCService"
import AgoraTokenService from "../assets/Services/Agora/AgoraTokenService"
import {
  Send,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  Wifi,
  WifiOff,
  MessageCircle,
  Loader,
  User,
  RefreshCw,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
} from "lucide-react"

const ChatRoom = ({ otherUserId, otherUser, roomId, onBack }) => {
  const { user } = useAuth()
  const { theme, getThemeClasses } = useTheme()
  const themeClasses = getThemeClasses()

  // ✅ Use provided user info or fallback
  const displayUser = otherUser || {
    id: otherUserId,
    name: `User ${otherUserId}`,
    avatar_url: null,
    email: null,
  }

  // State management
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("Initializing...")
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [retryCount, setRetryCount] = useState(0)
  const [showRetryButton, setShowRetryButton] = useState(false)

  // Call states
  const [isInCall, setIsInCall] = useState(false)
  const [callType, setCallType] = useState(null) // 'audio' or 'video'
  const [incomingCall, setIncomingCall] = useState(null)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(false)

  // Refs
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const retryTimeoutRef = useRef(null)

  // Generate room ID for chat
  const chatRoomId = roomId || `chat_${Math.min(user.id, otherUserId)}_${Math.max(user.id, otherUserId)}`
  const callChannelName = `call_${Math.min(user.id, otherUserId)}_${Math.max(user.id, otherUserId)}_${Date.now()}`

  console.log(`🔗 Chat Room: ${chatRoomId} (Users: ${user.id} <-> ${otherUserId})`)

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Initialize chat
  useEffect(() => {
    initializeChat()
    return () => cleanup()
  }, [user.id, otherUserId])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Notify parent component when leaving chat
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts (user leaves chat)
      console.log("🚪 Leaving chat room, updating parent state...")

      // Store info about leaving chat for parent component
      if (otherUserId) {
        sessionStorage.setItem(
          "leftChatUser",
          JSON.stringify({
            userId: otherUserId,
            timestamp: Date.now(),
          }),
        )
      }
    }
  }, [otherUserId])

  // Handle visibility change to detect when user switches tabs/windows
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("📱 Chat room hidden (user switched tabs)")
      } else {
        console.log("📱 Chat room visible (user returned)")
        // Mark messages as read when user returns
        if (isConnected && chatRoomId) {
          // You can add logic here to mark messages as read
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [isConnected, chatRoomId])

  // ✅ Initialize Socket.IO chat
  const initializeChat = async () => {
    try {
      setIsLoading(true)
      setShowRetryButton(false)
      setConnectionStatus("🚀 Connecting to chat server...")

      console.log(`🚀 Initializing Socket.IO chat for room: ${chatRoomId}`)
      console.log(`👤 Current user: ${user.name} (ID: ${user.id})`)
      console.log(`👤 Chatting with: ${displayUser.name} (ID: ${displayUser.id})`)

      // Initialize Socket.IO
      const token = localStorage.getItem("token")
      await SocketChatService.initialize(user.id, token)

      setConnectionStatus("🔧 Setting up event listeners...")

      // Set up event listeners
      setupEventListeners()

      setConnectionStatus(`📡 Joining chat room: ${chatRoomId}...`)

      // Join chat room
      await SocketChatService.joinRoom(chatRoomId, otherUserId)

      setIsConnected(true)
      setConnectionStatus(`✅ Connected - Ready to chat with ${displayUser.name}`)
      setIsLoading(false)
      setRetryCount(0)

      console.log(`🎉 Socket.IO chat initialized successfully!`)
    } catch (error) {
      console.error("❌ Failed to initialize Socket.IO chat:", error)
      setIsConnected(false)
      setIsLoading(false)

      const errorMessage = error.message || "Unknown error"
      setConnectionStatus(`❌ Connection failed: ${errorMessage}`)

      // Auto-retry logic
      if (retryCount < 3) {
        const nextRetry = retryCount + 1
        setRetryCount(nextRetry)
        setConnectionStatus(`🔄 Retrying in 3s... (${nextRetry}/3)`)

        retryTimeoutRef.current = setTimeout(() => {
          console.log(`🔄 Auto-retry attempt ${nextRetry}`)
          initializeChat()
        }, 3000)
      } else {
        setConnectionStatus("❌ Connection failed. Please retry manually.")
        setShowRetryButton(true)
      }
    }
  }

  // Manual retry
  const handleRetry = () => {
    setRetryCount(0)
    initializeChat()
  }

  // ✅ Setup Socket.IO event listeners
  const setupEventListeners = () => {
    console.log("🔧 Setting up Socket.IO event listeners...")

    // Message handler
    const unsubscribeMessage = SocketChatService.onMessage((messageData) => {
      console.log("💬 Received message:", messageData)

      // Don't add our own messages again
      if (messageData.senderId === user.id) {
        console.log("↩️ Ignoring own message")
        return
      }

      const newMsg = {
        id: messageData.id || Date.now() + Math.random(),
        text: messageData.text,
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        senderAvatar: messageData.senderAvatar,
        timestamp: messageData.timestamp,
        isOwn: false,
        messageType: messageData.messageType || "text",
      }

      setMessages((prev) => {
        console.log(`📝 Adding message to chat: "${messageData.text}"`)
        return [...prev, newMsg]
      })

      // Play notification sound
      try {
        const audio = new Audio(
          "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT",
        )
        audio.volume = 0.3
        audio.play().catch(() => {}) // Ignore errors
      } catch (e) {}
    })

    // Connection handler
    const unsubscribeConnection = SocketChatService.onConnection((data) => {
      console.log("🔗 Connection event:", data)

      if (data.type === "connected") {
        setIsConnected(true)
        setConnectionStatus(`✅ Connected - Chatting with ${displayUser.name}`)
      } else if (data.type === "disconnected") {
        setIsConnected(false)
        setConnectionStatus("🔄 Reconnecting...")
      } else if (data.type === "chat_history") {
        // ✅ Load chat history from database
        console.log("📜 Loading chat history:", data.messages.length, "messages")
        setMessages(data.messages)
      } else if (data.type === "incoming_call") {
        setIncomingCall(data)
      } else if (data.type === "call_ended") {
        setIsInCall(false)
        setCallType(null)
        setIncomingCall(null)
        AgoraRTCService.leaveChannel()
      }
    })

    // User status handler
    const unsubscribeUserStatus = SocketChatService.onUserStatus((data) => {
      console.log("👥 User status event:", data)

      if (data.type === "joined") {
        setOnlineUsers((prev) => new Set(prev).add(data.userId))
        if (data.userId === otherUserId) {
          setConnectionStatus(`🎉 ${displayUser.name} joined the chat`)
        }
      } else if (data.type === "left") {
        setOnlineUsers((prev) => {
          const newSet = new Set(prev)
          newSet.delete(data.userId)
          return newSet
        })
        if (data.userId === otherUserId) {
          setConnectionStatus(`👋 ${displayUser.name} left the chat`)
        }
      } else if (data.type === "online") {
        setOnlineUsers((prev) => new Set(prev).add(data.userId))
      } else if (data.type === "offline") {
        setOnlineUsers((prev) => {
          const newSet = new Set(prev)
          newSet.delete(data.userId)
          return newSet
        })
      }
    })

    // Typing handler
    const unsubscribeTyping = SocketChatService.onTyping((data) => {
      if (data.userId === otherUserId) {
        if (data.type === "typing") {
          setTypingUsers((prev) => new Set(prev).add(data.userId))
        } else {
          setTypingUsers((prev) => {
            const newSet = new Set(prev)
            newSet.delete(data.userId)
            return newSet
          })
        }
      }
    })

    // Store unsubscribe functions
    window.socketChatUnsubscribers = [
      unsubscribeMessage,
      unsubscribeConnection,
      unsubscribeUserStatus,
      unsubscribeTyping,
    ]
    console.log("✅ Socket.IO event listeners set up successfully")
  }

  // Cleanup
  const cleanup = async () => {
    try {
      console.log("🧹 Cleaning up Socket.IO chat...")

      // Clear timeouts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }

      // End any ongoing calls
      if (isInCall) {
        await endCall()
      }

      // Unsubscribe from events
      if (window.socketChatUnsubscribers) {
        window.socketChatUnsubscribers.forEach((unsubscribe) => {
          try {
            unsubscribe()
          } catch (error) {
            console.warn("Error unsubscribing:", error)
          }
        })
        delete window.socketChatUnsubscribers
      }

      // Leave room and disconnect
      SocketChatService.leaveRoom()

      console.log("✅ Socket.IO chat cleanup completed")
    } catch (error) {
      console.error("❌ Socket.IO chat cleanup failed:", error)
    }
  }

  // ✅ Send message via Socket.IO
  const sendMessage = async () => {
    if (!newMessage.trim() || isSending || !isConnected) {
      console.log("❌ Cannot send message:", {
        hasMessage: !!newMessage.trim(),
        isSending,
        isConnected,
      })
      return
    }

    try {
      setIsSending(true)
      const messageText = newMessage.trim()

      console.log(`📤 Sending message to room ${chatRoomId}: "${messageText}"`)

      const messageData = await SocketChatService.sendMessage(chatRoomId, messageText, otherUserId)

      // Add message to local state immediately
      const newMsg = {
        id: messageData.id || Date.now() + Math.random(),
        text: messageData.text,
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        timestamp: messageData.timestamp,
        isOwn: true,
        saved: messageData.saved,
      }

      setMessages((prev) => {
        console.log(`✅ Message sent successfully: "${messageText}" ${messageData.saved ? "(saved)" : "(not saved)"}`)
        return [...prev, newMsg]
      })

      // Notify parent about new message for chat list updates
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: "CHAT_MESSAGE_SENT",
            data: {
              roomId: chatRoomId,
              otherUserId: otherUserId,
              message: messageText,
              timestamp: Date.now(),
            },
          },
          "*",
        )
      }

      setNewMessage("")
    } catch (error) {
      console.error("❌ Failed to send message:", error)

      // Show error to user
      const errorMsg = {
        id: Date.now() + Math.random(),
        text: `❌ Failed to send message: ${error.message}`,
        senderId: "system",
        timestamp: Date.now(),
        isOwn: false,
        isError: true,
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsSending(false)
    }
  }

  // ✅ Start audio call using Agora
  const startAudioCall = async () => {
    try {
      console.log("📞 Starting audio call...")
      setCallType("audio")
      setIsInCall(true)

      // Generate RTC token
      const rtcToken = await AgoraTokenService.generateRTCToken(callChannelName, user.id)
      console.log("🎫 RTC Token:", rtcToken ? "Generated" : "Using null token")

      // Join RTC channel
      await AgoraRTCService.joinChannel(callChannelName, user.id, rtcToken)

      // Start audio call
      await AgoraRTCService.startAudioCall()

      // Notify other user via Socket.IO
      SocketChatService.startCall(otherUserId, "audio", callChannelName)

      console.log("✅ Audio call started")
    } catch (error) {
      console.error("❌ Failed to start audio call:", error)
      setIsInCall(false)
      setCallType(null)

      // Show error to user
      const errorMsg = {
        id: Date.now() + Math.random(),
        text: `❌ Failed to start audio call: ${error.message}`,
        senderId: "system",
        timestamp: Date.now(),
        isOwn: false,
        isError: true,
      }
      setMessages((prev) => [...prev, errorMsg])
    }
  }

  // ✅ Start video call using Agora
  const startVideoCall = async () => {
    try {
      console.log("📹 Starting video call...")
      setCallType("video")
      setIsInCall(true)

      // Generate RTC token
      const rtcToken = await AgoraTokenService.generateRTCToken(callChannelName, user.id)
      console.log("🎫 RTC Token:", rtcToken ? "Generated" : "Using null token")

      // Join RTC channel
      await AgoraRTCService.joinChannel(callChannelName, user.id, rtcToken)

      // Start video call
      const tracks = await AgoraRTCService.startVideoCall()

      // Play local video
      if (tracks.video) {
        const localVideoContainer = document.getElementById("local-video")
        if (localVideoContainer) {
          tracks.video.play(localVideoContainer)
        }
      }

      // Notify other user via Socket.IO
      SocketChatService.startCall(otherUserId, "video", callChannelName)

      console.log("✅ Video call started")
    } catch (error) {
      console.error("❌ Failed to start video call:", error)
      setIsInCall(false)
      setCallType(null)

      // Show error to user
      const errorMsg = {
        id: Date.now() + Math.random(),
        text: `❌ Failed to start video call: ${error.message}`,
        senderId: "system",
        timestamp: Date.now(),
        isOwn: false,
        isError: true,
      }
      setMessages((prev) => [...prev, errorMsg])
    }
  }

  // Accept incoming call
  const acceptCall = async () => {
    if (!incomingCall) return

    try {
      console.log("✅ Accepting incoming call...")
      setCallType(incomingCall.callType)
      setIsInCall(true)

      // Generate RTC token
      const rtcToken = await AgoraTokenService.generateRTCToken(incomingCall.channelName, user.id)

      // Join RTC channel
      await AgoraRTCService.joinChannel(incomingCall.channelName, user.id, rtcToken)

      if (incomingCall.callType === "video") {
        const tracks = await AgoraRTCService.startVideoCall()
        if (tracks.video) {
          const localVideoContainer = document.getElementById("local-video")
          if (localVideoContainer) {
            tracks.video.play(localVideoContainer)
          }
        }
      } else {
        await AgoraRTCService.startAudioCall()
      }

      setIncomingCall(null)
      console.log("✅ Call accepted")
    } catch (error) {
      console.error("❌ Failed to accept call:", error)
      setIsInCall(false)
      setCallType(null)
      setIncomingCall(null)
    }
  }

  // Reject incoming call
  const rejectCall = () => {
    console.log("❌ Rejecting incoming call...")
    SocketChatService.endCall(incomingCall.callerId, incomingCall.channelName)
    setIncomingCall(null)
  }

  // End call
  const endCall = async () => {
    try {
      console.log("📞 Ending call...")

      // Leave RTC channel
      await AgoraRTCService.leaveChannel()

      // Notify other user via Socket.IO
      SocketChatService.endCall(otherUserId, callChannelName)

      setIsInCall(false)
      setCallType(null)
      setIncomingCall(null)
      setIsAudioMuted(false)
      setIsVideoMuted(false)

      console.log("✅ Call ended")
    } catch (error) {
      console.error("❌ Failed to end call:", error)
    }
  }

  // Toggle audio mute
  const toggleAudio = async () => {
    const muted = await AgoraRTCService.toggleAudio()
    setIsAudioMuted(muted)
  }

  // Toggle video mute
  const toggleVideo = async () => {
    const muted = await AgoraRTCService.toggleVideo()
    setIsVideoMuted(muted)
  }

  // Handle input change
  const handleInputChange = (e) => {
    setNewMessage(e.target.value)

    // Send typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    if (e.target.value.trim()) {
      SocketChatService.sendTyping(chatRoomId, otherUserId, true)

      typingTimeoutRef.current = setTimeout(() => {
        SocketChatService.sendTyping(chatRoomId, otherUserId, false)
      }, 1000)
    } else {
      SocketChatService.sendTyping(chatRoomId, otherUserId, false)
    }
  }

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Format date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString()
    }
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${themeClasses.background}`}>
        <div className="text-center max-w-md">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className={`${themeClasses.primaryText} font-medium mb-2`}>Connecting to {displayUser.name}...</p>
          <p className={`text-sm ${themeClasses.secondaryText} mb-4`}>{connectionStatus}</p>

          {/* ✅ Show debug info */}
          <div className={`text-xs ${themeClasses.secondaryText} mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded`}>
            <p>🔗 Room: {chatRoomId}</p>
            <p>
              👤 You: {user.name} ({user.id})
            </p>
            <p>
              👤 Them: {displayUser.name} ({displayUser.id})
            </p>
            <p>🚀 Using: Socket.IO + Agora RTC</p>
          </div>

          {showRetryButton && (
            <button
              onClick={handleRetry}
              className="flex items-center space-x-2 mx-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Connection</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full ${themeClasses.background}`}>
      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${themeClasses.card} p-6 rounded-lg max-w-sm w-full mx-4`}>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                {incomingCall.callType === "video" ? (
                  <Video className="w-8 h-8 text-white" />
                ) : (
                  <Phone className="w-8 h-8 text-white" />
                )}
              </div>
              <h3 className={`text-lg font-semibold ${themeClasses.primaryText} mb-2`}>
                Incoming {incomingCall.callType} call
              </h3>
              <p className={`${themeClasses.secondaryText} mb-6`}>{displayUser.name} is calling you...</p>
              <div className="flex space-x-4">
                <button
                  onClick={rejectCall}
                  className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={acceptCall}
                  className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`${themeClasses.card} border-b ${themeClasses.border} px-4 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={onBack} className={`p-2 hover:${themeClasses.cardContent} rounded-full transition-colors`}>
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  {displayUser.avatar_url ? (
                    <img
                      src={displayUser.avatar_url || "/placeholder.svg"}
                      alt={displayUser.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                {/* Online indicator */}
                {onlineUsers.has(otherUserId) && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div>
                <h3 className={`font-semibold ${themeClasses.primaryText}`}>{displayUser.name}</h3>
                <div className="flex items-center space-x-2">
                  {isConnected ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm ${themeClasses.secondaryText}`}>
                    {isInCall
                      ? `${callType === "video" ? "Video" : "Audio"} call active`
                      : isConnected
                        ? onlineUsers.has(otherUserId)
                          ? "Online"
                          : "Connected"
                        : connectionStatus}
                  </span>
                  {typingUsers.has(otherUserId) && (
                    <span className="text-xs text-blue-500 animate-pulse">typing...</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            {isInCall ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleAudio}
                  className={`p-2 rounded-full transition-colors ${
                    isAudioMuted ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                  title={isAudioMuted ? "Unmute" : "Mute"}
                >
                  {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {callType === "video" && (
                  <button
                    onClick={toggleVideo}
                    className={`p-2 rounded-full transition-colors ${
                      isVideoMuted ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600"
                    }`}
                    title={isVideoMuted ? "Turn on camera" : "Turn off camera"}
                  >
                    {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </button>
                )}

                <button
                  onClick={endCall}
                  className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                  title="End Call"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={startAudioCall}
                  disabled={!isConnected}
                  className={`p-2 rounded-full transition-colors ${
                    isConnected ? "hover:bg-green-100 text-green-600" : "text-gray-400 cursor-not-allowed"
                  }`}
                  title="Audio Call"
                >
                  <Phone className="w-5 h-5" />
                </button>

                <button
                  onClick={startVideoCall}
                  disabled={!isConnected}
                  className={`p-2 rounded-full transition-colors ${
                    isConnected ? "hover:bg-blue-100 text-blue-600" : "text-gray-400 cursor-not-allowed"
                  }`}
                  title="Video Call"
                >
                  <Video className="w-5 h-5" />
                </button>
              </>
            )}

            <button className={`p-2 hover:${themeClasses.cardContent} rounded-full transition-colors`}>
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Video call area */}
      {isInCall && callType === "video" && (
        <div className="bg-black p-4 flex justify-center items-center min-h-[300px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
            {/* Local video */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
              <div id="local-video" className="w-full h-full"></div>
              <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">You</div>
            </div>

            {/* Remote video */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
              <div id={`player-${otherUserId}`} className="w-full h-full"></div>
              <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                {displayUser.name}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className={`w-16 h-16 ${themeClasses.secondaryText} mx-auto mb-4`} />
            <p className={`${themeClasses.secondaryText} text-lg mb-2`}>Start your conversation</p>
            <p className={themeClasses.secondaryText}>Say hello to {displayUser.name}!</p>

            {/* ✅ Debug info */}
            <div className={`text-xs ${themeClasses.secondaryText} mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded`}>
              <p>🔗 Room: {chatRoomId}</p>
              <p>📡 Status: {isConnected ? "Connected" : "Disconnected"}</p>
              <p>👥 Online: {onlineUsers.size} users</p>
              <p>🚀 Chat: Socket.IO | Calls: Agora RTC</p>
              <p>💾 Messages: Saved to database</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const showDate = index === 0 || formatDate(messages[index - 1].timestamp) !== formatDate(message.timestamp)

            return (
              <div key={message.id}>
                {showDate && (
                  <div className="text-center py-2">
                    <span
                      className={`${themeClasses.cardContent} ${themeClasses.secondaryText} text-xs px-3 py-1 rounded-full`}
                    >
                      {formatDate(message.timestamp)}
                    </span>
                  </div>
                )}

                <div className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                      message.isSystem
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/50 text-center text-sm"
                        : message.isError
                          ? "bg-red-500/20 text-red-400 border border-red-500/50"
                          : message.isOwn
                            ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white"
                            : `${themeClasses.cardContent} ${themeClasses.primaryText} border ${themeClasses.border}`
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    {!message.isSystem && (
                      <div className="flex items-center justify-between mt-2">
                        <p
                          className={`text-xs ${
                            message.isError
                              ? "text-red-300"
                              : message.isOwn
                                ? "text-blue-100"
                                : themeClasses.secondaryText
                          }`}
                        >
                          {formatTime(message.timestamp)}
                        </p>
                        {message.saved && (
                          <span className="text-xs text-green-400" title="Saved to database">
                            💾
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className={`${themeClasses.card} border-t ${themeClasses.border} p-4`}>
        {!isConnected && (
          <div className="mb-3 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg flex items-center justify-between">
            <p className="text-yellow-400 text-sm">⚠️ {connectionStatus}</p>
            {showRetryButton && (
              <button
                onClick={handleRetry}
                className="flex items-center space-x-1 px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}

        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${displayUser.name}...`}
              className={`w-full ${themeClasses.input} rounded-2xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors`}
              rows={1}
              disabled={!isConnected || isSending}
              style={{ minHeight: "44px", maxHeight: "120px" }}
            />
          </div>

          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSending || !isConnected}
            className={`p-3 rounded-2xl transition-all duration-200 ${
              newMessage.trim() && isConnected && !isSending
                ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white hover:shadow-lg hover:shadow-blue-500/25"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isSending ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatRoom
