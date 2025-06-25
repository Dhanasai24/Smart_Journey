"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../assets/Context/AuthContext"
import { useTheme } from "../assets/Context/ThemeContext"
import { useSocket } from "../Hooks/UseSocket"
import { API_BASE_URL } from "../assets/Utils/Constants"
import axios from "axios"
import { Bell, X, Check, Users, MessageCircle, MapPin, Wifi, WifiOff, Info, Heart, Star } from "lucide-react"

const GlobalNotificationHandler = () => {
  const { user, token } = useAuth()
  const { theme } = useTheme()
  const { socket, isConnected, connectionRequests, setConnectionRequests } = useSocket()

  // Global notification state
  const [globalNotifications, setGlobalNotifications] = useState([])
  const [showNotificationPanel, setShowNotificationPanel] = useState(false)
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

      console.log("🔔 [GLOBAL] Fetching notifications from server...")

      const response = await api.get("/social/notifications")

      if (response.data?.success) {
        const notifications = response.data.notifications || []
        console.log(`🔔 [GLOBAL] Received ${notifications.length} notifications from server`)

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
            console.log(`🔔 [GLOBAL] Adding ${newNotifications.length} new notifications`)

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
      console.error("❌ [GLOBAL] Error fetching notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }, [user, token, isLoading, lastFetchTime, api, showToast, setConnectionRequests])

  // Handle connection response
  const handleConnectionResponse = useCallback(
    async (notification, accepted) => {
      try {
        console.log(`🔔 [GLOBAL] ${accepted ? "Accepting" : "Rejecting"} connection request:`, notification)

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
        console.error("❌ [GLOBAL] Error handling connection response:", error)
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
      console.log("🔔 [GLOBAL] Real-time connection request received:", data)

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
      console.log("🔔 [GLOBAL] Connection accepted:", data)
      showToast(`${data.fromUserName || "Someone"} accepted your connection request!`, "success")

      // Remove any pending requests from this user
      setGlobalNotifications((prev) =>
        prev.filter((n) => !(n.type === "connection-request" && n.fromUserId === data.fromUserId)),
      )
      setConnectionRequests((prev) => prev.filter((r) => r.fromUserId !== data.fromUserId))
    }

    const handleConnectionRejected = (data) => {
      console.log("🔔 [GLOBAL] Connection rejected:", data)
      showToast("Your connection request was declined", "info")
    }

    const handleMessageNotification = (data) => {
      console.log("🔔 [GLOBAL] Message notification:", data)

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
        return <MessageCircle className="w-5 h-5 text-blue-400" />
      case "location":
        return <MapPin className="w-5 h-5 text-purple-400" />
      case "review":
        return <Star className="w-5 h-5 text-yellow-400" />
      case "like":
        return <Heart className="w-5 h-5 text-pink-400" />
      case "system":
        return <Info className="w-5 h-5 text-gray-400" />
      default:
        return <Bell className="w-5 h-5 text-gray-400" />
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

  if (!user) return null

  return (
    <>
      {/* Global Notification Bell - Fixed Position */}
      <div className="fixed top-4 right-4 z-[9998]">
        <button
          onClick={() => setShowNotificationPanel(!showNotificationPanel)}
          className={`relative p-4 rounded-2xl shadow-2xl backdrop-blur-xl border-2 transition-all duration-300 transform hover:scale-110 ${
            theme === "dark"
              ? "bg-slate-900/90 border-slate-700/50 hover:border-cyan-500/50"
              : "bg-white/90 border-gray-200/50 hover:border-cyan-500/50"
          }`}
        >
          <Bell className={`w-6 h-6 ${unreadCount > 0 ? "text-cyan-400 animate-pulse" : "text-gray-500"}`} />

          {/* Unread Count Badge */}
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <span className="text-xs text-white font-bold">{unreadCount > 99 ? "99+" : unreadCount}</span>
            </div>
          )}

          {/* Connection Status Indicator */}
          <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full border-2 border-white shadow-lg">
            {isConnected ? (
              <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
            ) : (
              <div className="w-full h-full bg-red-400 rounded-full"></div>
            )}
          </div>
        </button>
      </div>

      {/* Notification Panel */}
      {showNotificationPanel && (
        <div className="fixed top-20 right-4 z-[9997] w-96 max-w-[calc(100vw-2rem)]">
          <div
            className={`rounded-3xl shadow-2xl backdrop-blur-xl border-2 overflow-hidden transition-all duration-300 ${
              theme === "dark" ? "bg-slate-900/95 border-slate-700/50" : "bg-white/95 border-gray-200/50"
            }`}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200/50 dark:border-slate-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                      Notifications
                    </h3>
                    <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                      {globalNotifications.length} total • {unreadCount} unread
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {globalNotifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-xs text-red-500 hover:text-red-600 transition-colors px-3 py-1 rounded-lg hover:bg-red-500/10"
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotificationPanel(false)}
                    className={`p-2 rounded-lg transition-colors ${
                      theme === "dark" ? "hover:bg-slate-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {globalNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center">
                    <Bell className="w-8 h-8 text-white" />
                  </div>
                  <h4 className={`font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                    No notifications
                  </h4>
                  <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                    You're all caught up! New notifications will appear here.
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {globalNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-2xl border transition-all duration-300 hover:shadow-lg ${
                        theme === "dark"
                          ? "bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/50"
                          : "bg-gray-50/50 border-gray-200/50 hover:border-cyan-500/50"
                      }`}
                    >
                      {/* Connection Request Notification */}
                      {notification.type === "connection-request" && (
                        <div>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                                {notification.fromUserAvatar ? (
                                  <img
                                    src={notification.fromUserAvatar || "/placeholder.svg"}
                                    alt={notification.fromUserName}
                                    className="w-full h-full rounded-2xl object-cover"
                                  />
                                ) : (
                                  <span className="text-white font-bold">
                                    {notification.fromUserName?.charAt(0) || "U"}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1">
                                <h4
                                  className={`font-semibold text-sm ${
                                    theme === "dark" ? "text-white" : "text-gray-800"
                                  }`}
                                >
                                  Connection Request
                                </h4>
                                <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"} mt-1`}>
                                  From: {notification.fromUserName || "Anonymous"}
                                </p>
                                <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"} mt-1`}>
                                  {notification.message || "Wants to connect"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                                {formatTime(notification.timestamp)}
                              </span>
                              <button
                                onClick={() => dismissNotification(notification.id)}
                                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleConnectionResponse(notification, true)}
                              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-xl text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-emerald-500/25 transform hover:scale-105"
                            >
                              <Check className="w-4 h-4" />
                              <span>Accept</span>
                            </button>
                            <button
                              onClick={() => handleConnectionResponse(notification, false)}
                              className={`px-4 py-2 border-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                                theme === "dark"
                                  ? "border-slate-600 text-gray-300 hover:text-white hover:border-red-400/50 hover:text-red-400"
                                  : "border-gray-300 text-gray-600 hover:text-gray-800 hover:border-red-400/50 hover:text-red-400"
                              }`}
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
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                              {notification.senderAvatar ? (
                                <img
                                  src={notification.senderAvatar || "/placeholder.svg"}
                                  alt={notification.senderName}
                                  className="w-full h-full rounded-2xl object-cover"
                                />
                              ) : (
                                <span className="text-white font-bold">
                                  {notification.senderName?.charAt(0) || "U"}
                                </span>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4
                                className={`font-semibold text-sm ${theme === "dark" ? "text-white" : "text-gray-800"}`}
                              >
                                New Message
                              </h4>
                              <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"} mt-1`}>
                                From: {notification.senderName}
                              </p>
                              <p
                                className={`text-xs ${theme === "dark" ? "text-white" : "text-gray-800"} mt-1 truncate`}
                              >
                                {notification.preview}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                              {formatTime(notification.timestamp)}
                            </span>
                            <button
                              onClick={() => dismissNotification(notification.id)}
                              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
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
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1">
                              <h4
                                className={`font-semibold text-sm ${theme === "dark" ? "text-white" : "text-gray-800"}`}
                              >
                                {notification.title || "Notification"}
                              </h4>
                              <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"} mt-1`}>
                                {notification.message || notification.content}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                              {formatTime(notification.timestamp)}
                            </span>
                            <button
                              onClick={() => dismissNotification(notification.id)}
                              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
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
            </div>

            {/* Footer */}
            {globalNotifications.length > 0 && (
              <div className="p-4 border-t border-gray-200/50 dark:border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {isConnected ? (
                      <>
                        <Wifi className="w-4 h-4 text-green-400" />
                        <span className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                          Real-time updates active
                        </span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-4 h-4 text-red-400" />
                        <span className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                          Reconnecting...
                        </span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={fetchNotifications}
                    disabled={isLoading}
                    className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                      isLoading
                        ? "text-gray-400 cursor-not-allowed"
                        : theme === "dark"
                          ? "text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                          : "text-cyan-600 hover:text-cyan-700 hover:bg-cyan-500/10"
                    }`}
                  >
                    {isLoading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default GlobalNotificationHandler
