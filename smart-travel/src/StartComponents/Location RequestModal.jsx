"use client"

import { useState } from "react"
import { useAuth } from "../assets/Context/AuthContext"
import { useTheme } from "../assets/Context/ThemeContext"
import { API_BASE_URL } from "../assets/Utils/Constants"
import axios from "axios"
import { MapPin, Clock, X, Check, XCircle, Loader2, Shield, Timer, User } from "lucide-react"

const LocationRequestModal = ({ isOpen, onClose, request, onResponse }) => {
  const { token } = useAuth()
  const { getThemeClasses } = useTheme()
  const [responding, setResponding] = useState(false)

  const themeClasses = getThemeClasses()

  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  const respondToRequest = async (approved) => {
    try {
      setResponding(true)

      const response = await api.post("/social/respond-location-request", {
        requestId: request.requestId || request.id,
        approved: approved,
      })

      if (response.data?.success) {
        // Show success message
        const toast = document.createElement("div")
        toast.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg ${
          approved ? "bg-green-500" : "bg-red-500"
        } text-white`
        toast.textContent = approved ? "Location request approved!" : "Location request denied"
        document.body.appendChild(toast)
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast)
          }
        }, 3000)

        // Call the response callback
        if (onResponse) {
          onResponse(approved)
        }

        // Close modal
        onClose()
      }
    } catch (error) {
      console.error("❌ Error responding to location request:", error)
      const errorMessage = error.response?.data?.message || "Failed to respond to request"

      // Show error message
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
      setResponding(false)
    }
  }

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} minutes`
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hours`
    return `${Math.floor(minutes / 1440)} days`
  }

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Unknown"

    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return date.toLocaleDateString()
  }

  if (!isOpen || !request) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className={`${themeClasses.card} border ${themeClasses.border} rounded-2xl shadow-2xl w-full max-w-md overflow-hidden`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${themeClasses.border}`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${themeClasses.primaryText}`}>Location Request</h3>
              <p className={`text-sm ${themeClasses.secondaryText}`}>Someone wants to see your location</p>
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
        <div className="p-6 space-y-6">
          {/* Requester Info */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              {request.fromUserAvatar ? (
                <img
                  src={request.fromUserAvatar || "/placeholder.svg"}
                  alt={request.fromUserName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="flex-1">
              <h4 className={`font-semibold ${themeClasses.primaryText}`}>{request.fromUserName || "Unknown User"}</h4>
              <p className={`text-sm ${themeClasses.secondaryText}`}>Requested {formatTimeAgo(request.timestamp)}</p>
            </div>
          </div>

          {/* Request Details */}
          <div className="space-y-4">
            {/* Message */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-500">Request Message</p>
                  <p className={`text-sm ${themeClasses.secondaryText} mt-1`}>
                    {request.message || `${request.fromUserName} would like to see your location`}
                  </p>
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <Timer className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-500">Sharing Duration</p>
                  <p className={`text-sm ${themeClasses.secondaryText}`}>{formatDuration(request.duration || 60)}</p>
                </div>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-yellow-500">Privacy Notice</p>
                  <p className={`text-sm ${themeClasses.secondaryText} mt-1`}>
                    Your location will be shared temporarily and automatically stop being shared after the specified
                    duration.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => respondToRequest(true)}
              disabled={responding}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {responding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{responding ? "Approving..." : "Approve"}</span>
            </button>
            <button
              onClick={() => respondToRequest(false)}
              disabled={responding}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {responding ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              <span>{responding ? "Denying..." : "Deny"}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${themeClasses.border} bg-gray-50/50 dark:bg-gray-900/50`}>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Shield className="w-3 h-3" />
            <span>You can revoke location sharing at any time in your privacy settings</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LocationRequestModal
