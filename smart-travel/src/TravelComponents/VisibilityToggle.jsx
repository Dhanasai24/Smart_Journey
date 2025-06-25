"use client"

import { useState } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "../assets/Context/AuthContext"
import { API_BASE_URL } from "../assets/Utils/Constants"

const VisibilityToggle = ({ trip, onVisibilityChange, className = "" }) => {
  const { token } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isPublic, setIsPublic] = useState(trip.is_public || trip.visibility === "public")

  const handleToggle = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (isLoading) return

    setIsLoading(true)
    const newVisibility = !isPublic

    try {
      // FIXED: Using correct API endpoint structure
      const response = await fetch(`${API_BASE_URL}/trips/${trip.id}/visibility`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPublic: newVisibility }),
      })

      if (response.ok) {
        const data = await response.json()

        // ✅ FIXED: Update local state immediately for UI responsiveness
        setIsPublic(newVisibility)

        // Emit WebSocket event for real-time updates (only if socket exists)
        if (window.socket && window.socket.connected) {
          window.socket.emit("trip-visibility-changed", {
            tripId: trip.id,
            isPublic: newVisibility,
            tripData: {
              ...trip,
              is_public: newVisibility,
              visibility: newVisibility ? "public" : "private",
            },
          })
        }

        // Call parent callback
        if (onVisibilityChange) {
          onVisibilityChange(trip.id, newVisibility, {
            ...trip,
            is_public: newVisibility,
            visibility: newVisibility ? "public" : "private",
            ...data.trip,
          })
        }

        console.log(`✅ Trip ${trip.id} visibility changed to ${newVisibility ? "public" : "private"}`)
      } else {
        const errorData = await response.json()
        console.error("API Error:", errorData)
        throw new Error(errorData.message || "Failed to update visibility")
      }
    } catch (error) {
      console.error("Error toggling visibility:", error)
      // Revert state on error
      setIsPublic(!newVisibility)

      // Show user-friendly error message
      alert("Failed to update trip visibility. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`relative group ${className}`}>
      <motion.button
        onClick={handleToggle}
        disabled={isLoading}
        className={`
          relative p-2 rounded-lg transition-all duration-300 
          ${
            isPublic
              ? "bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30"
              : "bg-slate-500/20 text-slate-400 border border-slate-500/50 hover:bg-slate-500/30"
          }
          ${isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:scale-110"}
          backdrop-blur-sm
        `}
        whileHover={{ scale: isLoading ? 1 : 1.1 }}
        whileTap={{ scale: isLoading ? 1 : 0.95 }}
        title={isPublic ? "Make private" : "Make visible to other travelers for matchmaking"}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, rotate: 0 }}
              animate={{ opacity: 1, rotate: 360 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Loader2 className="w-4 h-4 animate-spin" />
            </motion.div>
          ) : (
            <motion.div
              key={isPublic ? "public" : "private"}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              {isPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse effect for public trips */}
        {isPublic && !isLoading && (
          <motion.div
            className="absolute inset-0 rounded-lg bg-green-400/20"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        )}
      </motion.button>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50 backdrop-blur-sm">
        {isPublic ? "Make private" : "Make visible to other travelers for matchmaking"}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900/90"></div>
      </div>
    </div>
  )
}

export default VisibilityToggle
