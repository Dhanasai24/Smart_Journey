"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "../assets/Context/AuthContext"
import { useTheme } from "../assets/Context/ThemeContext"
import { useSocket } from "../Hooks/UseSocket"
import { useNavigate } from "react-router-dom"
import { API_BASE_URL } from "../assets/Utils/Constants"
import axios from "axios"
import UserLocationModal from "./UserLocationModal"
import {
  Users,
  Search,
  Filter,
  MapPin,
  Calendar,
  DollarSign,
  MessageCircle,
  Heart,
  Globe,
  Moon,
  Sun,
  X,
  Check,
  Bell,
  CheckCircle,
  UserMinus,
  Wifi,
  WifiOff,
  Navigation,
  Send,
  Minimize2,
  Maximize2,
  Sparkles,
  Zap,
  TrendingUp,
  Activity,
  Smile,
  Paperclip,
  File,
  FileText,
  Music,
  Video,
  ImageIcon,
  Download,
  Trash2,
} from "lucide-react"

const SocialTravel = () => {
  const { user, token } = useAuth()
  const { theme, toggleTheme, getThemeClasses } = useTheme()
  const navigate = useNavigate()

  const {
    socket,
    isConnected,
    matchedTravelers,
    connectionRequests,
    setConnectionRequests,
    messages,
    setMessages,
    sendMessage,
    joinChat,
    leaveChat,
    startTyping,
    stopTyping,
    typingUsers,
  } = useSocket()

  // State
  const [activeTab, setActiveTab] = useState("discover")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [publicTrips, setPublicTrips] = useState([])
  const [connectedChats, setConnectedChats] = useState([])
  const [nearbyTravelers, setNearbyTravelers] = useState([])
  const [connectingUsers, setConnectingUsers] = useState(new Set())
  const [disconnectingUsers, setDisconnectingUsers] = useState(new Set())
  const [userLocation, setUserLocation] = useState(null)
  const [locationPermission, setLocationPermission] = useState("prompt")
  const [showNotifications, setShowNotifications] = useState(false)
  const [messageNotifications, setMessageNotifications] = useState([])

  // Enhanced chat features state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  // Location modal state
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [selectedUserForLocation, setSelectedUserForLocation] = useState(null)

  // Mini chat window state
  const [miniChatWindow, setMiniChatWindow] = useState(null)
  const [isMiniChatMinimized, setIsMiniChatMinimized] = useState(false)

  // Message state
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  // Message selection and deletion state
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedMessages, setSelectedMessages] = useState(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Refs
  const messageInputRef = useRef(null)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const chatContainerRef = useRef(null)
  const fileInputRef = useRef(null)
  const emojiPickerRef = useRef(null)

  // Connection status
  const connectionStatusRef = useRef(new Map())
  const lastRealtimeUpdate = useRef(0)

  const [stats, setStats] = useState({
    activeTravelers: 0,
    activeChats: 0,
    nearbyTravelers: 0,
  })
  const [nearbyMode, setNearbyMode] = useState("geolocation")

  const themeClasses = getThemeClasses()

  // Enhanced emoji categories with more emojis
  const emojiCategories = {
    smileys: [
      "😀",
      "😃",
      "😄",
      "😁",
      "😆",
      "😅",
      "😂",
      "🤣",
      "😊",
      "😇",
      "🙂",
      "🙃",
      "😉",
      "😌",
      "😍",
      "🥰",
      "😘",
      "😗",
      "😙",
      "😚",
      "😋",
      "😛",
      "😝",
      "😜",
      "🤪",
      "🤨",
      "🧐",
      "🤓",
      "😎",
      "🤩",
      "🥳",
      "😏",
      "😒",
      "😞",
      "😔",
      "😟",
      "😕",
      "🙁",
      "☹️",
      "😣",
    ],
    gestures: [
      "👍",
      "👎",
      "👌",
      "🤌",
      "🤏",
      "✌️",
      "🤞",
      "🤟",
      "🤘",
      "🤙",
      "👈",
      "👉",
      "👆",
      "👇",
      "☝️",
      "👋",
      "🤚",
      "🖐️",
      "✋",
      "🖖",
      "👏",
      "🙌",
      "🤲",
      "🤝",
      "🙏",
      "✍️",
      "💪",
      "🦾",
      "🦿",
      "🦵",
    ],
    hearts: [
      "❤️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🖤",
      "🤍",
      "🤎",
      "💔",
      "❣️",
      "💕",
      "💞",
      "💓",
      "💗",
      "💖",
      "💘",
      "💝",
      "💟",
      "💌",
    ],
    travel: [
      "✈️",
      "🚗",
      "🚕",
      "🚙",
      "🚌",
      "🚎",
      "🏎️",
      "🚓",
      "🚑",
      "🚒",
      "🚐",
      "🛻",
      "🚚",
      "🚛",
      "🚜",
      "🏍️",
      "🛵",
      "🚲",
      "🛴",
      "🛹",
      "🛼",
      "🚁",
      "🛸",
      "🚀",
      "🛥️",
      "🚤",
      "⛵",
      "🛳️",
      "⚓",
      "🗺️",
      "🧳",
      "🎒",
      "👜",
      "💼",
      "🌍",
      "🌎",
      "🌏",
      "🗾",
      "🏔️",
      "⛰️",
    ],
    food: [
      "🍎",
      "🍊",
      "🍋",
      "🍌",
      "🍉",
      "🍇",
      "🍓",
      "🫐",
      "🍈",
      "🍒",
      "🍑",
      "🥭",
      "🍍",
      "🥥",
      "🥝",
      "🍅",
      "🍆",
      "🥑",
      "🥦",
      "🥬",
      "🥒",
      "🌶️",
      "🫑",
      "🌽",
      "🥕",
      "🫒",
      "🧄",
      "🧅",
      "🥔",
      "🍠",
    ],
    activities: [
      "⚽",
      "🏀",
      "🏈",
      "⚾",
      "🥎",
      "🎾",
      "🏐",
      "🏉",
      "🥏",
      "🎱",
      "🪀",
      "🏓",
      "🏸",
      "🏒",
      "🏑",
      "🥍",
      "🏏",
      "🪃",
      "🥅",
      "⛳",
      "🪁",
      "🏹",
      "🎣",
      "🤿",
      "🥊",
      "🥋",
      "🎽",
      "🛹",
      "🛼",
      "🛷",
    ],
  }

  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  const showToast = useCallback((message, type = "info") => {
    const toast = document.createElement("div")
    toast.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
      type === "success"
        ? "bg-green-500 text-white"
        : type === "error"
          ? "bg-red-500 text-white"
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
  }, [])

  // Enhanced emoji selection handler
  const handleEmojiSelect = useCallback(
    (emoji) => {
      const input = messageInputRef.current
      if (input) {
        const start = input.selectionStart
        const end = input.selectionEnd
        const currentValue = newMessage
        const newValue = currentValue.substring(0, start) + emoji + currentValue.substring(end)

        setNewMessage(newValue)
        setShowEmojiPicker(false)

        // Restore cursor position after emoji insertion
        setTimeout(() => {
          input.focus()
          input.setSelectionRange(start + emoji.length, start + emoji.length)
        }, 0)
      }
    },
    [newMessage],
  )

  // Enhanced file selection handler
  const handleFileSelect = useCallback(
    (event) => {
      const file = event.target.files[0]
      if (!file) return

      // File size validation (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        showToast("File size must be less than 10MB", "error")
        return
      }

      // File type validation
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "audio/mpeg",
        "audio/wav",
        "video/mp4",
        "video/webm",
      ]

      if (!allowedTypes.includes(file.type)) {
        showToast("File type not supported", "error")
        return
      }

      setSelectedFile(file)

      // Generate preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => setFilePreview(e.target.result)
        reader.readAsDataURL(file)
      } else {
        setFilePreview(null)
      }

      showToast(`File "${file.name}" selected`, "success")
    },
    [showToast],
  )

  // File drag and drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const files = e.dataTransfer.files
      if (files && files[0]) {
        const file = files[0]
        handleFileSelect({ target: { files: [file] } })
      }
    },
    [handleFileSelect],
  )

  // File utility functions
  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }, [])

  const getFileIcon = useCallback((fileType) => {
    if (fileType && fileType.startsWith("image/")) return <ImageIcon className="w-5 h-5" />
    if (fileType && fileType.startsWith("video/")) return <Video className="w-5 h-5" />
    if (fileType && fileType.startsWith("audio/")) return <Music className="w-5 h-5" />
    if (fileType && (fileType.includes("pdf") || fileType.includes("document"))) return <FileText className="w-5 h-5" />
    return <File className="w-5 h-5" />
  }, [])

  // Enhanced message file rendering
  const renderMessageFile = useCallback(
    (message) => {
      if (!message.file_url && !message.file_name) return null

      const isImage = message.file_type?.startsWith("image/")
      const isVideo = message.file_type?.startsWith("video/")
      const isAudio = message.file_type?.startsWith("audio/")

      return (
        <div className="mt-2">
          {isImage && (
            <div className="relative group">
              <img
                src={message.file_url || "/placeholder.svg"}
                alt={message.file_name || "Image"}
                className="max-w-xs rounded-lg shadow-lg cursor-pointer transition-transform hover:scale-105"
                onClick={() => window.open(message.file_url, "_blank")}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                <Download className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          )}

          {isVideo && (
            <div className="relative">
              <video
                src={message.file_url}
                controls
                className="max-w-xs rounded-lg shadow-lg"
                style={{ maxHeight: "200px" }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {isAudio && (
            <div className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-slate-700 rounded-lg max-w-xs">
              <Music className="w-6 h-6 text-blue-500" />
              <div className="flex-1">
                <audio src={message.file_url} controls className="w-full">
                  Your browser does not support the audio tag.
                </audio>
              </div>
            </div>
          )}

          {!isImage && !isVideo && !isAudio && (
            <div
              className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-slate-700 rounded-lg max-w-xs cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              onClick={() => window.open(message.file_url, "_blank")}
            >
              {getFileIcon(message.file_type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{message.file_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {message.file_size ? formatFileSize(message.file_size) : "Unknown size"}
                </p>
              </div>
              <Download className="w-4 h-4 text-gray-500" />
            </div>
          )}
        </div>
      )
    },
    [getFileIcon, formatFileSize],
  )

  // Handle view location click
  const handleViewLocation = useCallback((trip) => {
    if (!trip?.user_id) return

    setSelectedUserForLocation({
      userId: trip.user_id,
      userName: trip.user_name || trip.display_name || trip.name || `User ${trip.user_id}`,
    })
    setShowLocationModal(true)
  }, [])

  // Connection status management
  const updateConnectionStatus = useCallback((userId, status, roomId) => {
    console.log(`🔄 PERSISTENT UPDATE: User ${userId} -> ${status}`)

    connectionStatusRef.current.set(userId, { status, roomId, timestamp: Date.now() })

    const updateFunction = (items) => {
      if (!Array.isArray(items)) return items
      return items.map((item) => {
        if (item.user_id === userId) {
          return { ...item, connection_status: status, room_id: roomId }
        }
        return item
      })
    }

    setPublicTrips(updateFunction)
    setNearbyTravelers(updateFunction)

    // Persist to localStorage
    if (status === "connected") {
      try {
        const existingConnections = JSON.parse(localStorage.getItem("connectedUsers") || "{}")
        existingConnections[userId] = { status, roomId, timestamp: Date.now() }
        localStorage.setItem("connectedUsers", JSON.stringify(existingConnections))
        console.log(`💾 SAVED connection for user ${userId} to localStorage`)
      } catch (error) {
        console.error("Failed to save connection to localStorage:", error)
      }
    } else if (status === "none" || status === "declined") {
      try {
        const existingConnections = JSON.parse(localStorage.getItem("connectedUsers") || "{}")
        delete existingConnections[userId]
        localStorage.setItem("connectedUsers", JSON.stringify(existingConnections))
        console.log(`🗑️ REMOVED connection for user ${userId} from localStorage`)
      } catch (error) {
        console.error("Failed to remove connection from localStorage:", error)
      }
    }
  }, [])

  // Load persistent connections on mount
  useEffect(() => {
    try {
      const savedConnections = JSON.parse(localStorage.getItem("connectedUsers") || "{}")
      Object.entries(savedConnections).forEach(([userId, data]) => {
        connectionStatusRef.current.set(Number.parseInt(userId), data)
        console.log(`🔄 RESTORED connection for user ${userId}: ${data.status}`)
      })
    } catch (error) {
      console.error("Failed to load connections from localStorage:", error)
    }
  }, [])

  // Apply persistent connections to fetched data
  const applyPersistedConnections = useCallback((items) => {
    if (!Array.isArray(items)) return items
    return items.map((item) => {
      if (!item?.user_id) return item
      const connection = connectionStatusRef.current.get(item.user_id)
      if (connection) {
        return {
          ...item,
          connection_status: connection.status,
          room_id: connection.roomId,
        }
      }
      return item
    })
  }, [])

  // Location permission with database storage
  const requestLocationPermission = useCallback(async () => {
    try {
      setLocationPermission("requesting")
      console.log("📍 Requesting location permission...")

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        })
      })

      const { latitude, longitude } = position.coords
      console.log(`📍 Location obtained: ${latitude}, ${longitude}`)

      try {
        const locationResponse = await api.post("/social/location", {
          latitude,
          longitude,
          location_name: "Current Location",
        })

        if (locationResponse.data?.success) {
          const locationData = locationResponse.data.location
          setUserLocation({
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            city: locationData.city,
            state: locationData.state,
            country: locationData.country,
            formatted_address: locationData.formatted_address,
          })

          setLocationPermission("granted")
          showToast(
            `Location updated successfully! ${locationData.formatted_address || "Coordinates stored"}`,
            "success",
          )

          console.log("✅ Location stored in database:", locationData)

          if (activeTab === "nearby") {
            fetchNearbyTravelers()
          }
        } else {
          throw new Error("Failed to store location in database")
        }
      } catch (locationError) {
        console.error("❌ Failed to store location:", locationError)
        setUserLocation({ latitude, longitude })
        setLocationPermission("granted")
        showToast("Location obtained but failed to store in database", "error")
      }
    } catch (error) {
      console.error("Location error:", error)
      setLocationPermission("denied")
      showToast("Location access denied. Some features may be limited.", "error")
    }
  }, [activeTab, api, showToast])

  // Fetch data functions
  const fetchPublicTrips = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get("/social/discover", {
        params: { destination: searchQuery, limit: 20 },
      })

      if (response.data?.success) {
        const trips = Array.isArray(response.data.travelers) ? response.data.travelers : []
        const tripsWithConnections = applyPersistedConnections(trips)
        setPublicTrips(tripsWithConnections)
        setStats((prev) => ({ ...prev, activeTravelers: tripsWithConnections.length }))
      }
    } catch (error) {
      console.error("Error fetching public trips:", error)
      showToast("Failed to load public trips", "error")
    } finally {
      setLoading(false)
    }
  }, [searchQuery, applyPersistedConnections, showToast, api])

  const fetchConnectedChats = useCallback(async () => {
    try {
      const response = await api.get("/social/chats")
      if (response.data?.success) {
        const chats = Array.isArray(response.data.chats) ? response.data.chats : []

        const chatsWithConnections = chats.map((chat) => {
          const connection = connectionStatusRef.current.get(chat.user_id)
          return {
            ...chat,
            connection_status: connection?.status || "connected",
            room_id: connection?.roomId || chat.room_id,
            last_message: chat.last_message || "No messages yet",
            last_message_time: chat.last_message_time || new Date().toISOString(),
          }
        })

        setConnectedChats(chatsWithConnections)
        setStats((prev) => ({ ...prev, activeChats: chatsWithConnections.length }))
      }
    } catch (error) {
      console.error("Error fetching connected chats:", error)
      showToast("Failed to load connected chats", "error")
    }
  }, [showToast, api])

  // Fetch nearby travelers with better location data
  const fetchNearbyTravelers = useCallback(async () => {
    try {
      setLoading(true)
      let response

      if (nearbyMode === "distance") {
        response = await api.get("/social/nearby-distance", { params: { limit: 20 } })
      } else if (userLocation && userLocation.latitude && userLocation.longitude) {
        response = await api.get("/social/nearby", {
          params: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            radius: 50,
            limit: 20,
          },
        })
      } else {
        console.log("📍 No user location available, falling back to distance-based nearby")
        response = await api.get("/social/nearby-distance", { params: { limit: 20 } })
      }

      if (response?.data?.success) {
        const nearby = Array.isArray(response.data.nearbyTravelers) ? response.data.nearbyTravelers : []

        const nearbyWithDistances = await Promise.all(
          nearby.map(async (traveler) => {
            const enhancedTraveler = { ...traveler }

            if (userLocation?.latitude && userLocation?.longitude && traveler.latitude && traveler.longitude) {
              const distance = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                traveler.latitude,
                traveler.longitude,
              )

              enhancedTraveler.calculated_distance = distance
              enhancedTraveler.distance_text =
                distance < 1 ? `${Math.round(distance * 1000)}m away` : `${distance.toFixed(1)}km away`
            }

            return enhancedTraveler
          }),
        )

        const nearbyWithConnections = applyPersistedConnections(nearbyWithDistances)
        setNearbyTravelers(nearbyWithConnections)
        setStats((prev) => ({ ...prev, nearbyTravelers: nearbyWithConnections.length }))

        console.log(`✅ Found ${nearbyWithConnections.length} nearby travelers`)
      }
    } catch (error) {
      console.error("Error fetching nearby travelers:", error)
      showToast("Failed to load nearby travelers", "error")
    } finally {
      setLoading(false)
    }
  }, [nearbyMode, userLocation, applyPersistedConnections, showToast, api])

  // Helper function to calculate distance between two coordinates
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }, [])

  // Message deletion functions
  const handleDeleteMessage = useCallback(
    async (messageId) => {
      if (!socket || !isConnected || !miniChatWindow?.roomId) return

      try {
        console.log(`🗑️ Deleting message: ${messageId}`)

        // Make API call to permanently delete from database
        const response = await api.post(`/chat/messages/delete`, {
          messageId: messageId,
          roomId: miniChatWindow.roomId,
        })

        if (response.data?.success) {
          // Emit socket event to notify other users
          socket.emit("delete_message", {
            messageId,
            roomId: miniChatWindow.roomId,
            userId: user.id,
          })

          // Remove from local state immediately for better UX
          setMessages((prev) => prev.filter((msg) => msg.id !== messageId))

          showToast("Message deleted permanently", "success")
          console.log("✅ Message deleted permanently from database")
        } else {
          throw new Error(response.data?.message || "Failed to delete message")
        }
      } catch (error) {
        console.error("❌ Failed to delete message:", error)
        showToast("Failed to delete message", "error")
      }
    },
    [socket, isConnected, miniChatWindow?.roomId, user.id, setMessages, showToast, api],
  )

  const handleBulkDeleteMessages = useCallback(async () => {
    if (!socket || !isConnected || !miniChatWindow?.roomId || selectedMessages.size === 0) return

    try {
      console.log(`🗑️ Bulk deleting ${selectedMessages.size} messages`)

      const messageIds = Array.from(selectedMessages)

      // Make API call to permanently delete from database
      const response = await api.post("/chat/messages/bulk-delete", {
        messageIds: messageIds,
        roomId: miniChatWindow.roomId,
      })

      if (response.data?.success) {
        // Emit socket event to notify other users
        socket.emit("bulk_delete_messages", {
          messageIds,
          roomId: miniChatWindow.roomId,
          userId: user.id,
        })

        // Remove from local state immediately
        setMessages((prev) => prev.filter((msg) => !selectedMessages.has(msg.id)))

        // Reset selection
        setSelectedMessages(new Set())
        setSelectionMode(false)
        setShowDeleteConfirm(false)

        showToast(`${response.data.deletedCount || messageIds.length} messages deleted permanently`, "success")
        console.log(`✅ ${response.data.deletedCount || messageIds.length} messages deleted permanently from database`)
      } else {
        throw new Error(response.data?.message || "Failed to delete messages")
      }
    } catch (error) {
      console.error("❌ Failed to bulk delete messages:", error)
      showToast("Failed to delete messages", "error")
    }
  }, [socket, isConnected, miniChatWindow?.roomId, selectedMessages, user.id, setMessages, showToast, api])

  const toggleMessageSelection = useCallback((messageId) => {
    setSelectedMessages((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
      } else {
        newSet.add(messageId)
      }
      return newSet
    })
  }, [])

  const selectAllMessages = useCallback(() => {
    const userMessages = messages.filter((msg) => msg.sender_id === user.id)
    setSelectedMessages(new Set(userMessages.map((msg) => msg.id)))
  }, [messages, user.id])

  const clearSelection = useCallback(() => {
    setSelectedMessages(new Set())
    setSelectionMode(false)
  }, [])

  const enterSelectionMode = useCallback(() => {
    setSelectionMode(true)
    setSelectedMessages(new Set())
  }, [])

  // Real-time connection handling
  useEffect(() => {
    if (!socket) return

    const handleConnectionRequest = (data) => {
      console.log("🔔 REAL-TIME: Received connection request:", data)
      setConnectionRequests((prev) => [
        ...prev,
        {
          id: Date.now(),
          fromUserId: data.fromUserId,
          fromUserName: data.fromUserName,
          fromUserAvatar: data.fromUserAvatar,
          roomId: data.roomId,
          tripId: data.tripId,
          message: data.message,
          timestamp: new Date().toISOString(),
        },
      ])
      showToast(`${data.fromUserName} wants to connect with you!`, "info")
    }

    const handleConnectionAccepted = (data) => {
      console.log("✅ REAL-TIME: Connection accepted:", data)
      const targetUserId = data.updateTargetUserId || data.fromUserId
      const roomId = data.roomId
      console.log(`🔄 Updating UI: User ${targetUserId} should show as connected`)
      updateConnectionStatus(targetUserId, "connected", roomId)
      showToast(`Connection accepted! You can now chat.`, "success")
      fetchConnectedChats()
      lastRealtimeUpdate.current = Date.now()
    }

    const handleConnectionRejected = (data) => {
      console.log("❌ REAL-TIME: Connection rejected:", data)
      const userId = data.fromUserId
      updateConnectionStatus(userId, "declined", null)
      showToast(`Connection request was declined`, "info")
      lastRealtimeUpdate.current = Date.now()
    }

    const handleConnectionReady = (data) => {
      console.log("🚀 REAL-TIME: Connection ready:", data)
      const targetUserId = data.updateTargetUserId || data.otherUserId
      const roomId = data.roomId
      console.log(`🔄 Connection ready: User ${targetUserId} should show as connected`)
      updateConnectionStatus(targetUserId, "connected", roomId)
      fetchConnectedChats()
    }

    const handleConnectionDisconnected = (data) => {
      console.log("🔌 REAL-TIME: Connection disconnected:", data)
      updateConnectionStatus(data.fromUserId, "none", null)
      showToast(`${data.fromUserName} disconnected from you`, "info")
      fetchConnectedChats()
    }

    const handleChatMessageNotification = (data) => {
      console.log("💬 REAL-TIME: Chat message notification:", data)

      setConnectedChats((prev) =>
        prev.map((chat) => {
          if (chat.user_id === data.senderId || chat.room_id === data.roomId) {
            return {
              ...chat,
              last_message: data.message,
              last_message_time: data.timestamp,
              unread_count: (chat.unread_count || 0) + 1,
            }
          }
          return chat
        }),
      )

      setMessageNotifications((prev) => [
        ...prev,
        {
          id: Date.now(),
          senderId: data.senderId,
          senderName: data.senderName,
          senderAvatar: data.senderAvatar,
          message: data.message,
          roomId: data.roomId,
          timestamp: data.timestamp,
          preview: data.message.length > 50 ? data.message.substring(0, 50) + "..." : data.message,
        },
      ])

      showToast(`New message from ${data.senderName}`, "info")
    }

    const handleMessageDeleted = (data) => {
      console.log("🗑️ REAL-TIME: Message deleted:", data)
      setMessages((prev) => prev.filter((msg) => msg.id !== data.messageId))
    }

    const handleBulkMessagesDeleted = (data) => {
      console.log("🗑️ REAL-TIME: Bulk messages deleted:", data)
      setMessages((prev) => prev.filter((msg) => !data.messageIds.includes(msg.id)))
    }

    socket.on("connection-requested", handleConnectionRequest)
    socket.on("connection-accepted", handleConnectionAccepted)
    socket.on("connection-rejected", handleConnectionRejected)
    socket.on("connection-ready", handleConnectionReady)
    socket.on("connection-disconnected", handleConnectionDisconnected)
    socket.on("chat-message-notification", handleChatMessageNotification)
    socket.on("message_deleted", handleMessageDeleted)
    socket.on("bulk_messages_deleted", handleBulkMessagesDeleted)

    return () => {
      socket.off("connection-requested", handleConnectionRequest)
      socket.off("connection-accepted", handleConnectionAccepted)
      socket.off("connection-rejected", handleConnectionRejected)
      socket.off("connection-ready", handleConnectionReady)
      socket.off("connection-disconnected", handleConnectionDisconnected)
      socket.off("chat-message-notification", handleChatMessageNotification)
      socket.off("message_deleted", handleMessageDeleted)
      socket.off("bulk_messages_deleted", handleBulkMessagesDeleted)
    }
  }, [socket, updateConnectionStatus, showToast, fetchConnectedChats, setMessages])

  // Connection handlers
  const handleConnectClick = useCallback(
    async (trip) => {
      if (!trip?.user_id || connectingUsers.has(trip.user_id)) return

      if (trip.connection_status === "pending" && !trip.canResend) {
        showToast("Connection request already pending. Please wait for response.", "info")
        return
      }

      const requestKey = `connect_${trip.user_id}_${Date.now()}`
      if (handleConnectClick.lastRequest && Date.now() - handleConnectClick.lastRequest < 2000) {
        console.log("🚫 Connection request blocked - too frequent")
        return
      }
      handleConnectClick.lastRequest = Date.now()

      try {
        console.log(`🔗 REAL-TIME: Sending connection request to user ${trip.user_id}`)
        setConnectingUsers((prev) => new Set(prev).add(trip.user_id))

        if (trip.connection_status === "connected" && trip.room_id) {
          openMiniChat(trip)
          return
        }

        updateConnectionStatus(trip.user_id, "connecting", null)

        const response = await api.post("/chat/connect", {
          targetUserId: trip.user_id,
        })

        if (response.data?.success && response.data.roomId) {
          if (socket && isConnected) {
            socket.emit("send-connection-request", {
              fromUserId: user.id,
              fromUserName: user.name,
              fromUserAvatar: user.avatar_url,
              toUserId: trip.user_id,
              tripId: trip.id,
              roomId: response.data.roomId,
              message: `${user.name} wants to connect about your trip to ${trip.destination}`,
            })
          }

          updateConnectionStatus(trip.user_id, "pending", response.data.roomId)
          showToast("Connection request sent! It will expire in 10 minutes if not responded.", "success")

          setTimeout(
            () => {
              const currentConnection = connectionStatusRef.current.get(trip.user_id)
              if (currentConnection?.status === "pending") {
                updateConnectionStatus(trip.user_id, "expired", null)
                showToast("Connection request expired. You can send a new request.", "info")
              }
            },
            10 * 60 * 1000,
          )
        } else {
          throw new Error("Failed to send connection request")
        }
      } catch (error) {
        console.error("❌ Error connecting to user:", error)
        updateConnectionStatus(trip.user_id, "none", null)
        showToast("Failed to send connection request. Please try again.", "error")
      } finally {
        setConnectingUsers((prev) => {
          const newSet = new Set(prev)
          newSet.delete(trip.user_id)
          return newSet
        })
      }
    },
    [user, showToast, socket, isConnected, updateConnectionStatus, connectingUsers, api],
  )

  const handleConnectionResponse = useCallback(
    async (request, accepted) => {
      try {
        setConnectionRequests((prev) => prev.filter((req) => req.id !== request.id))

        if (accepted) {
          updateConnectionStatus(request.fromUserId, "connected", request.roomId)

          await api.post("/chat/accept-connection", {
            fromUserId: request.fromUserId,
            roomId: request.roomId,
          })

          if (socket && isConnected) {
            socket.emit("accept-connection-request", {
              fromUserId: request.fromUserId,
              toUserId: user.id,
              roomId: request.roomId,
            })
          }

          showToast("Connection accepted! You can now chat.", "success")
          fetchConnectedChats()
        } else {
          updateConnectionStatus(request.fromUserId, "declined", null)

          if (socket && isConnected) {
            socket.emit("reject-connection-request", {
              fromUserId: request.fromUserId,
              toUserId: user.id,
              roomId: request.roomId,
            })
          }

          showToast("Connection request declined", "info")
        }
      } catch (error) {
        console.error("❌ Error handling connection response:", error)
        showToast("Failed to process connection request. Please try again.", "error")
      }
    },
    [updateConnectionStatus, showToast, fetchConnectedChats, socket, isConnected, user, api],
  )

  const handleDisconnectClick = useCallback(
    async (trip) => {
      if (!trip?.user_id || disconnectingUsers.has(trip.user_id)) return

      try {
        setDisconnectingUsers((prev) => new Set(prev).add(trip.user_id))
        updateConnectionStatus(trip.user_id, "disconnecting", null)

        const response = await api.post("/chat/disconnect", {
          targetUserId: trip.user_id,
        })

        if (response.data?.success) {
          updateConnectionStatus(trip.user_id, "none", null)

          if (socket && isConnected) {
            socket.emit("disconnect-user", {
              fromUserId: user.id,
              toUserId: trip.user_id,
            })
          }

          if (miniChatWindow?.otherUser?.id === trip.user_id) {
            setMiniChatWindow(null)
          }

          showToast("Successfully disconnected from user", "success")
          fetchConnectedChats()
        }
      } catch (error) {
        console.error("❌ Error disconnecting from user:", error)
        showToast("Failed to disconnect from user. Please try again.", "error")
        updateConnectionStatus(trip.user_id, "connected", trip.room_id)
      } finally {
        setDisconnectingUsers((prev) => {
          const newSet = new Set(prev)
          newSet.delete(trip.user_id)
          return newSet
        })
      }
    },
    [
      updateConnectionStatus,
      showToast,
      fetchConnectedChats,
      disconnectingUsers,
      socket,
      isConnected,
      user,
      miniChatWindow,
      api,
    ],
  )

  // Mini chat functions
  const openMiniChat = useCallback(
    (userTrip) => {
      if (!userTrip?.user_id || userTrip.connection_status !== "connected") {
        showToast("Please connect with this user first.", "info")
        return
      }

      const otherUser = {
        id: userTrip.user_id,
        name: userTrip.user_name || userTrip.display_name || userTrip.name || `User ${userTrip.user_id}`,
        avatar_url: userTrip.avatar_url || userTrip.user_avatar || null,
      }

      setMiniChatWindow({
        otherUser,
        roomId: userTrip.room_id,
        isOpen: true,
      })
      setIsMiniChatMinimized(false)

      setNewMessage("")
      setIsTyping(false)
      setSelectedFile(null)
      setFilePreview(null)
      setShowEmojiPicker(false)
      setSelectionMode(false)
      setSelectedMessages(new Set())

      if (socket && isConnected) {
        console.log(`🚪 Opening chat with ${otherUser.name}, joining room: ${userTrip.room_id}`)
        joinChat(userTrip.room_id)

        socket.emit("get_chat_history", {
          roomId: userTrip.room_id,
          userId: user.id,
          limit: 50,
        })
      }

      setTimeout(() => {
        if (messageInputRef.current) {
          messageInputRef.current.focus()
          console.log("🎯 Input focused successfully")
        }
      }, 500)
    },
    [showToast, socket, isConnected, joinChat, user.id],
  )

  const closeMiniChat = useCallback(() => {
    if (miniChatWindow?.roomId && socket && isConnected) {
      leaveChat(miniChatWindow.roomId)
    }
    setMiniChatWindow(null)
    setMessages([])
    setNewMessage("")
    setIsTyping(false)
    setSelectedFile(null)
    setFilePreview(null)
    setShowEmojiPicker(false)
    setSelectionMode(false)
    setSelectedMessages(new Set())

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }, [miniChatWindow, socket, isConnected, leaveChat, setMessages])

  const handleSendMessage = useCallback(
    async (e) => {
      e.preventDefault()
      e.stopPropagation()

      const messageText = newMessage.trim()
      if ((!messageText && !selectedFile) || !socket || !isConnected || !miniChatWindow?.roomId) {
        console.log("❌ Cannot send message - missing requirements")
        return
      }

      try {
        console.log(`📤 Sending message: "${messageText}"`)

        const finalMessage = messageText
        let messageData = {
          message: finalMessage,
          file_name: null,
          file_type: null,
          file_size: null,
          file_url: null,
        }

        // Handle file attachment
        if (selectedFile) {
          // Convert file to base64 for transmission
          const reader = new FileReader()
          reader.onload = async () => {
            messageData = {
              message: messageText || `📎 ${selectedFile.name}`,
              file_name: selectedFile.name,
              file_type: selectedFile.type,
              file_size: selectedFile.size,
              file_url: reader.result, // Base64 data URL
            }

            setNewMessage("")
            setSelectedFile(null)
            setFilePreview(null)

            if (isTyping) {
              setIsTyping(false)
              stopTyping(miniChatWindow.roomId)
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
              }
            }

            // Send message with file data
            await sendMessage(miniChatWindow.roomId, messageData.message, messageData)
            console.log("✅ Message with file sent successfully")
            showToast(`File "${selectedFile.name}" sent with message`, "success")

            setTimeout(() => {
              if (messageInputRef.current) {
                messageInputRef.current.focus()
                console.log("🎯 Focus restored after send")
              }
            }, 100)
          }
          reader.readAsDataURL(selectedFile)
        } else {
          setNewMessage("")
          setSelectedFile(null)
          setFilePreview(null)

          if (isTyping) {
            setIsTyping(false)
            stopTyping(miniChatWindow.roomId)
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current)
            }
          }

          // Send text message
          await sendMessage(miniChatWindow.roomId, messageData.message, messageData)
          console.log("✅ Message sent successfully")

          setTimeout(() => {
            if (messageInputRef.current) {
              messageInputRef.current.focus()
              console.log("🎯 Focus restored after send")
            }
          }, 100)
        }
      } catch (error) {
        console.error("❌ Failed to send message:", error)
        setNewMessage(messageText)
        showToast("Failed to send message", "error")
      }
    },
    [newMessage, selectedFile, socket, isConnected, miniChatWindow, isTyping, stopTyping, sendMessage, showToast],
  )

  const handleInputChange = useCallback(
    (e) => {
      const value = e.target.value
      console.log(`📝 Input change: "${value}"`)

      setNewMessage(value)

      if (value.trim() && !isTyping && miniChatWindow?.roomId) {
        setIsTyping(true)
        startTyping(miniChatWindow.roomId)
        console.log("⌨️ Started typing indicator")
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      if (value.trim()) {
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false)
          if (miniChatWindow?.roomId) {
            stopTyping(miniChatWindow.roomId)
            console.log("⌨️ Stopped typing indicator")
          }
        }, 1500)
      } else {
        if (isTyping) {
          setIsTyping(false)
          if (miniChatWindow?.roomId) {
            stopTyping(miniChatWindow.roomId)
          }
        }
      }
    },
    [isTyping, miniChatWindow?.roomId, startTyping, stopTyping],
  )

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSendMessage(e)
      }
    },
    [handleSendMessage],
  )

  const handleChatFromChatsSection = useCallback(
    (chat) => {
      const userTrip = {
        user_id: chat.user_id,
        user_name: chat.user_name,
        avatar_url: chat.avatar_url,
        connection_status: "connected",
        room_id: chat.room_id,
      }
      openMiniChat(userTrip)
    },
    [openMiniChat],
  )

  // Enhanced theme toggle with smooth transitions for entire page
  const handleThemeToggle = useCallback(() => {
    console.log("🎨 Theme toggle clicked, current theme:", theme)

    // Add smooth transition to entire page
    document.documentElement.style.transition = "all 0.3s ease"
    document.body.style.transition = "all 0.3s ease"

    // Apply transition to all elements
    const allElements = document.querySelectorAll("*")
    allElements.forEach((element) => {
      element.style.transition = "background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease"
    })

    // Toggle the theme
    toggleTheme()

    // Remove transitions after animation completes
    setTimeout(() => {
      document.documentElement.style.transition = ""
      document.body.style.transition = ""
      allElements.forEach((element) => {
        element.style.transition = ""
      })
    }, 300)

    showToast(`Switched to ${theme === "dark" ? "light" : "dark"} theme`, "success")
  }, [theme, toggleTheme, showToast])

  // Click outside handlers for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showEmojiPicker])

  // Data fetching
  useEffect(() => {
    if (!token || !user?.id) return

    if (Date.now() - lastRealtimeUpdate.current < 3000) {
      console.log("⏭️ Skipping fetch due to recent real-time update")
      return
    }

    if (activeTab === "discover") {
      fetchPublicTrips()
    } else if (activeTab === "chats") {
      fetchConnectedChats()
    } else if (activeTab === "nearby") {
      fetchNearbyTravelers()
    }
  }, [token, user, activeTab, searchQuery, nearbyMode, userLocation])

  useEffect(() => {
    if (navigator.geolocation && locationPermission === "prompt") {
      requestLocationPermission()
    }
  }, [locationPermission, requestLocationPermission])

  // Handle incoming messages
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (messageData) => {
      console.log("📨 Received new message:", messageData)

      if (miniChatWindow?.roomId === messageData.room_id) {
        setMessages((prev) => {
          const exists = prev.some((msg) => msg.id === messageData.id)
          if (exists) return prev
          return [...prev, messageData]
        })
      }

      setConnectedChats((prev) =>
        prev.map((chat) => {
          if (chat.room_id === messageData.room_id) {
            return {
              ...chat,
              last_message: messageData.message,
              last_message_time: messageData.created_at,
              unread_count: miniChatWindow?.roomId === messageData.room_id ? 0 : (chat.unread_count || 0) + 1,
            }
          }
          return chat
        }),
      )
    }

    const handleChatHistory = (data) => {
      console.log("📜 Received chat history:", data)
      if (data.roomId === miniChatWindow?.roomId) {
        setMessages(data.messages || [])
      }
    }

    socket.on("new_message", handleNewMessage)
    socket.on("chat_history", handleChatHistory)

    return () => {
      socket.off("new_message", handleNewMessage)
      socket.off("chat_history", handleChatHistory)
    }
  }, [socket, miniChatWindow?.roomId, setMessages])

  // Auto-scroll messages
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
      })
    }
  }, [messages])

  // Focus management
  useEffect(() => {
    if (miniChatWindow && messageInputRef.current && document.activeElement !== messageInputRef.current) {
      const shouldFocus = !document.activeElement || document.activeElement === document.body
      if (shouldFocus) {
        setTimeout(() => {
          if (messageInputRef.current) {
            messageInputRef.current.focus()
            console.log("🎯 Auto-focus restored")
          }
        }, 100)
      }
    }
  }, [miniChatWindow, newMessage])

  // Enhanced Mini Chat Window Component with full functionality
  const MiniChatWindow = () => {
    if (!miniChatWindow) return null

    return (
      <div
        ref={chatContainerRef}
        className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ease-out ${
          isMiniChatMinimized ? "h-16" : "h-[600px]"
        } w-96 max-w-[calc(100vw-3rem)]`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Beautiful Chat Container */}
        <div
          className={`relative h-full rounded-3xl shadow-2xl border backdrop-blur-xl overflow-hidden transition-all duration-300 ${
            theme === "dark"
              ? "bg-gradient-to-br from-slate-900 via-slate-800 to-purple-900 border-slate-700/50"
              : "bg-gradient-to-br from-white via-blue-50 to-purple-50 border-white/20"
          } ${dragActive ? "ring-4 ring-cyan-500/50 ring-opacity-75" : ""}`}
        >
          {/* Drag overlay */}
          {dragActive && (
            <div className="absolute inset-0 bg-cyan-500/20 backdrop-blur-sm z-50 flex items-center justify-center rounded-3xl">
              <div className="text-center">
                <Paperclip className="w-12 h-12 text-cyan-500 mx-auto mb-2" />
                <p className="text-cyan-600 dark:text-cyan-400 font-semibold">Drop file to attach</p>
              </div>
            </div>
          )}

          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div
              className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
          </div>

          {/* Enhanced Chat Header with Selection Controls */}
          <div
            className={`relative z-10 flex items-center justify-between p-5 border-b backdrop-blur-sm ${
              theme === "dark" ? "border-slate-700/50" : "border-white/10"
            }`}
          >
            {!selectionMode ? (
              // Normal Header
              <>
                <div className="flex items-center space-x-4">
                  {/* Enhanced Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 p-0.5 shadow-lg">
                      <div
                        className={`w-full h-full rounded-2xl overflow-hidden ${
                          theme === "dark" ? "bg-slate-800" : "bg-white"
                        }`}
                      >
                        {miniChatWindow.otherUser.avatar_url ? (
                          <img
                            src={miniChatWindow.otherUser.avatar_url || "/placeholder.svg"}
                            alt={miniChatWindow.otherUser.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-lg font-bold bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent">
                              {miniChatWindow.otherUser.name?.charAt(0) || "U"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Online Status with Pulse */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white shadow-lg">
                      <div className="w-full h-full bg-green-400 rounded-full animate-ping opacity-75"></div>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className={`font-bold text-lg truncate ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                      {miniChatWindow.otherUser.name}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                        {isConnected ? "Online now" : "Connecting..."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={enterSelectionMode}
                    className={`p-2 rounded-xl transition-all duration-200 backdrop-blur-sm ${
                      theme === "dark" ? "bg-slate-700/50 hover:bg-slate-600/50" : "bg-white/20 hover:bg-white/30"
                    }`}
                    title="Select Messages"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setIsMiniChatMinimized(!isMiniChatMinimized)}
                    className={`p-2 rounded-xl transition-all duration-200 backdrop-blur-sm ${
                      theme === "dark" ? "bg-slate-700/50 hover:bg-slate-600/50" : "bg-white/20 hover:bg-white/30"
                    }`}
                  >
                    {isMiniChatMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={closeMiniChat}
                    className={`p-2 rounded-xl transition-all duration-200 backdrop-blur-sm text-red-600 dark:text-red-400 ${
                      theme === "dark" ? "bg-red-500/20 hover:bg-red-500/30" : "bg-red-500/20 hover:bg-red-500/30"
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              // Selection Mode Header
              <>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={clearSelection}
                    className={`p-2 rounded-xl transition-all duration-200 backdrop-blur-sm ${
                      theme === "dark" ? "bg-slate-700/50 hover:bg-slate-600/50" : "bg-white/20 hover:bg-white/30"
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div>
                    <h4 className={`font-bold text-lg ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                      {selectedMessages.size} selected
                    </h4>
                    <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                      Select messages to delete
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={selectAllMessages}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 backdrop-blur-sm ${
                      theme === "dark"
                        ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                        : "bg-blue-500/20 text-blue-600 hover:bg-blue-500/30"
                    }`}
                  >
                    Select All
                  </button>
                  {selectedMessages.size > 0 && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 backdrop-blur-sm ${
                        theme === "dark"
                          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          : "bg-red-500/20 text-red-600 hover:bg-red-500/30"
                      }`}
                    >
                      Delete ({selectedMessages.size})
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Chat Content */}
          {!isMiniChatMinimized && (
            <>
              {/* Enhanced File Preview */}
              {selectedFile && (
                <div
                  className={`relative z-10 px-4 py-3 border-b backdrop-blur-sm ${
                    theme === "dark" ? "border-slate-700/50 bg-slate-800/50" : "border-gray-200/50 bg-gray-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {filePreview ? (
                        <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-cyan-500/50">
                          <img
                            src={filePreview || "/placeholder.svg"}
                            alt={selectedFile.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white border-2 border-cyan-500/50">
                          {getFileIcon(selectedFile.type)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h5
                          className={`text-sm font-medium truncate ${
                            theme === "dark" ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          {selectedFile.name}
                        </h5>
                        <p className={`text-xs truncate ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                          {formatFileSize(selectedFile.size)} • Ready to send
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFile(null)
                        setFilePreview(null)
                      }}
                      className={`p-2 rounded-full transition-colors ${
                        theme === "dark" ? "hover:bg-slate-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Messages Area */}
              <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-4 h-80 custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <MessageCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                      Start Chatting!
                    </h3>
                    <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                      Send your first message to begin the conversation
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => {
                      const isOwn = message.sender_id === user.id
                      const isSelected = selectedMessages.has(message.id)
                      const showTime =
                        index === 0 ||
                        new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() >
                          300000

                      return (
                        <div key={message.id} className="space-y-2">
                          {showTime && (
                            <div className="text-center">
                              <span
                                className={`text-xs px-3 py-1 rounded-full backdrop-blur-sm ${
                                  theme === "dark" ? "text-gray-400 bg-slate-700/50" : "text-gray-500 bg-white/50"
                                }`}
                              >
                                {new Date(message.created_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          )}
                          <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                            <div className="flex items-end space-x-2 max-w-xs">
                              {/* Selection Checkbox (only for own messages) */}
                              {selectionMode && isOwn && (
                                <button
                                  onClick={() => toggleMessageSelection(message.id)}
                                  className={`p-1 rounded-lg transition-all duration-200 ${
                                    isSelected
                                      ? "bg-blue-500 text-white"
                                      : theme === "dark"
                                        ? "bg-slate-600 text-gray-300 hover:bg-slate-500"
                                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                  }`}
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}

                              <div className="relative group">
                                <div
                                  className={`px-4 py-3 rounded-2xl text-sm relative shadow-lg transition-all duration-200 ${
                                    isSelected ? "ring-2 ring-blue-500 ring-opacity-50" : ""
                                  } ${
                                    isOwn
                                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white ml-12"
                                      : theme === "dark"
                                        ? "bg-slate-700 text-white mr-12 border border-slate-600"
                                        : "bg-white text-gray-800 mr-12 border border-gray-200"
                                  }`}
                                >
                                  <p className="leading-relaxed">{message.message}</p>

                                  {/* Enhanced File Rendering in Messages */}
                                  {renderMessageFile(message)}

                                  {/* Message Tail */}
                                  <div
                                    className={`absolute top-3 w-3 h-3 transform rotate-45 ${
                                      isOwn
                                        ? "right-[-6px] bg-gradient-to-r from-cyan-500 to-blue-500"
                                        : theme === "dark"
                                          ? "left-[-6px] bg-slate-700 border-l border-b border-slate-600"
                                          : "left-[-6px] bg-white border-l border-b border-gray-200"
                                    }`}
                                  ></div>
                                </div>

                                {/* Delete Button (only for own messages and not in selection mode) */}
                                {isOwn && !selectionMode && (
                                  <button
                                    onClick={() => handleDeleteMessage(message.id)}
                                    className={`absolute -top-2 -right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg ${
                                      theme === "dark"
                                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                        : "bg-red-500/20 text-red-600 hover:bg-red-500/30"
                                    }`}
                                    title="Delete Message"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Typing Indicator */}
                    {typingUsers.size > 0 && (
                      <div className="flex justify-start">
                        <div
                          className={`px-4 py-3 rounded-2xl shadow-lg border mr-12 ${
                            theme === "dark" ? "bg-slate-700 border-slate-600" : "bg-white border-gray-200"
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                              {miniChatWindow?.otherUser?.name} is typing
                            </span>
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
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Enhanced Input Area */}
              <div
                className={`relative z-10 p-4 border-t backdrop-blur-sm ${
                  theme === "dark" ? "border-slate-700/50" : "border-gray-200/50"
                }`}
              >
                <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                  {/* File Attachment Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-3 rounded-xl transition-all duration-200 backdrop-blur-sm ${
                      selectedFile
                        ? "bg-green-100 dark:bg-green-900/30 border border-green-400 text-green-600"
                        : theme === "dark"
                          ? "bg-slate-700/50 hover:bg-slate-600/50 text-gray-300"
                          : "bg-white/20 hover:bg-white/30 text-gray-600"
                    }`}
                    title="Attach File"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  {/* Message Input Container */}
                  <div className="flex-1 relative">
                    <input
                      ref={messageInputRef}
                      type="text"
                      value={newMessage}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      disabled={!isConnected}
                      autoComplete="off"
                      className={`w-full px-4 py-3 pr-12 rounded-2xl border transition-all duration-200 backdrop-blur-sm text-sm disabled:opacity-50 ${
                        theme === "dark"
                          ? "bg-slate-700/80 border-slate-600/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent"
                          : "bg-white/80 border-gray-200/50 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent"
                      }`}
                    />

                    {/* Emoji Button - positioned inside input */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`p-1 rounded-lg transition-colors ${
                          showEmojiPicker
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600"
                            : theme === "dark"
                              ? "hover:bg-slate-600 text-gray-400"
                              : "hover:bg-gray-100 text-gray-500"
                        }`}
                        title="Add Emoji"
                      >
                        <Smile className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Enhanced Emoji Picker */}
                    {showEmojiPicker && (
                      <div
                        ref={emojiPickerRef}
                        className={`absolute bottom-12 right-0 z-50 p-4 rounded-2xl shadow-2xl border backdrop-blur-md ${
                          theme === "dark" ? "bg-slate-800/95 border-slate-600" : "bg-white/95 border-gray-200"
                        }`}
                        style={{ width: "320px", maxHeight: "400px", overflowY: "auto" }}
                      >
                        <div className="space-y-4">
                          {Object.entries(emojiCategories).map(([category, emojis]) => (
                            <div key={category}>
                              <h4
                                className={`text-xs font-semibold mb-2 capitalize ${
                                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                                }`}
                              >
                                {category}
                              </h4>
                              <div className="grid grid-cols-8 gap-1">
                                {emojis.map((emoji, index) => (
                                  <button
                                    key={index}
                                    onClick={() => handleEmojiSelect(emoji)}
                                    className={`text-lg p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                                      theme === "dark" ? "hover:bg-slate-700" : "hover:bg-gray-100"
                                    }`}
                                    title={emoji}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={(!newMessage.trim() && !selectedFile) || !isConnected}
                    className={`p-3 rounded-xl transition-all duration-200 shadow-lg ${
                      (newMessage.trim() || selectedFile) && isConnected
                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-cyan-500/25 transform hover:scale-105"
                        : "bg-gray-300 dark:bg-slate-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    }`}
                    title="Send Message"
                  >
                    <Send className="w-5 h-5" />
                  </button>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="image/*,application/pdf,text/plain,.doc,.docx,audio/*,video/*"
                  />
                </form>
                {/* Connection Status */}
                {!isConnected && (
                  <div className="mt-3 text-center">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span>Reconnecting to chat...</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-3xl">
            <div
              className={`p-6 rounded-2xl shadow-2xl border max-w-sm mx-4 ${
                theme === "dark" ? "bg-slate-800 border-slate-600" : "bg-white border-gray-200"
              }`}
            >
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className={`text-lg font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                  Delete Messages
                </h3>
                <p className={`text-sm mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                  Are you sure you want to delete {selectedMessages.size} message{selectedMessages.size > 1 ? "s" : ""}?
                  This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      theme === "dark"
                        ? "bg-slate-700 text-gray-300 hover:bg-slate-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkDeleteMessages}
                    className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-all duration-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Enhanced Trip Card Component
  const TripCard = ({ trip, showConnectionStatus = false }) => {
    if (!trip?.user_id) return null

    const isConnecting = connectingUsers.has(trip.user_id)
    const isDisconnecting = disconnectingUsers.has(trip.user_id)
    const connectionState = isConnecting
      ? "connecting"
      : isDisconnecting
        ? "disconnecting"
        : trip.connection_status || "none"

    const canConnect =
      connectionState === "none" || connectionState === "expired" || connectionState === "declined" || trip.canResend
    const buttonText =
      connectionState === "expired"
        ? "🔄 Resend Request"
        : connectionState === "declined"
          ? "🔄 Send Again"
          : connectionState === "connecting"
            ? "🔄 Connecting..."
            : connectionState === "pending"
              ? "⏳ Pending..."
              : "🔗 Connect"

    return (
      <div className="group relative bg-white dark:bg-slate-900 rounded-3xl p-6 hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] border border-gray-200/50 dark:border-slate-700/50 overflow-hidden">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Floating Particles Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-4 right-4 w-2 h-2 bg-cyan-400/30 rounded-full animate-pulse" />
          <div
            className="absolute bottom-6 left-6 w-1 h-1 bg-purple-400/40 rounded-full animate-bounce"
            style={{ animationDelay: "0.5s" }}
          />
          <div
            className="absolute top-1/2 left-4 w-1.5 h-1.5 bg-pink-400/30 rounded-full animate-pulse"
            style={{ animationDelay: "1s" }}
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 p-0.5 shadow-xl group-hover:shadow-cyan-500/25 transition-all duration-300">
                  <div className="w-full h-full rounded-3xl overflow-hidden bg-white dark:bg-slate-800">
                    {trip.avatar_url ? (
                      <img
                        src={trip.avatar_url || "/placeholder.svg"}
                        alt={trip.user_name || "User"}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white font-bold text-xl">{trip.user_name?.charAt(0) || "U"}</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Online Status */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white shadow-lg">
                  <div className="w-full h-full bg-green-400 rounded-full animate-ping opacity-75"></div>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1 group-hover:text-cyan-500 transition-colors">
                  {trip.user_name || "Anonymous"}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center space-x-1">
                  <MapPin className="w-4 h-4 text-cyan-500" />
                  <span>{trip.destination || "Unknown"}</span>
                </p>
                {trip.distance_text && (
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 flex items-center space-x-1">
                    <Navigation className="w-3 h-3" />
                    <span>{trip.distance_text}</span>
                  </p>
                )}
              </div>
            </div>

            {showConnectionStatus && (
              <div
                className={`px-4 py-2 rounded-full text-xs font-semibold backdrop-blur-sm border ${
                  connectionState === "connected"
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
                    : connectionState === "pending"
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700"
                      : connectionState === "connecting"
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                }`}
              >
                {connectionState === "connected" && (
                  <>
                    <CheckCircle className="w-3 h-3 inline mr-1" />
                    Connected
                  </>
                )}
                {connectionState === "pending" && (
                  <>
                    <Activity className="w-3 h-3 inline mr-1 animate-pulse" />
                    Pending
                  </>
                )}
                {connectionState === "connecting" && (
                  <>
                    <Zap className="w-3 h-3 inline mr-1 animate-spin" />
                    Connecting
                  </>
                )}
              </div>
            )}
          </div>

          {/* Enhanced Info Cards */}
          <div className="grid grid-cols-3 gap-3 text-sm mb-6">
            <div className="flex items-center space-x-3 p-4 rounded-2xl bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200/50 dark:border-cyan-700/30">
              <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl shadow-lg">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
                <p className="font-semibold text-gray-800 dark:text-white">{trip.days || "N/A"} days</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200/50 dark:border-emerald-700/30">
              <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl shadow-lg">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Budget</p>
                <p className="font-semibold text-gray-800 dark:text-white">
                  ₹{trip.budget ? (Number(trip.budget) / 1000).toFixed(0) : "N/A"}K
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200/50 dark:border-purple-700/30">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Group</p>
                <p className="font-semibold text-gray-800 dark:text-white">{trip.travelers || 1} travelers</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {connectionState === "connected" ? (
              <>
                <button
                  onClick={() => openMiniChat(trip)}
                  className="flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg hover:shadow-cyan-500/25 transform hover:scale-105"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>💬 Chat Now</span>
                </button>
                <button
                  onClick={() => handleViewLocation(trip)}
                  className="p-3 rounded-2xl transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white shadow-lg hover:shadow-blue-500/25 transform hover:scale-105"
                  title="View Location"
                >
                  <MapPin className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDisconnectClick(trip)}
                  disabled={connectionState === "disconnecting"}
                  className={`p-3 rounded-2xl transition-all duration-300 ${
                    connectionState === "disconnecting"
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white shadow-lg hover:shadow-red-500/25 transform hover:scale-105"
                  }`}
                  title="Disconnect"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleConnectClick(trip)}
                  disabled={!canConnect && connectionState !== "expired" && connectionState !== "declined"}
                  className={`px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 flex-1 ${
                    !canConnect && connectionState !== "expired" && connectionState !== "declined"
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : connectionState === "expired" || connectionState === "declined"
                        ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white shadow-lg hover:shadow-orange-500/25 transform hover:scale-105"
                        : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg hover:shadow-cyan-500/25 transform hover:scale-105"
                  }`}
                >
                  {buttonText}
                </button>
                <button
                  disabled
                  className="flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                  title="Connect first to chat"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat</span>
                </button>
              </>
            )}
            <button className="p-3 rounded-2xl transition-all duration-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:text-red-400 hover:border-red-400/50 hover:bg-red-500/10 transform hover:scale-105">
              <Heart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Chat Card Component
  const ChatCard = ({ chat }) => {
    const formatTime = (timestamp) => {
      if (!timestamp) return ""
      const date = new Date(timestamp)
      const now = new Date()
      const diffInHours = (now - date) / (1000 * 60 * 60)

      if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      } else {
        return date.toLocaleDateString()
      }
    }

    return (
      <div
        onClick={() => handleChatFromChatsSection(chat)}
        className="group relative bg-white dark:bg-slate-900 rounded-3xl p-6 hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:scale-[1.02] border border-gray-200/50 dark:border-slate-700/50 overflow-hidden"
      >
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 p-0.5 shadow-xl">
                  <div className="w-full h-full rounded-3xl overflow-hidden bg-white dark:bg-slate-800">
                    {chat.avatar_url ? (
                      <img
                        src={chat.avatar_url || "/placeholder.svg"}
                        alt={chat.user_name || "User"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white font-bold text-xl">{chat.user_name?.charAt(0) || "U"}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg">
                  <div className="w-full h-full bg-green-400 rounded-full animate-ping opacity-75"></div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1 group-hover:text-cyan-500 transition-colors">
                  {chat.user_name || "Anonymous"}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                  {chat.last_message || "No messages yet"}
                </p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">{formatTime(chat.last_message_time)}</p>
              {chat.unread_count > 0 && (
                <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <span className="text-xs text-white font-bold">{chat.unread_count}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Connected</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleChatFromChatsSection(chat)
                }}
                className="flex items-center space-x-2 px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-300 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg hover:shadow-cyan-500/25 transform hover:scale-105"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Open Chat</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleViewLocation({
                    user_id: chat.user_id,
                    user_name: chat.user_name,
                  })
                }}
                className="p-2 rounded-2xl transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white shadow-lg hover:shadow-blue-500/25 transform hover:scale-105"
                title="View Location"
              >
                <MapPin className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Connection Request Notification
  const ConnectionRequestNotification = ({ request }) => (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 mb-4 shadow-xl backdrop-blur-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">{request.fromUserName?.charAt(0) || "U"}</span>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800 dark:text-white text-sm">Connection Request</h4>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{request.message || "Wants to connect"}</p>
            <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">From: {request.fromUserName || "Anonymous"}</p>
          </div>
        </div>
        <button
          onClick={() => setConnectionRequests((prev) => prev.filter((req) => req.id !== request.id))}
          className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center space-x-2 mt-3">
        <button
          onClick={() => handleConnectionResponse(request, true)}
          className="flex items-center space-x-1 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white rounded-xl text-xs font-medium transition-all duration-300 shadow-lg hover:shadow-green-500/25 transform hover:scale-105"
        >
          <Check className="w-3 h-3" />
          <span>Accept</span>
        </button>
        <button
          onClick={() => handleConnectionResponse(request, false)}
          className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white rounded-xl text-xs font-medium transition-all duration-300 hover:border-red-400/50 hover:text-red-400"
        >
          Decline
        </button>
      </div>
    </div>
  )

  // Filter data
  const filteredTrips = publicTrips.filter(
    (trip) =>
      trip?.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip?.user_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredChats = connectedChats.filter(
    (chat) =>
      chat?.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat?.user_email?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredNearby = nearbyTravelers.filter(
    (traveler) =>
      traveler?.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      traveler?.user_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-purple-900 text-gray-800 dark:text-white relative overflow-hidden transition-all duration-500">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.05),transparent)]"></div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-float-delayed"></div>

      {/* Notification Panel */}
      {(connectionRequests.length > 0 || messageNotifications.length > 0) && (
        <div className="fixed top-4 right-4 z-40 w-80 max-h-96 overflow-y-auto">
          <div className="bg-white/90 dark:bg-slate-900/90 border border-gray-200/50 dark:border-slate-700/50 rounded-3xl p-4 shadow-2xl backdrop-blur-xl border-cyan-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 dark:text-white flex items-center space-x-2">
                <Bell className="w-5 h-5 text-cyan-500" />
                <span>Notifications ({connectionRequests.length + messageNotifications.length})</span>
              </h3>
              <button
                onClick={() => {
                  setConnectionRequests([])
                  setMessageNotifications([])
                }}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
              >
                Clear All
              </button>
            </div>
            <div className="space-y-3">
              {connectionRequests.map((request) => (
                <ConnectionRequestNotification key={request.id} request={request} />
              ))}
              {messageNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => {
                    const userTrip = {
                      user_id: notification.senderId,
                      user_name: notification.senderName,
                      avatar_url: notification.senderAvatar,
                      connection_status: "connected",
                      room_id: notification.roomId,
                    }
                    openMiniChat(userTrip)
                    setMessageNotifications((prev) => prev.filter((notif) => notif.id !== notification.id))
                  }}
                  className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 mb-4 shadow-xl cursor-pointer hover:border-blue-500/50 transition-all backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-sm">
                          {notification.senderName?.charAt(0) || "U"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 dark:text-white text-sm">New Message</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">From: {notification.senderName}</p>
                        <p className="text-xs text-gray-800 dark:text-white mt-1 truncate">{notification.preview}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setMessageNotifications((prev) => prev.filter((notif) => notif.id !== notification.id))
                      }}
                      className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mini Chat Window */}
      <MiniChatWindow />

      {/* Location Modal */}
      <UserLocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        targetUserId={selectedUserForLocation?.userId}
        targetUserName={selectedUserForLocation?.userName}
      />

      <div className="container mx-auto p-6 relative z-10">
        {/* Enhanced Header */}
        <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between py-8 border-b border-gray-200/50 dark:border-slate-700/50 mb-8 backdrop-blur-sm">
          <div className="flex items-center space-x-6 mb-6 lg:mb-0">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-cyan-500/25 animate-pulse">
                <Users className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
                SOCIAL TRAVEL HUB
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-xl font-semibold flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span>Connect • Chat • Explore Together</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Enhanced Location Button */}
            <button
              onClick={requestLocationPermission}
              className={`flex items-center space-x-3 px-6 py-3 rounded-2xl border-2 transition-all duration-300 backdrop-blur-sm ${
                locationPermission === "granted"
                  ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 shadow-lg shadow-emerald-500/25"
                  : locationPermission === "requesting"
                    ? "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 shadow-lg shadow-amber-500/25 animate-pulse"
                    : "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 shadow-lg shadow-red-500/25"
              }`}
            >
              <Navigation className="w-5 h-5" />
              <span className="font-semibold">
                {locationPermission === "granted"
                  ? "Location Active"
                  : locationPermission === "requesting"
                    ? "Getting Location..."
                    : "Enable Location"}
              </span>
            </button>

            {/* Enhanced Notification Bell */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-4 bg-white/80 dark:bg-slate-800/80 border-2 border-gray-200 dark:border-slate-700 rounded-2xl hover:border-cyan-500/50 transition-all duration-300 backdrop-blur-sm shadow-lg"
            >
              <Bell className="w-6 h-6" />
              {(connectionRequests.length > 0 || messageNotifications.length > 0) && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <span className="text-xs text-white font-bold">
                    {connectionRequests.length + messageNotifications.length}
                  </span>
                </div>
              )}
            </button>

            {/* Enhanced Theme Toggle */}
            <button
              onClick={handleThemeToggle}
              className="p-4 bg-white/80 dark:bg-slate-800/80 border-2 border-gray-200 dark:border-slate-700 rounded-2xl hover:border-cyan-500/50 transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {theme === "dark" ? (
                <Sun className="w-6 h-6 text-yellow-500" />
              ) : (
                <Moon className="w-6 h-6 text-purple-500" />
              )}
            </button>

            {/* Enhanced Connection Status */}
            <div
              className={`flex items-center space-x-3 px-6 py-3 rounded-2xl backdrop-blur-sm border-2 ${
                isConnected
                  ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 shadow-lg shadow-emerald-500/25"
                  : "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 shadow-lg shadow-red-500/25"
              }`}
            >
              {isConnected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
              <span className="font-semibold">{isConnected ? "Connected" : "Reconnecting..."}</span>
            </div>
          </div>
        </header>

        {/* Enhanced Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="group bg-white/80 dark:bg-slate-900/80 border-2 border-gray-200/50 dark:border-slate-700/50 rounded-3xl p-8 text-center hover:border-cyan-500/50 transition-all duration-300 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:shadow-cyan-500/10 transform hover:scale-105 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-4">
                <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl shadow-lg">
                  <Users className="w-10 h-10 text-white" />
                </div>
              </div>
              <h3 className="text-4xl font-black text-gray-800 dark:text-white mb-2">{stats.activeTravelers}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-lg font-semibold">Active Travelers</p>
              <div className="mt-3 flex items-center justify-center space-x-1">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-emerald-500 font-medium">+12% this week</span>
              </div>
            </div>
          </div>

          <div className="group bg-white/80 dark:bg-slate-900/80 border-2 border-gray-200/50 dark:border-slate-700/50 rounded-3xl p-8 text-center hover:border-blue-500/50 transition-all duration-300 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transform hover:scale-105 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl shadow-lg">
                  <MessageCircle className="w-10 h-10 text-white" />
                </div>
              </div>
              <h3 className="text-4xl font-black text-gray-800 dark:text-white mb-2">{stats.activeChats}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-lg font-semibold">Active Chats</p>
              <div className="mt-3 flex items-center justify-center space-x-1">
                <Activity className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-500 font-medium">Live conversations</span>
              </div>
            </div>
          </div>

          <div className="group bg-white/80 dark:bg-slate-900/80 border-2 border-gray-200/50 dark:border-slate-700/50 rounded-3xl p-8 text-center hover:border-purple-500/50 transition-all duration-300 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transform hover:scale-105 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-4">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                  <MapPin className="w-10 h-10 text-white" />
                </div>
              </div>
              <h3 className="text-4xl font-black text-gray-800 dark:text-white mb-2">{stats.nearbyTravelers}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-lg font-semibold">Nearby Travelers</p>
              <div className="mt-3 flex items-center justify-center space-x-1">
                <Navigation className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-purple-500 font-medium">Within 50km</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="flex flex-col lg:flex-row items-center justify-between mb-8 space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-6 flex-1">
            <div className="relative w-full max-w-2xl">
              <div className="absolute inset-y-0 left-0 flex items-center pl-6 pointer-events-none">
                <Search className="w-6 h-6 text-cyan-500" />
              </div>
              <input
                type="search"
                className="block w-full p-6 pl-16 text-lg text-gray-800 dark:text-white rounded-3xl border-2 border-gray-200 dark:border-slate-700 focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 backdrop-blur-sm shadow-lg transition-all duration-300 bg-white/80 dark:bg-slate-800/80 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Search trips, travelers, destinations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white rounded-3xl font-semibold shadow-lg hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105">
              <Filter className="w-6 h-6" />
              <span>Advanced Filters</span>
            </button>
          </div>

          {/* Nearby Mode */}
          {activeTab === "nearby" && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <label htmlFor="nearby-mode" className="text-gray-600 dark:text-gray-300 text-lg font-semibold">
                  Nearby Mode:
                </label>
                <select
                  id="nearby-mode"
                  className="bg-white/80 dark:bg-slate-800/80 border-2 border-gray-200 dark:border-slate-700 text-gray-800 dark:text-white text-lg rounded-2xl focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 py-3 px-4 transition-all backdrop-blur-sm shadow-lg"
                  value={nearbyMode}
                  onChange={(e) => setNearbyMode(e.target.value)}
                >
                  <option value="geolocation">Geolocation</option>
                  <option value="distance">Distance</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Navigation Tabs */}
        <nav className="mb-10">
          <ul className="flex space-x-6 lg:space-x-8 justify-center">
            <li>
              <button
                onClick={() => setActiveTab("discover")}
                className={`flex items-center space-x-3 px-8 py-4 rounded-3xl font-bold text-lg transition-all duration-300 ${
                  activeTab === "discover"
                    ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-2xl shadow-cyan-500/25 transform scale-105"
                    : "bg-white/80 dark:bg-slate-800/80 border-2 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:border-cyan-500/50 backdrop-blur-sm shadow-lg"
                }`}
              >
                <Globe className="w-6 h-6" />
                <span>Discover</span>
                <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">{filteredTrips.length}</div>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("chats")}
                className={`flex items-center space-x-3 px-8 py-4 rounded-3xl font-bold text-lg transition-all duration-300 ${
                  activeTab === "chats"
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-2xl shadow-blue-500/25 transform scale-105"
                    : "bg-white/80 dark:bg-slate-800/80 border-2 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:border-blue-500/50 backdrop-blur-sm shadow-lg"
                }`}
              >
                <MessageCircle className="w-6 h-6" />
                <span>My Chats</span>
                <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">{filteredChats.length}</div>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("nearby")}
                className={`flex items-center space-x-3 px-8 py-4 rounded-3xl font-bold text-lg transition-all duration-300 ${
                  activeTab === "nearby"
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-2xl shadow-purple-500/25 transform scale-105"
                    : "bg-white/80 dark:bg-slate-800/80 border-2 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:border-purple-500/50 backdrop-blur-sm shadow-lg"
                }`}
              >
                <MapPin className="w-6 h-6" />
                <span>Nearby</span>
                <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">{filteredNearby.length}</div>
              </button>
            </li>
          </ul>
        </nav>

        {/* Content Area */}
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-3xl">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                <span className="text-xl font-semibold text-gray-600 dark:text-gray-300">Loading amazing trips...</span>
              </div>
            </div>
          )}

          {/* Discover Tab */}
          {activeTab === "discover" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-gray-800 dark:text-white flex items-center space-x-3">
                  <Globe className="w-8 h-8 text-cyan-500" />
                  <span>Discover Amazing Trips</span>
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg">{filteredTrips.length} travelers found</p>
              </div>
              {filteredTrips.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                    <Search className="w-16 h-16 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">No trips found</h3>
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                    Try adjusting your search or check back later for new adventures!
                  </p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-2xl font-semibold shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 transform hover:scale-105"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                  {filteredTrips.map((trip) => (
                    <TripCard key={trip.id || trip.user_id} trip={trip} showConnectionStatus={true} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Chats Tab */}
          {activeTab === "chats" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-gray-800 dark:text-white flex items-center space-x-3">
                  <MessageCircle className="w-8 h-8 text-blue-500" />
                  <span>My Active Chats</span>
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg">{filteredChats.length} active conversations</p>
              </div>
              {filteredChats.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                    <MessageCircle className="w-16 h-16 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">No active chats</h3>
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                    Start connecting with travelers to begin chatting!
                  </p>
                  <button
                    onClick={() => setActiveTab("discover")}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white rounded-2xl font-semibold shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
                  >
                    Discover Travelers
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                  {filteredChats.map((chat) => (
                    <ChatCard key={chat.user_id} chat={chat} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Nearby Tab */}
          {activeTab === "nearby" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-gray-800 dark:text-white flex items-center space-x-3">
                  <MapPin className="w-8 h-8 text-purple-500" />
                  <span>Nearby Travelers</span>
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg">{filteredNearby.length} travelers nearby</p>
              </div>
              {locationPermission !== "granted" ? (
                <div className="text-center py-20">
                  <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-2xl">
                    <Navigation className="w-16 h-16 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Location Access Required</h3>
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                    Enable location access to discover travelers near you!
                  </p>
                  <button
                    onClick={requestLocationPermission}
                    className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white rounded-2xl font-semibold shadow-lg hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
                  >
                    Enable Location
                  </button>
                </div>
              ) : filteredNearby.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-2xl">
                    <MapPin className="w-16 h-16 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">No nearby travelers</h3>
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                    No travelers found in your area. Check back later or expand your search!
                  </p>
                  <button
                    onClick={fetchNearbyTravelers}
                    className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white rounded-2xl font-semibold shadow-lg hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
                  >
                    Refresh Search
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                  {filteredNearby.map((traveler) => (
                    <TripCard key={traveler.id || traveler.user_id} trip={traveler} showConnectionStatus={true} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
          animation-delay: 2s;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #06b6d4, #3b82f6);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #0891b2, #2563eb);
        }
      `}</style>
    </div>
  )
}

export default SocialTravel
