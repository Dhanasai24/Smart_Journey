"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../assets/Context/AuthContext"
import { useTheme } from "../assets/Context/ThemeContext"
import { API_BASE_URL } from "../assets/Utils/Constants"
import axios from "axios"
import {
  MapPin,
  Navigation,
  Clock,
  X,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Send,
  Timer,
  Shield,
  Globe,
  Building,
  Flag,
} from "lucide-react"

const UserLocationModal = ({ isOpen, onClose, targetUserId, targetUserName }) => {
  const { user, token } = useAuth()
  const { getThemeClasses } = useTheme()
  const [loading, setLoading] = useState(false)
  const [locationData, setLocationData] = useState(null)
  const [error, setError] = useState(null)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [requestMessage, setRequestMessage] = useState("")
  const [requestDuration, setRequestDuration] = useState(60)
  const [sendingRequest, setSendingRequest] = useState(false)

  const themeClasses = getThemeClasses()

  // Helper function to safely format coordinates
  const formatCoordinate = (coord) => {
    if (!coord) return "0.000000"
    const num = Number.parseFloat(coord)
    return isNaN(num) ? "0.000000" : num.toFixed(6)
  }

  // Helper function to validate coordinates
  const hasValidCoordinates = (location) => {
    if (!location) return false
    const lat = Number.parseFloat(location.latitude)
    const lng = Number.parseFloat(location.longitude)
    return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0
  }

  // ✅ NEW: Helper function to get user online status
  const getUserOnlineStatus = (userData) => {
    // If user is connected via socket, they're online
    if (locationData?.connectionInfo?.status === "connected") {
      return "online"
    }

    // Check if last_active is recent (within 5 minutes)
    if (userData?.last_active) {
      const lastActive = new Date(userData.last_active)
      const now = new Date()
      const diffInMinutes = (now - lastActive) / (1000 * 60)

      if (diffInMinutes <= 5) {
        return "online"
      } else if (diffInMinutes <= 30) {
        return "away"
      }
    }

    return "offline"
  }

  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  // Fetch user location when modal opens
  useEffect(() => {
    if (isOpen && targetUserId) {
      fetchUserLocation()
    }
  }, [isOpen, targetUserId])

  const fetchUserLocation = async () => {
    try {
      setLoading(true)
      setError(null)
      setShowRequestForm(false)

      console.log(`📍 Fetching location for user ${targetUserId}`)

      // ✅ UPDATED: Use the new social location endpoint
      const response = await api.get(`/social/user-location/${targetUserId}`)

      if (response.data?.success) {
        setLocationData(response.data)
        console.log("✅ Location data received:", response.data)
        setError(null)
      } else {
        if (response.data?.canRequestLocation) {
          setLocationData(response.data)
          setError(null)
        } else {
          setError(response.data?.message || "Failed to fetch location")
        }
      }
    } catch (error) {
      console.error("❌ Error fetching user location:", error)

      if (error.response?.data?.canRequestLocation) {
        setLocationData(error.response.data)
        setError(null)
      } else {
        setError(error.response?.data?.message || "Failed to fetch user location")
      }
    } finally {
      setLoading(false)
    }
  }

  const sendLocationRequest = async () => {
    try {
      setSendingRequest(true)

      const response = await api.post("/social/request-location", {
        targetUserId: targetUserId,
        message: requestMessage || `${user.name} would like to see your location`,
        duration: requestDuration,
      })

      if (response.data?.success) {
        setShowRequestForm(false)
        setRequestMessage("")
        await fetchUserLocation()

        const toast = document.createElement("div")
        toast.className =
          "fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg bg-green-500 text-white"
        toast.textContent = "Location request sent successfully!"
        document.body.appendChild(toast)
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast)
          }
        }, 3000)
      }
    } catch (error) {
      console.error("❌ Error sending location request:", error)
      const errorMessage = error.response?.data?.message || "Failed to send location request"

      const toast = document.createElement("div")
      toast.className =
        "fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg bg-red-500 text-white"
      toast.textContent = errorMessage
      document.body.appendChild(toast)
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast)
        }
      }, 3000)
    } finally {
      setSendingRequest(false)
    }
  }

  // ✅ ENHANCED: Open maps with place name instead of coordinates
  const openInMaps = () => {
    if (!hasValidCoordinates(locationData?.location)) return

    const location = locationData.location
    let searchQuery = ""

    // ✅ Priority order: formatted_address > city,state,country > coordinates
    if (location.formatted_address) {
      searchQuery = encodeURIComponent(location.formatted_address)
    } else if (location.city && location.country) {
      const parts = [location.city, location.state, location.country].filter(Boolean)
      searchQuery = encodeURIComponent(parts.join(", "))
    } else {
      // Fallback to coordinates
      const lat = Number.parseFloat(location.latitude)
      const lng = Number.parseFloat(location.longitude)
      searchQuery = `${lat},${lng}`
    }

    const url = `https://www.google.com/maps/search/${searchQuery}`
    window.open(url, "_blank")
  }

  // ✅ ENHANCED: Get directions with place name
  const getDirections = () => {
    if (!hasValidCoordinates(locationData?.location)) return

    const location = locationData.location
    let destination = ""

    // ✅ Priority order: formatted_address > city,state,country > coordinates
    if (location.formatted_address) {
      destination = encodeURIComponent(location.formatted_address)
    } else if (location.city && location.country) {
      const parts = [location.city, location.state, location.country].filter(Boolean)
      destination = encodeURIComponent(parts.join(", "))
    } else {
      // Fallback to coordinates
      const lat = Number.parseFloat(location.latitude)
      const lng = Number.parseFloat(location.longitude)
      destination = `${lat},${lng}`
    }

    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`
    window.open(url, "_blank")
  }

  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return "Unknown"

    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return date.toLocaleDateString()
  }

  const formatExpiresAt = (timestamp) => {
    if (!timestamp) return "Unknown"

    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((date - now) / (1000 * 60))

    if (diffInMinutes < 1) return "Expired"
    if (diffInMinutes < 60) return `Expires in ${diffInMinutes} minutes`
    if (diffInMinutes < 1440) return `Expires in ${Math.floor(diffInMinutes / 60)} hours`
    return `Expires on ${date.toLocaleDateString()}`
  }

  if (!isOpen) return null

  // ✅ Get the actual online status
  const userStatus = locationData?.user ? getUserOnlineStatus(locationData.user) : "offline"

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className={`${themeClasses.card} border ${themeClasses.border} rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${themeClasses.border}`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${themeClasses.primaryText}`}>User Location</h3>
              <p className={`text-sm ${themeClasses.secondaryText}`}>{targetUserName || "Unknown User"}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${themeClasses.secondaryText} hover:${themeClasses.primaryText} transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className={`${themeClasses.secondaryText}`}>Fetching location...</span>
              </div>
            </div>
          )}

          {error && !locationData?.canRequestLocation && (
            <div className="flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-red-500 font-medium">Location Access Denied</p>
                <p className={`text-sm ${themeClasses.secondaryText} mt-1`}>{error}</p>
              </div>
            </div>
          )}

          {/* Location Request Form */}
          {showRequestForm && (
            <div className="space-y-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <Send className="w-5 h-5 text-blue-500" />
                <h4 className="font-medium text-blue-500">Request Location Access</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.primaryText} mb-2`}>
                    Message (optional)
                  </label>
                  <textarea
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder={`${user.name} would like to see your location`}
                    className={`w-full px-3 py-2 ${themeClasses.input} border ${themeClasses.border} rounded-lg focus:outline-none focus:border-blue-500 resize-none`}
                    rows={3}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.primaryText} mb-2`}>Duration</label>
                  <select
                    value={requestDuration}
                    onChange={(e) => setRequestDuration(Number(e.target.value))}
                    className={`w-full px-3 py-2 ${themeClasses.input} border ${themeClasses.border} rounded-lg focus:outline-none focus:border-blue-500`}
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                    <option value={360}>6 hours</option>
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={sendLocationRequest}
                    disabled={sendingRequest}
                    className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {sendingRequest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>{sendingRequest ? "Sending..." : "Send Request"}</span>
                  </button>
                  <button
                    onClick={() => setShowRequestForm(false)}
                    className={`px-4 py-2 ${themeClasses.cardContent} border ${themeClasses.border} rounded-lg font-medium transition-all`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {locationData && !locationData.locationShared && locationData.canRequestLocation && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <EyeOff className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-yellow-500 font-medium">Location Sharing Disabled</p>
                  <p className={`text-sm ${themeClasses.secondaryText} mt-1`}>
                    {locationData.hasPendingRequest
                      ? "You have already sent a location request to this user"
                      : `${targetUserName} has disabled location sharing. You can request access below.`}
                  </p>
                </div>
              </div>

              {!locationData.hasPendingRequest && (
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Request Location Access</span>
                </button>
              )}

              {locationData.hasPendingRequest && (
                <div className="flex items-center space-x-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <Timer className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <div>
                    <p className="text-orange-500 font-medium">Request Pending</p>
                    <p className={`text-sm ${themeClasses.secondaryText} mt-1`}>
                      Waiting for {targetUserName} to respond to your location request
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {locationData && locationData.locationShared && (
            <>
              {/* User Info */}
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  {locationData.user.avatar_url ? (
                    <img
                      src={locationData.user.avatar_url || "/placeholder.svg"}
                      alt={locationData.user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-lg">{locationData.user.name?.charAt(0) || "U"}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold ${themeClasses.primaryText}`}>{locationData.user.name}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    {/* ✅ FIXED: Show correct online status */}
                    <div
                      className={`w-2 h-2 rounded-full ${
                        userStatus === "online"
                          ? "bg-green-500"
                          : userStatus === "away"
                            ? "bg-yellow-500"
                            : "bg-gray-400"
                      }`}
                    />
                    <span className={`text-sm ${themeClasses.secondaryText} capitalize`}>
                      {userStatus === "online" ? "Online" : userStatus === "away" ? "Away" : "Offline"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shared via permission notice */}
              {locationData.sharedViaPermission && (
                <div className="flex items-center space-x-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <Shield className="w-5 h-5 text-green-500" />
                  <div className="flex-1">
                    <p className="font-medium text-green-500">Location Shared via Request</p>
                    <p className={`text-sm ${themeClasses.secondaryText}`}>
                      {formatExpiresAt(locationData.permissionExpiresAt)}
                    </p>
                  </div>
                </div>
              )}

              {/* ✅ ENHANCED: Location Details with formatted address */}
              <div className="space-y-4">
                {/* Distance */}
                {locationData.location.distanceText && (
                  <div className="flex items-center space-x-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <Navigation className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-blue-500">Distance</p>
                      <p className={`text-sm ${themeClasses.secondaryText}`}>{locationData.location.distanceText}</p>
                    </div>
                  </div>
                )}

                {/* ✅ NEW: Formatted Address Display */}
                <div className="flex items-start space-x-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <MapPin className="w-5 h-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-green-500">Current Location</p>

                    {/* ✅ Primary formatted address */}
                    {locationData.location.formatted_address && (
                      <p className={`text-sm ${themeClasses.primaryText} mt-1 font-medium`}>
                        📍 {locationData.location.formatted_address}
                      </p>
                    )}

                    {/* ✅ City, State, Country breakdown */}
                    <div className="mt-2 space-y-1">
                      {locationData.location.city && (
                        <div className="flex items-center space-x-2">
                          <Building className="w-3 h-3 text-blue-500" />
                          <span className={`text-xs ${themeClasses.secondaryText}`}>
                            City: {locationData.location.city}
                          </span>
                        </div>
                      )}

                      {locationData.location.state && (
                        <div className="flex items-center space-x-2">
                          <Globe className="w-3 h-3 text-purple-500" />
                          <span className={`text-xs ${themeClasses.secondaryText}`}>
                            State: {locationData.location.state}
                          </span>
                        </div>
                      )}

                      {locationData.location.country && (
                        <div className="flex items-center space-x-2">
                          <Flag className="w-3 h-3 text-red-500" />
                          <span className={`text-xs ${themeClasses.secondaryText}`}>
                            Country: {locationData.location.country}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* ✅ Coordinates (fallback or additional info) */}
                    {hasValidCoordinates(locationData.location) && (
                      <p
                        className={`text-xs ${themeClasses.secondaryText} mt-2 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded`}
                      >
                        📐 {formatCoordinate(locationData.location.latitude)},{" "}
                        {formatCoordinate(locationData.location.longitude)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Last Updated */}
                <div className="flex items-center space-x-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="font-medium text-purple-500">Last Updated</p>
                    <p className={`text-sm ${themeClasses.secondaryText}`}>
                      {formatLastUpdated(locationData.location.updated_at)}
                    </p>
                  </div>
                </div>

                {/* Connection Status */}
                <div className="flex items-center space-x-3 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-cyan-500" />
                  <div>
                    <p className="font-medium text-cyan-500">Connection Status</p>
                    <p className={`text-sm ${themeClasses.secondaryText} capitalize`}>
                      {locationData.connectionInfo.status}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {hasValidCoordinates(locationData.location) && (
                <div className="flex space-x-3">
                  <button
                    onClick={openInMaps}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View on Map</span>
                  </button>
                  <button
                    onClick={getDirections}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Directions</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${themeClasses.border} bg-gray-50/50 dark:bg-gray-900/50`}>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Eye className="w-3 h-3" />
            <span>Location sharing is controlled by user privacy settings</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserLocationModal
