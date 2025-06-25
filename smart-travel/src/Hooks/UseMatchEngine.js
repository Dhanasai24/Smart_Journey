"use client"

import { useState, useEffect, useCallback } from "react"
import { useSocket } from "../Hooks/UseSocket"

export const useMatchEngine = () => {
  const { isConnected, matchedTravelers, joinPlanning, updateStatus, updateLocation, refreshMatches } = useSocket()

  const [userStatus, setUserStatus] = useState("discoverable")
  const [currentLocation, setCurrentLocation] = useState(null)
  const [matchFilters, setMatchFilters] = useState({
    maxDistance: 100,
    minCompatibility: 30,
    travelStyles: [],
    interests: [],
  })

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setCurrentLocation({ latitude, longitude })

          // Reverse geocoding to get location name (simplified)
          const locationName = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`
          updateLocation(latitude, longitude, locationName)
        },
        (error) => {
          console.error("Error getting location:", error)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
      )
    }
  }, [updateLocation])

  // Start planning mode
  const startPlanningMode = useCallback(
    (planningData) => {
      const { destination, interests, travelStyle } = planningData

      joinPlanning({
        destination,
        interests,
        location: currentLocation?.locationName || "Unknown",
        status: "planning_live",
      })

      setUserStatus("planning_live")
    },
    [joinPlanning, currentLocation],
  )

  // Update user status
  const changeStatus = useCallback(
    (newStatus) => {
      updateStatus(newStatus)
      setUserStatus(newStatus)
    },
    [updateStatus],
  )

  // Filter matches based on criteria
  const filteredMatches = matchedTravelers.filter((traveler) => {
    if (traveler.compatibility_score < matchFilters.minCompatibility) return false
    if (traveler.distance && traveler.distance > matchFilters.maxDistance) return false

    if (matchFilters.travelStyles.length > 0) {
      if (!matchFilters.travelStyles.includes(traveler.travel_style)) return false
    }

    if (matchFilters.interests.length > 0) {
      const travelerInterests = JSON.parse(traveler.interests || "[]")
      const hasCommonInterest = matchFilters.interests.some((interest) => travelerInterests.includes(interest))
      if (!hasCommonInterest) return false
    }

    return true
  })

  // Calculate match statistics
  const matchStats = {
    totalMatches: matchedTravelers.length,
    filteredMatches: filteredMatches.length,
    averageCompatibility:
      matchedTravelers.length > 0
        ? Math.round(matchedTravelers.reduce((sum, t) => sum + t.compatibility_score, 0) / matchedTravelers.length)
        : 0,
    nearbyMatches: matchedTravelers.filter((t) => t.distance && t.distance <= 50).length,
    highCompatibilityMatches: matchedTravelers.filter((t) => t.compatibility_score >= 70).length,
  }

  // Auto-refresh matches periodically
  useEffect(() => {
    if (isConnected && userStatus !== "hidden") {
      const interval = setInterval(() => {
        refreshMatches()
      }, 30000) // Refresh every 30 seconds

      return () => clearInterval(interval)
    }
  }, [isConnected, userStatus, refreshMatches])

  // Get location on mount
  useEffect(() => {
    getCurrentLocation()
  }, [getCurrentLocation])

  return {
    // State
    isConnected,
    userStatus,
    currentLocation,
    matchFilters,
    matchedTravelers: filteredMatches,
    matchStats,

    // Actions
    startPlanningMode,
    changeStatus,
    setMatchFilters,
    getCurrentLocation,
    refreshMatches,
  }
}
