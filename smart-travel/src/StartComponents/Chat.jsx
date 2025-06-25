"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../assets/Context/AuthContext"
import { useTheme } from "../assets/Context/ThemeContext"
import { useSocket } from "../Hooks/UseSocket"
import axios from "axios"
import {
  Send,
  ArrowLeft,
  MoreVertical,
  Smile,
  Paperclip,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  MessageCircle,
  UserCheck,
  Clock,
} from "lucide-react"
import { API_BASE_URL } from "../assets/Utils/Constants"

const Chat = () => {
  const { roomId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const { theme, toggleTheme, getThemeClasses } = useTheme()
  const {
    socket,
    isConnected,
    messages,
    setMessages,
    typingUsers,
    sendMessage,
    joinChat,
    leaveChat,
    startTyping,
    stopTyping,
  } = useSocket()

  // ✅ NEW: Modern Chat State Management
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [otherUser, setOtherUser] = useState(null)
  const [roomInfo, setRoomInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState("unknown")

  // ✅ NEW: Refs for better UX
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const messageInputRef = useRef(null)

  const themeClasses = getThemeClasses()

  // Configure axios
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  // ✅ NEW: Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // ✅ NEW: Format time utilities
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

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

  // ✅ NEW: Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = {}
    messages.forEach((message) => {
      const date = formatDate(message.created_at)
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })
    return groups
  }

  // ✅ NEW: Message component
  const MessageBubble = ({ message, isOwn, showAvatar = true }) => (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}>
      {!isOwn && showAvatar && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mr-3 flex-shrink-0">
          {message.sender_avatar ? (
            <img
              src={message.sender_avatar || "/placeholder.svg"}
              alt={message.sender_name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-white text-sm font-bold">{message.sender_name?.charAt(0) || "U"}</span>
          )}
        </div>
      )}
      <div className={`max-w-xs lg:max-w-md ${isOwn ? "order-1" : "order-2"}`}>
        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwn
              ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
              : `${themeClasses.cardContent} border ${themeClasses.border}`
          }`}
        >
          <p className="text-sm">{message.message}</p>
        </div>
        <div className={`text-xs ${themeClasses.secondaryText} mt-1 ${isOwn ? "text-right" : "text-left"}`}>
          {formatTime(message.created_at)}
        </div>
      </div>
    </div>
  )

  // ✅ NEW: Connection status component
  const ConnectionStatusBadge = () => {
    const getStatusInfo = () => {
      switch (connectionStatus) {
        case "connected":
          return { icon: <UserCheck className="w-4 h-4" />, text: "Connected", color: "text-green-400" }
        case "pending":
          return { icon: <Clock className="w-4 h-4" />, text: "Pending", color: "text-yellow-400" }
        default:
          return { icon: <MessageCircle className="w-4 h-4" />, text: "Chat", color: themeClasses.secondaryText }
      }
    }

    const status = getStatusInfo()

    return (
      <div className={`flex items-center space-x-2 ${status.color}`}>
        {status.icon}
        <span className="text-sm font-medium">{status.text}</span>
      </div>
    )
  }

  // ✅ FIXED: Load messages and room info with Stream Chat integration
  useEffect(() => {
    if (!roomId || !user || !token) return

    const initializeChat = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get other user info from location state or fetch from API
        if (location.state?.otherUser) {
          setOtherUser(location.state.otherUser)
        }

        // Check room status
        const statusResponse = await api.get(`/chat/room-status/${roomId}`)
        if (statusResponse.data.success) {
          setConnectionStatus(statusResponse.data.status)
        }

        // Get room messages and info
        const messagesResponse = await api.get(`/chat/rooms/${roomId}/messages`)
        if (messagesResponse.data.success) {
          setMessages(messagesResponse.data.messages || [])
          setRoomInfo(messagesResponse.data.room)

          // Set other user info if not already set
          if (!otherUser && messagesResponse.data.participants) {
            const otherParticipant = messagesResponse.data.participants.find((p) => p.user_id !== user.id)
            if (otherParticipant) {
              setOtherUser({
                id: otherParticipant.user_id,
                name: otherParticipant.name,
                avatar_url: otherParticipant.avatar_url,
              })
            }
          }
        }

        // Join the chat room via socket
        if (socket && isConnected) {
          joinChat(roomId)
        }
      } catch (error) {
        console.error("❌ Error initializing chat:", error)
        setError("Failed to load chat. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    initializeChat()

    // Cleanup on unmount
    return () => {
      if (socket && isConnected) {
        leaveChat(roomId)
      }
    }
  }, [roomId, user, token, socket, isConnected])

  // ✅ NEW: Handle typing with debounce
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true)
      startTyping(roomId)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      stopTyping(roomId)
    }, 1000)
  }

  // ✅ NEW: Send message with Stream Chat
  const handleSendMessage = async (e) => {
    e.preventDefault()
    const messageText = newMessage.trim() // Declare messageText variable here
    if (!messageText || !socket || !isConnected) return

    try {
      setNewMessage("")

      // Stop typing
      if (isTyping) {
        setIsTyping(false)
        stopTyping(roomId)
      }

      // Send message through Stream Chat
      const sentMessage = await sendMessage(roomId, messageText)

      // Add message to local state for immediate UI update
      const localMessage = {
        id: sentMessage.id || Date.now(),
        message: messageText,
        sender_id: user.id,
        sender_name: user.name,
        sender_avatar: user.avatar_url,
        created_at: new Date().toISOString(),
        message_type: "text",
      }

      setMessages((prev) => [...prev, localMessage])
      console.log("✅ Message sent via Stream Chat")
    } catch (error) {
      console.error("❌ Failed to send message:", error)
      setNewMessage(messageText) // Restore message on error
    }
  }

  // ✅ NEW: Handle input change
  const handleInputChange = (e) => {
    setNewMessage(e.target.value)
    handleTyping()
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  if (loading) {
    return (
      <div
        className={`min-h-screen ${themeClasses.background} ${themeClasses.primaryText} flex items-center justify-center`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className={themeClasses.secondaryText}>Loading chat...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={`min-h-screen ${themeClasses.background} ${themeClasses.primaryText} flex items-center justify-center`}
      >
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate("/public-trips")}
            className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
          >
            Back to Public Trips
          </button>
        </div>
      </div>
    )
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className={`min-h-screen ${themeClasses.background} ${themeClasses.primaryText} flex flex-col`}>
      {/* ✅ NEW: Modern Chat Header */}
      <div className={`${themeClasses.cardContent} border-b ${themeClasses.border} px-6 py-4 sticky top-0 z-10`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/public-trips")}
              className="p-2 hover:bg-slate-700/50 rounded-xl transition-all duration-200 text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  {otherUser?.avatar_url ? (
                    <img
                      src={otherUser.avatar_url || "/placeholder.svg"}
                      alt={otherUser.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-lg">{otherUser?.name?.charAt(0) || "U"}</span>
                  )}
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-800 ${
                    isConnected ? "bg-green-500" : "bg-gray-500"
                  }`}
                />
              </div>

              <div>
                <h1 className="font-bold text-xl text-white">{otherUser?.name || "Travel Chat"}</h1>
                <ConnectionStatusBadge />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* ✅ NEW: Connection Status */}
            <div
              className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${
                isConnected
                  ? "bg-green-500/20 border-green-500/50 text-green-400"
                  : "bg-red-500/20 border-red-500/50 text-red-400"
              }`}
            >
              {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="text-xs font-medium">{isConnected ? "Online" : "Offline"}</span>
            </div>

            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${themeClasses.secondaryText} hover:${themeClasses.primaryText} transition-colors`}
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              className={`p-2 rounded-lg ${themeClasses.secondaryText} hover:${themeClasses.primaryText} transition-colors`}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ✅ FIXED: Messages Container with Stream Chat integration */}
      <div
        ref={messagesEndRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent"
      >
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-12 h-12 text-slate-500" />
            </div>
            <p className="text-slate-400 text-xl mb-2">No messages yet</p>
            <p className="text-slate-500">Start the conversation with {otherUser?.name}!</p>
            <p className="text-slate-600 text-sm mt-2">Powered by Stream Chat</p>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-6">
                <div
                  className={`px-3 py-1 rounded-full text-xs ${themeClasses.cardContent} border ${themeClasses.border} ${themeClasses.secondaryText}`}
                >
                  {date}
                </div>
              </div>

              {/* Messages for this date */}
              {dateMessages.map((message, index) => {
                const isOwn = message.sender_id === user.id
                const prevMessage = dateMessages[index - 1]
                const showAvatar = !prevMessage || prevMessage.sender_id !== message.sender_id

                return <MessageBubble key={message.id} message={message} isOwn={isOwn} showAvatar={showAvatar} />
              })}
            </div>
          ))
        )}

        {/* ✅ FIXED: Typing Indicator with Stream Chat */}
        {typingUsers.size > 0 && (
          <div className="flex justify-start mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mr-3">
              <span className="text-white text-sm font-bold">{otherUser?.name?.charAt(0) || "U"}</span>
            </div>
            <div className={`px-4 py-2 rounded-2xl ${themeClasses.cardContent} border ${themeClasses.border}`}>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ✅ FIXED: Modern Message Input with Stream Chat */}
      <div className={`${themeClasses.cardContent} border-t ${themeClasses.border} p-6`}>
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <button
            type="button"
            className={`p-2 rounded-lg ${themeClasses.secondaryText} hover:${themeClasses.primaryText} transition-colors`}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            <input
              ref={messageInputRef}
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              placeholder="Type a message..."
              disabled={!isConnected || connectionStatus !== "connected"}
              className={`w-full ${themeClasses.input} rounded-full pl-4 pr-12 py-3 focus:outline-none focus:border-cyan-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            />
            <button
              type="button"
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg ${themeClasses.secondaryText} hover:${themeClasses.primaryText} transition-colors`}
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>

          <button
            type="submit"
            disabled={!newMessage.trim() || !isConnected || connectionStatus !== "connected"}
            className={`p-3 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              newMessage.trim() && isConnected && connectionStatus === "connected"
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg"
                : `${themeClasses.cardContent} border ${themeClasses.border} ${themeClasses.secondaryText}`
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        {connectionStatus !== "connected" && (
          <div className="mt-2 text-center">
            <p className={`text-xs ${themeClasses.secondaryText}`}>
              {connectionStatus === "pending"
                ? "Connection pending. You can chat once the other user accepts."
                : "You need to be connected to send messages."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Chat
