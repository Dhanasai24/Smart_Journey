"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../assets/Context/AuthContext"
import { useTheme } from "../assets/Context/ThemeContext"
import { useSocket } from "../Hooks/UseSocket"
import { useNavigate } from "react-router-dom"
import { API_BASE_URL } from "../assets/Utils/Constants"
import axios from "axios"
import {
  Users,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Heart,
  Globe,
  Moon,
  Sun,
  X,
  Check,
  CheckCircle,
  UserMinus,
  Navigation,
  Wifi,
  WifiOff,
  Phone,
  Video,
  PhoneOff,
  MapPin,
  Zap,
  Sparkles,
  Rocket,
  Compass,
  TrendingUp,
} from "lucide-react"

// Get user online status
const getUserOnlineStatus = (user) => {
  if (!user) return "Offline"
  if (user.connection_status === "connected") return "Online"
  if (user.last_active) {
    const lastActive = new Date(user.last_active)
    const now = new Date()
    const diffMinutes = (now - lastActive) / (1000 * 60)
    if (diffMinutes < 5) return "Online"
    if (diffMinutes < 30) return "Away"
  }
  return "Offline"
}

const PublicTrips = () => {
  const { user, token } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const {
    socket,
    isConnected,
    connectionRequests,
    setConnectionRequests,
    incomingCall,
    setIncomingCall,
    acceptCall,
    rejectCall,
    stopAllSounds,
  } = useSocket()

  // State management
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [publicTrips, setPublicTrips] = useState([])
  const [connectingUsers, setConnectingUsers] = useState(new Set())
  const [sortBy, setSortBy] = useState("recent")
  const [messageNotifications, setMessageNotifications] = useState([])
  const [disconnectingUsers, setDisconnectingUsers] = useState(new Set())
  const [userLocation, setUserLocation] = useState(null)
  const [locationPermission, setLocationPermission] = useState("prompt")
  const [activeTab, setActiveTab] = useState("all")
  const [favoriteTrips, setFavoriteTrips] = useState(new Set())
  const [stats, setStats] = useState({
    activeTravelers: 0,
    totalConnections: 0,
    favoriteCount: 0,
  })

  // Configure axios
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem("favorite_trips")
      if (savedFavorites) {
        setFavoriteTrips(new Set(JSON.parse(savedFavorites)))
      }
    } catch (error) {
      console.warn("Failed to load favorites:", error)
    }
  }, [])

  // Handle favorite toggle
  const handleFavoriteToggle = (tripId) => {
    setFavoriteTrips((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(tripId)) {
        newFavorites.delete(tripId)
        showToast("Removed from favorites", "info")
      } else {
        newFavorites.add(tripId)
        showToast("Added to favorites", "success")
      }

      localStorage.setItem("favorite_trips", JSON.stringify([...newFavorites]))
      setStats((prevStats) => ({
        ...prevStats,
        favoriteCount: newFavorites.size,
      }))

      return newFavorites
    })
  }

  // Location services
  const requestLocationPermission = async () => {
    try {
      setLocationPermission("requesting")
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        })
      })

      const { latitude, longitude } = position.coords
      await api.post("/social/location", {
        latitude,
        longitude,
        location_name: "Current Location",
      })

      const locationData = { latitude, longitude }
      setUserLocation(locationData)
      setLocationPermission("granted")
      localStorage.setItem("user_location", JSON.stringify(locationData))
      showToast("Location updated successfully!", "success")
      fetchPublicTrips()
    } catch (error) {
      console.error("❌ Location error:", error)
      setLocationPermission("denied")
      showToast("Location access denied. Some features may be limited.", "error")
    }
  }

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    const handleConnectionRequest = (data) => {
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
      fetchPublicTrips()
      showToast(`${data.fromUserName} accepted your connection request!`, "success")
    }

    const handleConnectionReady = (data) => {
      fetchPublicTrips()
    }

    const handleConnectionRejected = (data) => {
      showToast("Your connection request was declined", "info")
      fetchPublicTrips()
    }

    const handleConnectionDisconnected = (data) => {
      showToast(`${data.fromUserName} disconnected from you`, "info")
      fetchPublicTrips()
    }

    const handleMessageNotification = (data) => {
      setMessageNotifications((prev) => [
        ...prev,
        {
          id: Date.now(),
          ...data,
          timestamp: new Date().toISOString(),
        },
      ])
      showToast(`New message from ${data.senderName}: ${data.preview}`, "info")
    }

    socket.on("connection-requested", handleConnectionRequest)
    socket.on("connection-accepted", handleConnectionAccepted)
    socket.on("connection-ready", handleConnectionReady)
    socket.on("connection-rejected", handleConnectionRejected)
    socket.on("connection-disconnected", handleConnectionDisconnected)
    socket.on("new-message-notification", handleMessageNotification)

    return () => {
      socket.off("connection-requested", handleConnectionRequest)
      socket.off("connection-accepted", handleConnectionAccepted)
      socket.off("connection-ready", handleConnectionReady)
      socket.off("connection-rejected", handleConnectionRejected)
      socket.off("connection-disconnected", handleConnectionDisconnected)
      socket.off("new-message-notification", handleMessageNotification)
    }
  }, [socket])

  // Toast notification system
  const showToast = (message, type = "info") => {
    const toast = document.createElement("div")
    toast.className = `fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl backdrop-blur-lg border transition-all duration-500 transform ${
      type === "success"
        ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-100"
        : type === "error"
          ? "bg-red-500/20 border-red-400/30 text-red-100"
          : type === "warning"
            ? "bg-amber-500/20 border-amber-400/30 text-amber-100"
            : "bg-cyan-500/20 border-cyan-400/30 text-cyan-100"
    }`
    toast.textContent = message
    document.body.appendChild(toast)

    setTimeout(() => {
      toast.style.opacity = "0"
      toast.style.transform = "translateX(100%)"
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast)
        }
      }, 500)
    }, 4000)
  }

  // Fetch public trips
  const fetchPublicTrips = async () => {
    try {
      setLoading(true)
      let currentUserLocation = userLocation
      if (!currentUserLocation) {
        try {
          const savedLocation = localStorage.getItem("user_location")
          if (savedLocation) {
            currentUserLocation = JSON.parse(savedLocation)
            setUserLocation(currentUserLocation)
          }
        } catch (error) {
          console.warn("Could not load saved location:", error)
        }
      }

      const response = await api.get("/social/discover", {
        params: {
          destination: searchQuery,
          sortBy,
          limit: 50,
          includeLocation: true,
          latitude: currentUserLocation?.latitude,
          longitude: currentUserLocation?.longitude,
        },
      })

      if (response.data.success) {
        const trips = response.data.travelers || []
        const enhancedTrips = trips.map((trip) => {
          let distance_km = trip.distance_km
          let distance_text = null

          if (currentUserLocation && trip.latitude && trip.longitude && !distance_km) {
            const R = 6371
            const dLat = ((trip.latitude - currentUserLocation.latitude) * Math.PI) / 180
            const dLon = ((trip.longitude - currentUserLocation.longitude) * Math.PI) / 180
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((currentUserLocation.latitude * Math.PI) / 180) *
                Math.cos((trip.latitude * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
            distance_km = R * c
          }

          if (distance_km) {
            if (distance_km < 1) {
              distance_text = `${Math.round(distance_km * 1000)}m away`
            } else {
              distance_text = `${Math.round(distance_km * 10) / 10}km away`
            }
          }

          return {
            ...trip,
            status: getUserOnlineStatus(trip),
            distance_km,
            distance_text,
          }
        })

        setPublicTrips(enhancedTrips)

        // ✅ Sync favorites with current public trips
        setTimeout(() => {
          syncFavoritesWithPublicTrips()
        }, 100)
        setStats({
          activeTravelers: enhancedTrips.length,
          totalConnections: enhancedTrips.filter((trip) => trip.connection_status === "connected").length,
          favoriteCount: favoriteTrips.size,
        })
      }
    } catch (error) {
      console.error("Error fetching public trips:", error)
      showToast("Failed to load public trips", "error")
    } finally {
      setLoading(false)
    }
  }

  // Handle connect click
  const handleConnectClick = async (trip) => {
    if (connectingUsers.has(trip.user_id)) return

    if (trip.connection_status === "connected" && trip.room_id) {
      navigate(`/chat/${trip.room_id}`)
      return
    }

    try {
      setConnectingUsers((prev) => new Set(prev).add(trip.user_id))
      const response = await api.post("/chat/connect", {
        targetUserId: trip.user_id,
      })

      if (response.data.success) {
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
        showToast("Connection request sent! Waiting for acceptance.", "success")
      }
    } catch (error) {
      console.error("❌ Error connecting to user:", error)
      showToast("Failed to send connection request. Please try again.", "error")
    } finally {
      setConnectingUsers((prev) => {
        const newSet = new Set(prev)
        newSet.delete(trip.user_id)
        return newSet
      })
    }
  }

  // Handle disconnect click
  const handleDisconnectClick = async (trip) => {
    if (disconnectingUsers.has(trip.user_id)) return

    const confirmDisconnect = window.confirm(
      `Are you sure you want to disconnect from ${trip.user_name || "this user"}? This will end your chat session.`,
    )

    if (!confirmDisconnect) return

    try {
      setDisconnectingUsers((prev) => new Set(prev).add(trip.user_id))
      const response = await api.post("/chat/disconnect", {
        targetUserId: trip.user_id,
      })

      if (response.data.success) {
        if (socket && isConnected) {
          socket.emit("disconnect-user", {
            fromUserId: user.id,
            toUserId: trip.user_id,
          })
        }
        showToast("Successfully disconnected from user", "success")
        fetchPublicTrips()
      }
    } catch (error) {
      console.error("❌ Error disconnecting from user:", error)
      showToast("Failed to disconnect from user. Please try again.", "error")
    } finally {
      setDisconnectingUsers((prev) => {
        const newSet = new Set(prev)
        newSet.delete(trip.user_id)
        return newSet
      })
    }
  }

  // Handle connection response
  const handleConnectionResponse = async (request, accepted) => {
    try {
      if (accepted) {
        if (socket && isConnected) {
          socket.emit("accept-connection-request", {
            fromUserId: request.fromUserId,
            toUserId: user.id,
            roomId: request.roomId,
          })
        }

        try {
          await api.post("/chat/accept-connection", {
            fromUserId: request.fromUserId,
            roomId: request.roomId,
          })
        } catch (backendError) {
          console.warn("⚠️ Failed to update backend connection status:", backendError)
        }

        showToast("Connection accepted! You can now chat.", "success")
        setTimeout(() => {
          navigate(`/chat/${request.roomId}`)
        }, 1000)
      } else {
        if (socket && isConnected) {
          socket.emit("reject-connection-request", {
            fromUserId: request.fromUserId,
            toUserId: user.id,
            roomId: request.roomId,
          })
        }
        showToast("Connection request declined", "info")
      }

      setConnectionRequests((prev) => prev.filter((req) => req.id !== request.id))
      fetchPublicTrips()
    } catch (error) {
      console.error("❌ Error handling connection response:", error)
      showToast("Failed to process connection request. Please try again.", "error")
      setConnectionRequests((prev) => prev.filter((req) => req.id !== request.id))
    }
  }

  // Dismiss functions
  const dismissRequest = (requestId) => {
    setConnectionRequests((prev) => prev.filter((req) => req.id !== requestId))
  }

  const dismissMessageNotification = (notificationId) => {
    setMessageNotifications((prev) => prev.filter((notif) => notif.id !== notificationId))
  }

  // Handle message notification click
  const handleMessageNotificationClick = (notification) => {
    navigate(`/chat/${notification.roomId}`)
    setMessageNotifications((prev) => prev.filter((notif) => notif.id !== notification.id))
  }

  // ✅ NEW: Sync favorites with public trips in real-time
  const syncFavoritesWithPublicTrips = () => {
    setFavoriteTrips((prev) => {
      const updatedFavorites = new Set()
      const currentPublicTripIds = publicTrips.map((trip) => trip.id)

      // Only keep favorites that are still public
      prev.forEach((tripId) => {
        if (currentPublicTripIds.includes(tripId)) {
          updatedFavorites.add(tripId)
        }
      })

      // Update localStorage
      localStorage.setItem("favorite_trips", JSON.stringify([...updatedFavorites]))

      // Update stats
      setStats((prevStats) => ({
        ...prevStats,
        favoriteCount: updatedFavorites.size,
      }))

      return updatedFavorites
    })
  }

  // useEffect hooks
  useEffect(() => {
    if (token) {
      fetchPublicTrips()
    }
  }, [token, searchQuery, sortBy])

  useEffect(() => {
    if (navigator.geolocation && locationPermission === "prompt") {
      requestLocationPermission()
    }
  }, [])

  // Filter functions
  const filteredTrips = publicTrips.filter(
    (trip) =>
      trip.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.user_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Get trips based on active tab
  const getDisplayTrips = () => {
    if (activeTab === "favorites") {
      return filteredTrips.filter((trip) => favoriteTrips.has(trip.id))
    }
    return filteredTrips
  }

  // Trip Card Component - Clean, Professional Design
  const TripCard = ({ trip }) => {
    const isConnecting = connectingUsers.has(trip.user_id)
    const isDisconnecting = disconnectingUsers.has(trip.user_id)
    const isFavorite = favoriteTrips.has(trip.id)

    return (
      <div
        className={`group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] transform ${
          theme === "light"
            ? "bg-white border-2 border-gray-200 hover:border-gray-300 shadow-lg hover:shadow-xl"
            : "bg-gray-800 border-2 border-gray-700 hover:border-gray-600 shadow-lg hover:shadow-xl"
        }`}
      >
        {/* Subtle hover effect */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${
            theme === "light"
              ? "bg-gradient-to-br from-blue-50/50 to-indigo-50/50"
              : "bg-gradient-to-br from-gray-700/20 to-gray-600/20"
          }`}
        ></div>

        <div className="relative p-6 z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                {/* Clean Avatar */}
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md ${
                    theme === "light"
                      ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                      : "bg-gradient-to-br from-blue-600 to-indigo-700"
                  }`}
                >
                  {trip.avatar_url ? (
                    <img
                      src={trip.avatar_url || "/placeholder.svg"}
                      alt={trip.user_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-lg">{trip.user_name?.charAt(0) || "U"}</span>
                  )}
                </div>
                {/* Status indicator */}
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${
                    theme === "light" ? "border-white" : "border-gray-800"
                  } ${
                    trip.status === "Online" ? "bg-green-500" : trip.status === "Away" ? "bg-yellow-500" : "bg-gray-400"
                  }`}
                ></div>
              </div>
              <div>
                <h3 className={`font-bold text-lg mb-1 ${theme === "light" ? "text-gray-900" : "text-white"}`}>
                  {trip.user_name || "Anonymous"}
                </h3>
                <p
                  className={`text-sm ${theme === "light" ? "text-blue-600" : "text-blue-400"} flex items-center font-medium`}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  {trip.destination}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  trip.status === "Online"
                    ? theme === "light"
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : "bg-green-900/30 text-green-300 border border-green-700/50"
                    : trip.status === "Away"
                      ? theme === "light"
                        ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                        : "bg-yellow-900/30 text-yellow-300 border border-yellow-700/50"
                      : theme === "light"
                        ? "bg-gray-100 text-gray-600 border border-gray-200"
                        : "bg-gray-700/50 text-gray-300 border border-gray-600/50"
                }`}
              >
                {trip.status}
              </span>
              <button
                onClick={() => handleFavoriteToggle(trip.id)}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isFavorite
                    ? theme === "light"
                      ? "bg-red-50 text-red-600 hover:bg-red-100"
                      : "bg-red-900/30 text-red-400 hover:bg-red-900/50"
                    : theme === "light"
                      ? "bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                      : "bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-red-400"
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
              </button>
            </div>
          </div>

          {/* Distance Badge */}
          {trip.distance_text && (
            <div className="mb-4">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  theme === "light"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-blue-900/30 text-blue-300 border border-blue-700/50"
                }`}
              >
                <MapPin className="w-3 h-3 mr-1" />
                {trip.distance_text}
              </span>
            </div>
          )}

          {/* Trip Details Grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div
              className={`rounded-lg p-3 ${
                theme === "light" ? "bg-gray-50 border border-gray-200" : "bg-gray-700/50 border border-gray-600/50"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Calendar className={`w-4 h-4 ${theme === "light" ? "text-blue-600" : "text-blue-400"}`} />
                <span className={`text-sm font-medium ${theme === "light" ? "text-gray-900" : "text-white"}`}>
                  {trip.days} days
                </span>
              </div>
            </div>
            <div
              className={`rounded-lg p-3 ${
                theme === "light" ? "bg-gray-50 border border-gray-200" : "bg-gray-700/50 border border-gray-600/50"
              }`}
            >
              <div className="flex items-center space-x-2">
                <DollarSign className={`w-4 h-4 ${theme === "light" ? "text-green-600" : "text-green-400"}`} />
                <span className={`text-sm font-medium ${theme === "light" ? "text-gray-900" : "text-white"}`}>
                  ₹{(Number(trip.budget) / 1000).toFixed(0)}K
                </span>
              </div>
            </div>
            <div
              className={`rounded-lg p-3 col-span-2 ${
                theme === "light" ? "bg-gray-50 border border-gray-200" : "bg-gray-700/50 border border-gray-600/50"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className={`w-4 h-4 ${theme === "light" ? "text-purple-600" : "text-purple-400"}`} />
                <span className={`text-sm font-medium ${theme === "light" ? "text-gray-900" : "text-white"}`}>
                  {trip.travelers || 1} travelers
                </span>
              </div>
            </div>
          </div>

          {/* Interests Tags */}
          {trip.interests && trip.interests.length > 0 && (
            <div className="mb-5">
              <div className="flex flex-wrap gap-2">
                {trip.interests.slice(0, 3).map((interest, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      theme === "light"
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        : "bg-indigo-900/30 text-indigo-300 border border-indigo-700/50"
                    }`}
                  >
                    {interest}
                  </span>
                ))}
                {trip.interests.length > 3 && (
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      theme === "light"
                        ? "bg-gray-100 text-gray-600 border border-gray-200"
                        : "bg-gray-700/50 text-gray-300 border border-gray-600/50"
                    }`}
                  >
                    +{trip.interests.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Connection Status */}
          {trip.connection_status === "connected" && (
            <div
              className={`mb-4 p-3 rounded-lg ${
                theme === "light" ? "bg-green-50 border border-green-200" : "bg-green-900/30 border border-green-700/50"
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className={`w-5 h-5 ${theme === "light" ? "text-green-600" : "text-green-400"}`} />
                <span className={`font-medium text-sm ${theme === "light" ? "text-green-800" : "text-green-300"}`}>
                  Connected
                </span>
                <Sparkles className={`w-4 h-4 ${theme === "light" ? "text-green-600" : "text-green-400"}`} />
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex items-center space-x-3">
            {trip.connection_status === "connected" ? (
              <button
                onClick={() => handleDisconnectClick(trip)}
                disabled={isDisconnecting}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 ${
                  theme === "light"
                    ? "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg"
                    : "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg"
                }`}
              >
                <UserMinus className="w-4 h-4" />
                <span>{isDisconnecting ? "Disconnecting..." : "Disconnect"}</span>
              </button>
            ) : (
              <button
                onClick={() => handleConnectClick(trip)}
                disabled={isConnecting || trip.connection_status === "pending"}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 ${
                  theme === "light"
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>
                  {isConnecting ? "Connecting..." : trip.connection_status === "pending" ? "Pending" : "Connect"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Connection Request Notification Component
  const ConnectionRequestNotification = ({ request }) => (
    <div
      className={`border-2 rounded-xl p-4 mb-3 backdrop-blur-lg ${theme === "dark" ? "bg-gray-800/90 border-gray-600/70" : "bg-white/90 border-gray-300/70"}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            {request.fromUserAvatar ? (
              <img
                src={request.fromUserAvatar || "/placeholder.svg"}
                alt={request.fromUserName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-bold">{request.fromUserName?.charAt(0) || "U"}</span>
            )}
          </div>
          <div className="flex-1">
            <h4 className={`font-bold text-base ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              Connection Request
            </h4>
            <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"} mt-1 font-medium`}>
              From: {request.fromUserName}
            </p>
          </div>
        </div>
        <button
          onClick={() => dismissRequest(request.id)}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center space-x-3 mt-4">
        <button
          onClick={() => handleConnectionResponse(request, true)}
          className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-lg text-sm font-bold transition-all duration-300 transform hover:scale-105"
        >
          <Check className="w-4 h-4" />
          <span>Accept</span>
        </button>
        <button
          onClick={() => handleConnectionResponse(request, false)}
          className="px-5 py-3 bg-gray-600/70 border-2 border-gray-500 text-gray-200 hover:text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Decline
        </button>
      </div>
    </div>
  )

  // Message Notification Component
  const MessageNotificationCard = ({ notification }) => (
    <div
      className={`border-2 rounded-xl p-4 mb-3 cursor-pointer backdrop-blur-lg transition-all duration-300 hover:scale-105 ${theme === "dark" ? "bg-gray-800/90 border-gray-600/70 hover:border-purple-500/70" : "bg-white/90 border-gray-300/70 hover:border-purple-400/70"}`}
      onClick={() => handleMessageNotificationClick(notification)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
            {notification.senderAvatar ? (
              <img
                src={notification.senderAvatar || "/placeholder.svg"}
                alt={notification.senderName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-bold">{notification.senderName?.charAt(0) || "U"}</span>
            )}
          </div>
          <div className="flex-1">
            <h4 className={`font-bold text-base ${theme === "dark" ? "text-white" : "text-gray-900"}`}>New Message</h4>
            <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"} mt-1 font-medium`}>
              From: {notification.senderName}
            </p>
            <p className={`text-sm ${theme === "dark" ? "text-white" : "text-gray-900"} mt-1 truncate font-medium`}>
              {notification.preview}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            dismissMessageNotification(notification.id)
          }}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )

  // Global Incoming Call Modal
  const GlobalIncomingCallModal = () => {
    if (!incomingCall) return null

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div
          className={`rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl backdrop-blur-xl border-2 ${theme === "dark" ? "bg-gray-900/95 border-gray-600/70" : "bg-white/95 border-gray-300/70"}`}
        >
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse">
            {incomingCall.callType === "video" ? (
              <Video className="w-10 h-10 text-white" />
            ) : (
              <Phone className="w-10 h-10 text-white" />
            )}
          </div>
          <h3 className={`text-2xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
            Incoming {incomingCall.callType === "video" ? "Video" : "Audio"} Call
          </h3>
          <p className={`mb-8 text-lg font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
            From: {incomingCall.fromUserName}
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => {
                rejectCall(incomingCall.callId)
                setIncomingCall(null)
                stopAllSounds()
              }}
              className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 shadow-lg border-2 border-red-400/50"
            >
              <PhoneOff className="w-6 h-6" />
              Reject
            </button>
            <button
              onClick={() => {
                navigate(`/chat/${incomingCall.roomId}`)
                acceptCall(incomingCall.callId)
                setIncomingCall(null)
                stopAllSounds()
              }}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 shadow-lg border-2 border-emerald-400/50"
            >
              {incomingCall.callType === "video" ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
              Accept
            </button>
          </div>
        </div>
      </div>
    )
  }

  const displayTrips = getDisplayTrips()

  return (
    <div
      className={`min-h-screen relative overflow-hidden ${
        theme === "dark" ? "bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" : "bg-gray-50"
      }`}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Orbs */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full blur-3xl opacity-10 animate-float ${
              theme === "dark"
                ? "bg-gradient-to-r from-cyan-500 to-purple-500"
                : "bg-gradient-to-r from-blue-400 to-purple-400"
            }`}
            style={{
              width: `${Math.random() * 200 + 100}px`,
              height: `${Math.random() * 200 + 100}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 2}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          ></div>
        ))}

        {/* Grid Pattern */}
        <div
          className={`absolute inset-0 ${
            theme === "dark"
              ? "bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)]"
              : "bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.03)_1px,transparent_0)]"
          } [background-size:40px_40px]`}
        ></div>
      </div>

      {/* Global Incoming Call Modal */}
      <GlobalIncomingCallModal />

      <div className="container mx-auto p-6 relative z-10">
        {/* Futuristic Header */}
        <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between py-8 mb-12">
          <div className="flex items-center space-x-6 mb-6 lg:mb-0">
            {/* Logo with Holographic Effect */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-60 animate-pulse"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-gray-900 to-purple-900 rounded-2xl flex items-center justify-center shadow-2xl border-2 border-cyan-400/50">
                <Rocket className="h-8 w-8 text-cyan-400" />
              </div>
            </div>

            <div>
              <h1
                className={`text-4xl font-black mb-2 ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                    : "bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                }`}
              >
                PUBLIC TRIPS
              </h1>
              <p
                className={`text-lg font-semibold ${theme === "dark" ? "text-gray-200" : "text-gray-700"} flex items-center space-x-2`}
              >
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <span>Discover • Connect • Explore Together</span>
              </p>
            </div>
          </div>

          {/* Control Panel */}
          <div className="flex items-center space-x-4">
            {/* Location Status */}
            <button
              onClick={requestLocationPermission}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl border-2 backdrop-blur-sm transition-all duration-300 transform hover:scale-105 ${
                locationPermission === "granted"
                  ? theme === "light"
                    ? "bg-white border-emerald-500 text-emerald-700"
                    : "bg-emerald-500/30 border-emerald-400/70 text-emerald-200"
                  : locationPermission === "requesting"
                    ? theme === "light"
                      ? "bg-white border-amber-500 text-amber-700"
                      : "bg-amber-500/30 border-amber-400/70 text-amber-200"
                    : theme === "light"
                      ? "bg-white border-red-500 text-red-700"
                      : "bg-red-500/30 border-red-400/70 text-red-200"
              }`}
            >
              <Navigation className="w-5 h-5" />
              <span className="text-sm font-semibold">
                {locationPermission === "granted"
                  ? "Location Active"
                  : locationPermission === "requesting"
                    ? "Locating..."
                    : "Enable Location"}
              </span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl hover:bg-white/30 transition-all duration-300 transform hover:scale-110"
            >
              {theme === "dark" ? (
                <Sun className="w-6 h-6 text-amber-400" />
              ) : (
                <Moon className="w-6 h-6 text-purple-400" />
              )}
            </button>

            {/* Connection Status */}
            <div
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl border-2 backdrop-blur-sm ${
                isConnected
                  ? theme === "light"
                    ? "bg-white border-emerald-500 text-emerald-700"
                    : "bg-emerald-500/30 border-emerald-400/70 text-emerald-200"
                  : theme === "light"
                    ? "bg-white border-red-500 text-red-700"
                    : "bg-red-500/30 border-red-400/70 text-red-200"
              }`}
            >
              {isConnected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
              <span className="text-sm font-bold">{isConnected ? "Connected" : "Disconnected"}</span>
            </div>
          </div>
        </header>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-base font-semibold mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-800"}`}>
                  Active Travelers
                </p>
                <p className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  {stats.activeTravelers}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/30 to-purple-500/30 rounded-xl flex items-center justify-center border-2 border-cyan-400/50">
                <Globe className="w-7 h-7 text-cyan-300" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-base font-semibold mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-800"}`}>
                  Your Connections
                </p>
                <p className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  {stats.totalConnections}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 rounded-xl flex items-center justify-center border-2 border-emerald-400/50">
                <Users className="w-7 h-7 text-emerald-300" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-base font-semibold mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-800"}`}>
                  Favorite Trips
                </p>
                <p className="text-3xl font-black bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                  {stats.favoriteCount}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500/30 to-rose-500/30 rounded-xl flex items-center justify-center border-2 border-pink-400/50">
                <Heart className="w-7 h-7 text-pink-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-base transition-all duration-300 transform hover:scale-105 border-2 ${
              activeTab === "all"
                ? theme === "light"
                  ? "bg-white border-cyan-500 text-cyan-700 shadow-lg"
                  : "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg border-cyan-400/50"
                : theme === "light"
                  ? "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                  : "bg-white/10 backdrop-blur-sm border-white/30 text-white/80 hover:bg-white/20 hover:border-white/50"
            }`}
          >
            <Globe className="w-5 h-5" />
            <span>All Trips ({filteredTrips.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("favorites")}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-base transition-all duration-300 transform hover:scale-105 border-2 ${
              activeTab === "favorites"
                ? theme === "light"
                  ? "bg-white border-pink-500 text-pink-700 shadow-lg"
                  : "bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg border-pink-400/50"
                : theme === "light"
                  ? "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                  : "bg-white/10 backdrop-blur-sm border-white/30 text-white/80 hover:bg-white/20 hover:border-white/50"
            }`}
          >
            <Heart className="w-5 h-5" />
            <span>Favorites ({favoriteTrips.size})</span>
          </button>
        </div>

        {/* Search and Filter Panel */}
        <div
          className={`backdrop-blur-xl border-2 rounded-2xl p-6 mb-12 shadow-xl ${
            theme === "light" ? "bg-white border-gray-200" : "bg-white/10 border-white/20"
          }`}
        >
          <div className="flex flex-col md:flex-row gap-6">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-cyan-400" />
              <input
                type="text"
                placeholder="Search destinations or travelers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full backdrop-blur-sm border-2 rounded-xl pl-12 pr-4 py-4 focus:outline-none transition-all duration-300 text-base font-medium ${
                  theme === "light"
                    ? "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                    : "bg-white/20 border-white/30 text-white placeholder-gray-300 focus:border-cyan-400/70 focus:bg-white/30"
                }`}
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-3">
              <Compass className="w-6 h-6 text-purple-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`px-6 py-4 backdrop-blur-sm border-2 rounded-xl focus:outline-none transition-all duration-300 text-base font-medium ${
                  theme === "light"
                    ? "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                    : "bg-white/20 border-white/30 text-white focus:border-purple-400/70"
                }`}
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="budget">Budget</option>
                <option value="duration">Duration</option>
              </select>
            </div>

            {/* Filter Button */}
            <button
              className={`flex items-center space-x-2 px-6 py-4 border-2 rounded-xl transition-all duration-300 transform hover:scale-105 font-semibold ${
                theme === "light"
                  ? "bg-white border-purple-500 text-purple-700 hover:bg-purple-50"
                  : "bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-purple-400/50 text-purple-200 hover:bg-gradient-to-r hover:from-purple-500/40 hover:to-pink-500/40"
              }`}
            >
              <Filter className="w-6 h-6" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div>
          <h2
            className={`text-3xl font-black mb-8 ${theme === "dark" ? "text-white" : "text-gray-900"} flex items-center space-x-3`}
          >
            <TrendingUp className="w-8 h-8 text-cyan-400" />
            <span>{activeTab === "favorites" ? "Your Favorite Adventures" : "Discover Adventures"}</span>
            <div className="flex-1 h-px bg-gradient-to-r from-cyan-400/50 to-transparent"></div>
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="animate-pulse bg-white/10 backdrop-blur-sm rounded-2xl p-8 border-2 border-white/20"
                >
                  <div className="h-48 bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-xl mb-6"></div>
                  <div className="h-6 bg-gray-700/50 rounded-lg w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-700/50 rounded-lg w-1/2"></div>
                </div>
              ))}
            </div>
          ) : displayTrips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-32 h-32 bg-gradient-to-br from-gray-700/50 to-gray-600/50 rounded-full flex items-center justify-center mx-auto mb-6">
                {activeTab === "favorites" ? (
                  <Heart className="w-16 h-16 text-gray-500" />
                ) : (
                  <Globe className="w-16 h-16 text-gray-500" />
                )}
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {activeTab === "favorites" ? "No Favorite Trips Yet" : "No Adventures Found"}
              </h3>
              <p className={`text-lg font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                {activeTab === "favorites"
                  ? "Start adding trips to your favorites by clicking the heart icon"
                  : "Try adjusting your search or explore different destinations"}
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export default PublicTrips
