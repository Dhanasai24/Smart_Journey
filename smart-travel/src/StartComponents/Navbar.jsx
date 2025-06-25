"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, User, LogOut, Settings, Calendar, Menu, X, Users, Globe, Wifi, WifiOff, Bell } from "lucide-react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../assets/Context/AuthContext"
import { useSocket } from "../Hooks/UseSocket"
import { API_BASE_URL } from "../assets/Utils/Constants"
import axios from "axios"

const Navbar = () => {
  const { user, logout, token } = useAuth()
  const { isConnected, socket, connectionRequests, setConnectionRequests } = useSocket()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const theme = "light"

  // Global notification state
  const [globalNotifications, setGlobalNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState(0)

  // API instance
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  // Toast notification system
  const showToast = useCallback((message, type = "info", duration = 4000) => {
    const toast = document.createElement("div")
    toast.className = `fixed top-4 right-4 z-[9999] p-4 rounded-xl shadow-2xl backdrop-blur-lg border transition-all duration-500 transform translate-x-full ${
      type === "success"
        ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-100"
        : type === "error"
          ? "bg-red-500/20 border-red-400/30 text-red-100"
          : type === "warning"
            ? "bg-amber-500/20 border-amber-400/30 text-amber-100"
            : "bg-cyan-500/20 border-cyan-400/30 text-cyan-100"
    }`

    // Add icon based on type
    const iconMap = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    }

    toast.innerHTML = `
      <div class="flex items-center space-x-3">
        <span class="text-lg">${iconMap[type] || "ℹ️"}</span>
        <span class="font-medium">${message}</span>
      </div>
    `

    document.body.appendChild(toast)

    // Animate in
    setTimeout(() => {
      toast.style.transform = "translateX(0)"
    }, 100)

    // Animate out and remove
    setTimeout(() => {
      toast.style.transform = "translateX(100%)"
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast)
        }
      }, 500)
    }, duration)
  }, [])

  // Fetch notifications from server
  const fetchNotifications = useCallback(async () => {
    if (!user || !token || isLoading) return

    // Prevent too frequent requests
    const now = Date.now()
    if (now - lastFetchTime < 5000) return

    try {
      setIsLoading(true)
      setLastFetchTime(now)

      console.log("🔔 [NAVBAR] Fetching notifications from server...")

      const response = await api.get("/social/notifications")

      if (response.data?.success) {
        const notifications = response.data.notifications || []
        console.log(`🔔 [NAVBAR] Received ${notifications.length} notifications from server`)

        // Process and categorize notifications
        const processedNotifications = notifications.map((notif) => ({
          ...notif,
          id: notif.id || Date.now() + Math.random(),
          isGlobal: true,
          receivedAt: new Date().toISOString(),
        }))

        // Update global notifications
        setGlobalNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.id))
          const newNotifications = processedNotifications.filter((n) => !existingIds.has(n.id))

          if (newNotifications.length > 0) {
            console.log(`🔔 [NAVBAR] Adding ${newNotifications.length} new notifications`)

            // Show toast for new connection requests
            newNotifications.forEach((notif) => {
              if (notif.type === "connection-request") {
                showToast(`${notif.fromUserName || "Someone"} wants to connect with you!`, "info", 6000)
              }
            })
          }

          return [...prev, ...newNotifications]
        })

        // Update unread count
        const unreadNotifications = processedNotifications.filter((n) => !n.isRead)
        setUnreadCount(unreadNotifications.length)

        // Add to connection requests for backward compatibility
        const connectionReqs = processedNotifications.filter((n) => n.type === "connection-request")
        if (connectionReqs.length > 0) {
          setConnectionRequests((prev) => {
            const existingIds = new Set(prev.map((r) => r.id))
            const newReqs = connectionReqs
              .filter((r) => !existingIds.has(r.id))
              .map((r) => ({
                id: r.id,
                fromUserId: r.fromUserId,
                fromUserName: r.fromUserName,
                fromUserAvatar: r.fromUserAvatar,
                toUserId: r.toUserId,
                roomId: r.roomId,
                tripId: r.tripId,
                message: r.message,
                timestamp: r.timestamp,
                isGlobal: true,
              }))

            return [...prev, ...newReqs]
          })
        }
      }
    } catch (error) {
      console.error("❌ [NAVBAR] Error fetching notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }, [user, token, isLoading, lastFetchTime, api, showToast, setConnectionRequests])

  // Handle connection response
  const handleConnectionResponse = useCallback(
    async (notification, accepted) => {
      try {
        console.log(`🔔 [NAVBAR] ${accepted ? "Accepting" : "Rejecting"} connection request:`, notification)

        if (accepted) {
          // Accept the connection
          if (socket && isConnected) {
            socket.emit("accept-connection-request", {
              fromUserId: notification.fromUserId,
              toUserId: user.id,
              roomId: notification.roomId,
            })
          }

          // Update backend
          try {
            await api.post("/chat/accept-connection", {
              fromUserId: notification.fromUserId,
              roomId: notification.roomId,
            })
          } catch (backendError) {
            console.warn("⚠️ Failed to update backend connection status:", backendError)
          }

          showToast("Connection accepted! You can now chat.", "success")
        } else {
          // Reject the connection
          if (socket && isConnected) {
            socket.emit("reject-connection-request", {
              fromUserId: notification.fromUserId,
              toUserId: user.id,
              roomId: notification.roomId,
            })
          }

          showToast("Connection request declined", "info")
        }

        // Remove from global notifications
        setGlobalNotifications((prev) => prev.filter((n) => n.id !== notification.id))

        // Remove from connection requests
        setConnectionRequests((prev) => prev.filter((r) => r.id !== notification.id))

        // Update unread count
        setUnreadCount((prev) => Math.max(0, prev - 1))

        // Mark as read on server
        try {
          await api.post("/social/notifications/clear", {
            notificationIds: [notification.id],
          })
        } catch (clearError) {
          console.warn("⚠️ Failed to clear notification on server:", clearError)
        }
      } catch (error) {
        console.error("❌ [NAVBAR] Error handling connection response:", error)
        showToast("Failed to process connection request", "error")
      }
    },
    [socket, isConnected, user, api, showToast, setConnectionRequests],
  )

  // Dismiss notification
  const dismissNotification = useCallback(
    async (notificationId) => {
      try {
        // Remove from local state
        setGlobalNotifications((prev) => prev.filter((n) => n.id !== notificationId))
        setConnectionRequests((prev) => prev.filter((r) => r.id !== notificationId))
        setUnreadCount((prev) => Math.max(0, prev - 1))

        // Clear on server
        await api.post("/social/notifications/clear", {
          notificationIds: [notificationId],
        })
      } catch (error) {
        console.warn("⚠️ Failed to dismiss notification:", error)
      }
    },
    [api, setConnectionRequests],
  )

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      setGlobalNotifications([])
      setConnectionRequests([])
      setUnreadCount(0)

      await api.post("/social/notifications/clear")
      showToast("All notifications cleared", "success")
    } catch (error) {
      console.error("❌ Failed to clear all notifications:", error)
      showToast("Failed to clear notifications", "error")
    }
  }, [api, setConnectionRequests, showToast])

  // Socket event handlers for real-time notifications
  useEffect(() => {
    if (!socket || !user) return

    const handleConnectionRequested = (data) => {
      console.log("🔔 [NAVBAR] Real-time connection request received:", data)

      const notification = {
        id: Date.now() + Math.random(),
        type: "connection-request",
        fromUserId: data.fromUserId,
        fromUserName: data.fromUserName,
        fromUserAvatar: data.fromUserAvatar,
        toUserId: data.toUserId,
        roomId: data.roomId,
        tripId: data.tripId,
        message: data.message,
        timestamp: data.timestamp || new Date().toISOString(),
        isGlobal: true,
        isRealTime: true,
      }

      // Add to global notifications
      setGlobalNotifications((prev) => [notification, ...prev])
      setUnreadCount((prev) => prev + 1)

      // Add to connection requests for backward compatibility
      setConnectionRequests((prev) => [
        {
          id: notification.id,
          fromUserId: data.fromUserId,
          fromUserName: data.fromUserName,
          fromUserAvatar: data.fromUserAvatar,
          toUserId: data.toUserId,
          roomId: data.roomId,
          tripId: data.tripId,
          message: data.message,
          timestamp: data.timestamp || new Date().toISOString(),
          isGlobal: true,
        },
        ...prev,
      ])

      // Show toast notification
      showToast(`${data.fromUserName || "Someone"} wants to connect with you!`, "info", 6000)

      // Browser notification if permission granted
      if (Notification.permission === "granted") {
        new Notification("New Connection Request", {
          body: `${data.fromUserName || "Someone"} wants to connect with you`,
          icon: data.fromUserAvatar || "/favicon.ico",
          tag: "connection-request",
        })
      }
    }

    const handleConnectionAccepted = (data) => {
      console.log("🔔 [NAVBAR] Connection accepted:", data)
      showToast(`${data.fromUserName || "Someone"} accepted your connection request!`, "success")

      // Remove any pending requests from this user
      setGlobalNotifications((prev) =>
        prev.filter((n) => !(n.type === "connection-request" && n.fromUserId === data.fromUserId)),
      )
      setConnectionRequests((prev) => prev.filter((r) => r.fromUserId !== data.fromUserId))
    }

    const handleConnectionRejected = (data) => {
      console.log("🔔 [NAVBAR] Connection rejected:", data)
      showToast("Your connection request was declined", "info")
    }

    const handleMessageNotification = (data) => {
      console.log("🔔 [NAVBAR] Message notification:", data)

      const notification = {
        id: Date.now() + Math.random(),
        type: "message",
        senderId: data.senderId,
        senderName: data.senderName,
        senderAvatar: data.senderAvatar,
        message: data.message,
        roomId: data.roomId,
        timestamp: data.timestamp || new Date().toISOString(),
        preview: data.message.length > 50 ? data.message.substring(0, 50) + "..." : data.message,
        isGlobal: true,
        isRealTime: true,
      }

      setGlobalNotifications((prev) => [notification, ...prev])
      setUnreadCount((prev) => prev + 1)

      showToast(`New message from ${data.senderName}`, "info")
    }

    // Register socket event listeners
    socket.on("connection-requested", handleConnectionRequested)
    socket.on("connection-accepted", handleConnectionAccepted)
    socket.on("connection-rejected", handleConnectionRejected)
    socket.on("chat-message-notification", handleMessageNotification)

    return () => {
      socket.off("connection-requested", handleConnectionRequested)
      socket.off("connection-accepted", handleConnectionAccepted)
      socket.off("connection-rejected", handleConnectionRejected)
      socket.off("chat-message-notification", handleMessageNotification)
    }
  }, [socket, user, showToast, setConnectionRequests])

  // Fetch notifications on mount and when user comes online
  useEffect(() => {
    if (user && token) {
      fetchNotifications()

      // Set up periodic fetching for offline notifications
      const interval = setInterval(fetchNotifications, 30000) // Every 30 seconds

      return () => clearInterval(interval)
    }
  }, [user, token, fetchNotifications])

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  // Render notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case "connection-request":
        return <Users className="w-5 h-5 text-cyan-400" />
      case "message":
        return "💬"
      case "location":
        return "📍"
      case "review":
        return "⭐"
      case "like":
        return "❤️"
      case "system":
        return "ℹ️"
      default:
        return "🔔"
    }
  }

  // Format time
  const formatTime = (timestamp) => {
    if (!timestamp) return ""
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = (now - date) / (1000 * 60)

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  const handleLogout = async () => {
    await logout()
    navigate("/")
    setShowProfileMenu(false)
  }

  // Determine if we're on special pages that need transparent navbar
  const isSpecialPage = () => {
    const specialPages = ["/dashboard", "/my-trips", "/trip-planner", "/social-travel", "/public-trips"]
    return specialPages.includes(location.pathname)
  }

  // Get navbar background style
  const getNavbarStyle = () => {
    if (isSpecialPage()) {
      return "bg-transparent backdrop-blur-md border-b border-white/5 shadow-sm"
    }
    return "bg-white/5 backdrop-blur-md border-b border-white/10 shadow-sm"
  }

  // Adaptive text colors that work on any background
  const getTextStyle = () => {
    if (isSpecialPage()) {
      return {
        primary: "text-gray-900 dark:text-white drop-shadow-sm",
        secondary: "text-gray-700 dark:text-gray-200 drop-shadow-sm",
        accent: "text-blue-600 dark:text-cyan-400 drop-shadow-sm",
        hover: "hover:text-blue-700 dark:hover:text-cyan-300",
        logo: "bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm",
      }
    }

    return {
      primary: "text-gray-900 dark:text-white",
      secondary: "text-gray-700 dark:text-gray-200",
      accent: "text-blue-600 dark:text-cyan-400",
      hover: "hover:text-blue-700 dark:hover:text-cyan-300",
      logo: "bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent",
    }
  }

  const textStyles = getTextStyle()

  return (
    <>
      <nav className={`${getNavbarStyle()} sticky top-0 z-50 transition-all duration-500`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-all duration-300">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${textStyles.logo}`}>Smart Journey</h1>
                <p className={`text-xs ${textStyles.secondary} hidden sm:block font-medium`}>AI-Powered Trip Planner</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className={`${textStyles.primary} ${textStyles.hover} font-semibold transition-all duration-300 px-4 py-2 rounded-lg relative ${
                      location.pathname === "/dashboard"
                        ? `${textStyles.accent} bg-white/10 dark:bg-gray-800/20 shadow-sm`
                        : "hover:bg-white/5 dark:hover:bg-gray-800/10"
                    }`}
                  >
                    Dashboard
                    {location.pathname === "/dashboard" && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-current rounded-full"></div>
                    )}
                  </Link>
                  <Link
                    to="/trip-planner"
                    className={`${textStyles.primary} ${textStyles.hover} font-semibold transition-all duration-300 px-4 py-2 rounded-lg relative ${
                      location.pathname === "/trip-planner"
                        ? `${textStyles.accent} bg-white/10 dark:bg-gray-800/20 shadow-sm`
                        : "hover:bg-white/5 dark:hover:bg-gray-800/10"
                    }`}
                  >
                    Plan Trip
                    {location.pathname === "/trip-planner" && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-current rounded-full"></div>
                    )}
                  </Link>
                  <Link
                    to="/my-trips"
                    className={`${textStyles.primary} ${textStyles.hover} font-semibold transition-all duration-300 px-4 py-2 rounded-lg relative ${
                      location.pathname === "/my-trips"
                        ? `${textStyles.accent} bg-white/10 dark:bg-gray-800/20 shadow-sm`
                        : "hover:bg-white/5 dark:hover:bg-gray-800/10"
                    }`}
                  >
                    My Trips
                    {location.pathname === "/my-trips" && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-current rounded-full"></div>
                    )}
                  </Link>
                  <Link
                    to="/public-trips"
                    className={`${textStyles.primary} ${textStyles.hover} font-semibold transition-all duration-300 px-4 py-2 rounded-lg relative ${
                      location.pathname === "/public-trips"
                        ? `${textStyles.accent} bg-white/10 dark:bg-gray-800/20 shadow-sm`
                        : "hover:bg-white/5 dark:hover:bg-gray-800/10"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4" />
                      <span>Public Trips</span>
                    </div>
                    {location.pathname === "/public-trips" && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-current rounded-full"></div>
                    )}
                  </Link>
                  <Link
                    to="/social-travel"
                    className={`${textStyles.primary} ${textStyles.hover} font-semibold transition-all duration-300 px-4 py-2 rounded-lg relative ${
                      location.pathname === "/social-travel"
                        ? `${textStyles.accent} bg-white/10 dark:bg-gray-800/20 shadow-sm`
                        : "hover:bg-white/5 dark:hover:bg-gray-800/10"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Social Travel</span>
                    </div>
                    {location.pathname === "/social-travel" && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-current rounded-full"></div>
                    )}
                  </Link>

                  {/* Connection Status */}
                  <div className="flex items-center space-x-2">
                    <div
                      className={`p-2 rounded-lg transition-all duration-300 ${
                        isConnected
                          ? "bg-green-500/20 text-green-400 border border-green-500/50"
                          : "bg-red-500/20 text-red-400 border border-red-500/50"
                      }`}
                      title={isConnected ? "Real-time features connected" : "Real-time features disconnected"}
                    >
                      {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Enhanced Notifications */}
                  <div className="relative">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative p-2 rounded-lg transition-all duration-300 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30"
                      title="Notifications"
                    >
                      <Bell className="w-5 h-5 text-gray-700" />
                      {unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-bold">{unreadCount > 99 ? "99+" : unreadCount}</span>
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Profile Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/10 dark:hover:bg-gray-800/20 transition-all duration-300 backdrop-blur-sm border border-white/10 dark:border-gray-700/30"
                    >
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url || "/placeholder.svg?height=32&width=32"}
                          alt={user.name}
                          className="w-8 h-8 rounded-full border-2 border-white/20 shadow-sm"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-sm">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <span className={`text-sm font-semibold ${textStyles.primary}`}>
                        {user?.name?.split(" ")[0] || "User"}
                      </span>
                    </button>

                    <AnimatePresence>
                      {showProfileMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 dark:border-gray-700/50 py-2 z-50"
                        >
                          <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
                            <p className="text-sm font-semibold text-gray-800 dark:text-white">{user?.name}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{user?.email}</p>
                          </div>
                          <Link
                            to="/dashboard"
                            className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            onClick={() => setShowProfileMenu(false)}
                          >
                            <Calendar className="w-4 h-4" />
                            <span>Dashboard</span>
                          </Link>
                          <button className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 w-full text-left transition-colors">
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
                          </button>
                          <button
                            onClick={handleLogout}
                            className="flex items-center space-x-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className={`${textStyles.primary} ${textStyles.hover} font-semibold transition-all duration-300 px-4 py-2 rounded-lg hover:bg-white/5 dark:hover:bg-gray-800/10`}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 backdrop-blur-sm border border-white/10"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Right Side */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Connection Status for Mobile */}
              <div
                className={`flex items-center px-2 py-1 rounded-lg text-xs transition-all duration-300 ${
                  isConnected
                    ? "bg-green-500/20 text-green-400 border border-green-500/50"
                    : "bg-red-500/20 text-red-400 border border-red-500/50"
                }`}
                title={isConnected ? "Connected" : "Disconnected"}
              >
                {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              </div>

              {/* User Avatar for Mobile */}
              {user && (
                <div className="flex items-center space-x-2">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url || "/placeholder.svg?height=32&width=32"}
                      alt={user.name}
                      className="w-8 h-8 rounded-full border-2 border-white/20 shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-white font-bold text-sm">{user?.name?.charAt(0) || "U"}</span>
                    </div>
                  )}
                  <span className={`text-sm font-semibold ${textStyles.primary} hidden sm:block`}>
                    {user?.name?.split(" ")[0] || "User"}
                  </span>
                </div>
              )}

              {/* Notification Button for Mobile */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-lg transition-all duration-300 ${
                  theme === "light"
                    ? "bg-white/80 border border-gray-200 text-gray-700 hover:bg-gray-50"
                    : "bg-gray-800/80 border border-gray-600 text-gray-300 hover:bg-gray-700"
                } backdrop-blur-sm shadow-sm`}
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">{unreadCount > 9 ? "9+" : unreadCount}</span>
                  </div>
                )}
              </button>

              {/* Hamburger Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  theme === "light"
                    ? "bg-white/80 border border-gray-200 text-gray-700 hover:bg-gray-50"
                    : "bg-gray-800/80 border border-gray-600 text-gray-300 hover:bg-gray-700"
                } backdrop-blur-sm shadow-sm`}
                aria-label="Toggle mobile menu"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {showMobileMenu && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden border-t border-white/10 dark:border-gray-700/30 py-4 backdrop-blur-xl"
              >
                {user ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 px-4 py-2">
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url || "/placeholder.svg?height=40&width=40"}
                          alt={user.name}
                          className="w-10 h-10 rounded-full border-2 border-white/20 shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-sm">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div>
                        <p className={`font-semibold ${textStyles.primary}`}>{user?.name}</p>
                        <p className={`text-sm ${textStyles.secondary} truncate`}>{user?.email}</p>
                      </div>
                    </div>
                    <Link
                      to="/dashboard"
                      className={`block px-4 py-3 ${textStyles.primary} hover:bg-white/10 dark:hover:bg-gray-800/20 rounded-lg mx-2 transition-all duration-300 ${
                        location.pathname === "/dashboard" ? `${textStyles.accent} bg-white/10 dark:bg-gray-800/20` : ""
                      }`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/trip-planner"
                      className={`block px-4 py-3 ${textStyles.primary} hover:bg-white/10 dark:hover:bg-gray-800/20 rounded-lg mx-2 transition-all duration-300 ${
                        location.pathname === "/trip-planner"
                          ? `${textStyles.accent} bg-white/10 dark:bg-gray-800/20`
                          : ""
                      }`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Plan Trip
                    </Link>
                    <Link
                      to="/my-trips"
                      className={`block px-4 py-3 ${textStyles.primary} hover:bg-white/10 dark:hover:bg-gray-800/20 rounded-lg mx-2 transition-all duration-300 ${
                        location.pathname === "/my-trips" ? `${textStyles.accent} bg-white/10 dark:bg-gray-800/20` : ""
                      }`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      My Trips
                    </Link>
                    <Link
                      to="/public-trips"
                      className={`block px-4 py-3 ${textStyles.primary} hover:bg-white/10 dark:hover:bg-gray-800/20 rounded-lg mx-2 transition-all duration-300 ${
                        location.pathname === "/public-trips"
                          ? `${textStyles.accent} bg-white/10 dark:bg-gray-800/20`
                          : ""
                      }`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4" />
                        <span>Public Trips</span>
                      </div>
                    </Link>
                    <Link
                      to="/social-travel"
                      className={`block px-4 py-3 ${textStyles.primary} hover:bg-white/10 dark:hover:bg-gray-800/20 rounded-lg mx-2 transition-all duration-300 ${
                        location.pathname === "/social-travel"
                          ? `${textStyles.accent} bg-white/10 dark:bg-gray-800/20`
                          : ""
                      }`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>Social Travel</span>
                      </div>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg mx-2 transition-all duration-300"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Link
                      to="/login"
                      className={`block px-4 py-3 ${textStyles.primary} hover:bg-white/10 dark:hover:bg-gray-800/20 rounded-lg mx-2 transition-all duration-300`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className={`block px-4 py-3 ${textStyles.accent} hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg mx-2 transition-all duration-300`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Global Notification Dropdown - Fixed positioning for mobile */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed top-16 right-4 w-96 max-w-[calc(100vw-2rem)] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 dark:border-gray-700/50 py-4 z-[60] max-h-96 overflow-y-auto"
          >
            <div className="px-4 py-2 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                  Notifications ({globalNotifications.length})
                </h3>
                {globalNotifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-xs text-red-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-500/10"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {globalNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No new notifications</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {globalNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-3 rounded-lg border transition-all duration-300 hover:shadow-lg bg-gray-50/50 dark:bg-slate-800/50 border-gray-200/50 dark:border-slate-700/50 hover:border-cyan-500/50"
                  >
                    {/* Connection Request Notification */}
                    {notification.type === "connection-request" && (
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                              {notification.fromUserAvatar ? (
                                <img
                                  src={notification.fromUserAvatar || "/placeholder.svg"}
                                  alt={notification.fromUserName}
                                  className="w-full h-full rounded-xl object-cover"
                                />
                              ) : (
                                <span className="text-white font-bold text-sm">
                                  {notification.fromUserName?.charAt(0) || "U"}
                                </span>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm text-gray-800 dark:text-white">
                                Connection Request
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                From: {notification.fromUserName || "Anonymous"}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {notification.message || "Wants to connect"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTime(notification.timestamp)}
                            </span>
                            <button
                              onClick={() => dismissNotification(notification.id)}
                              className="p-1 rounded text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleConnectionResponse(notification, true)}
                            className="flex items-center space-x-1 px-3 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-lg text-xs font-medium transition-all duration-300 shadow-lg hover:shadow-emerald-500/25 transform hover:scale-105"
                          >
                            <span>✓</span>
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleConnectionResponse(notification, false)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white rounded-lg text-xs font-medium transition-all duration-300 hover:border-red-400/50 hover:text-red-400"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Message Notification */}
                    {notification.type === "message" && (
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                            {notification.senderAvatar ? (
                              <img
                                src={notification.senderAvatar || "/placeholder.svg"}
                                alt={notification.senderName}
                                className="w-full h-full rounded-xl object-cover"
                              />
                            ) : (
                              <span className="text-white font-bold text-sm">
                                {notification.senderName?.charAt(0) || "U"}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm text-gray-800 dark:text-white">New Message</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              From: {notification.senderName}
                            </p>
                            <p className="text-xs text-gray-800 dark:text-white mt-1 truncate">
                              {notification.preview}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(notification.timestamp)}
                          </span>
                          <button
                            onClick={() => dismissNotification(notification.id)}
                            className="p-1 rounded text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Other notification types */}
                    {notification.type !== "connection-request" && notification.type !== "message" && (
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg text-lg">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm text-gray-800 dark:text-white">
                              {notification.title || "Notification"}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {notification.message || notification.content}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(notification.timestamp)}
                          </span>
                          <button
                            onClick={() => dismissNotification(notification.id)}
                            className="p-1 rounded text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            {globalNotifications.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {isConnected ? (
                      <>
                        <Wifi className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-gray-600 dark:text-gray-300">Real-time updates active</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-4 h-4 text-red-400" />
                        <span className="text-xs text-gray-600 dark:text-gray-300">Reconnecting...</span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={fetchNotifications}
                    disabled={isLoading}
                    className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                      isLoading
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:bg-cyan-500/10"
                    }`}
                  >
                    {isLoading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar
