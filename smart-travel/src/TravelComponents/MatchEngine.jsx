"use client"

import { useState, useEffect, useCallback } from "react"
import { Users, Calendar, Star, MessageCircle, Eye, Zap, Target, Globe, RefreshCw, AlertCircle } from "lucide-react"
import { API_BASE_URL } from "../assets/Utils/Constants"

const MatchEngine = ({ currentUser, userTrips = [], theme = "dark" }) => {
  const [matchedTravelers, setMatchedTravelers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const themeClasses = {
    card:
      theme === "light" ? "bg-white/90 border-gray-200/50 shadow-xl" : "bg-slate-900/50 border-slate-700/50 shadow-xl",
    text: theme === "light" ? "text-gray-900" : "text-slate-100",
    secondaryText: theme === "light" ? "text-gray-600" : "text-slate-400",
    accent: theme === "light" ? "text-blue-600" : "text-cyan-400",
  }

  // Add these functions at the top of the component (after the themeClasses definition)
  const handleConnectClick = useCallback(async (match) => {
    if (!match?.user_id) return

    try {
      // You can emit a custom event to communicate with parent component
      const connectEvent = new CustomEvent("matchEngineConnect", {
        detail: { match },
      })
      window.dispatchEvent(connectEvent)
    } catch (error) {
      console.error("Error connecting from match engine:", error)
    }
  }, [])

  const handleChatClick = useCallback(async (match) => {
    if (!match?.user_id) return

    try {
      // Emit custom event for chat
      const chatEvent = new CustomEvent("matchEngineChat", {
        detail: { match },
      })
      window.dispatchEvent(chatEvent)
    } catch (error) {
      console.error("Error opening chat from match engine:", error)
    }
  }, [])

  const handleViewLocation = useCallback((match) => {
    if (!match?.user_id) return

    try {
      // Emit custom event for location
      const locationEvent = new CustomEvent("matchEngineLocation", {
        detail: {
          userId: match.user_id,
          userName: match.user_name || match.display_name || `User ${match.user_id}`,
        },
      })
      window.dispatchEvent(locationEvent)
    } catch (error) {
      console.error("Error viewing location from match engine:", error)
    }
  }, [])

  // Safe calculation of match score with error handling
  const calculateMatchScore = (userTrip, otherTrip) => {
    try {
      if (!userTrip || !otherTrip) return { score: 0, factors: [] }

      let score = 0
      const factors = []

      // Safe destination comparison
      const userDest = (userTrip.destination || "").toLowerCase()
      const otherDest = (otherTrip.destination || "").toLowerCase()

      if (userDest && otherDest) {
        if (userDest === otherDest) {
          score += 40
          factors.push("Same destination")
        } else if (userDest.includes(otherDest) || otherDest.includes(userDest)) {
          score += 20
          factors.push("Similar destination")
        }
      }

      // Safe date comparison
      try {
        if (userTrip.start_date && userTrip.end_date && otherTrip.start_date && otherTrip.end_date) {
          const userStart = new Date(userTrip.start_date)
          const userEnd = new Date(userTrip.end_date)
          const otherStart = new Date(otherTrip.start_date)
          const otherEnd = new Date(otherTrip.end_date)

          // Check if dates are valid
          if (
            !isNaN(userStart.getTime()) &&
            !isNaN(userEnd.getTime()) &&
            !isNaN(otherStart.getTime()) &&
            !isNaN(otherEnd.getTime())
          ) {
            const overlapStart = new Date(Math.max(userStart, otherStart))
            const overlapEnd = new Date(Math.min(userEnd, otherEnd))

            if (overlapStart <= overlapEnd) {
              const overlapDays = (overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)
              const userTripDays = (userEnd - userStart) / (1000 * 60 * 60 * 24)

              if (userTripDays > 0) {
                const overlapPercentage = overlapDays / userTripDays

                if (overlapPercentage > 0.8) {
                  score += 30
                  factors.push("Perfect date match")
                } else if (overlapPercentage > 0.5) {
                  score += 20
                  factors.push("Good date overlap")
                } else if (overlapPercentage > 0.2) {
                  score += 10
                  factors.push("Some date overlap")
                }
              }
            }
          }
        }
      } catch (dateError) {
        console.warn("Date calculation error:", dateError)
      }

      // Safe interest comparison
      try {
        let userInterests = []
        let otherInterests = []

        // Handle different interest formats safely
        if (Array.isArray(userTrip.interests)) {
          userInterests = userTrip.interests
        } else if (typeof userTrip.interests === "string") {
          try {
            userInterests = JSON.parse(userTrip.interests)
          } catch {
            userInterests = userTrip.interests.split(",").map((i) => i.trim())
          }
        }

        if (Array.isArray(otherTrip.interests)) {
          otherInterests = otherTrip.interests
        } else if (typeof otherTrip.interests === "string") {
          try {
            otherInterests = JSON.parse(otherTrip.interests)
          } catch {
            otherInterests = otherTrip.interests.split(",").map((i) => i.trim())
          }
        }

        if (userInterests.length > 0 && otherInterests.length > 0) {
          const commonInterests = userInterests.filter((interest) =>
            otherInterests.some(
              (otherInt) =>
                otherInt.toLowerCase().includes(interest.toLowerCase()) ||
                interest.toLowerCase().includes(otherInt.toLowerCase()),
            ),
          )

          if (commonInterests.length > 0) {
            const interestScore = (commonInterests.length / Math.max(userInterests.length, otherInterests.length)) * 20
            score += interestScore
            factors.push(`${commonInterests.length} shared interests`)
          }
        }
      } catch (interestError) {
        console.warn("Interest calculation error:", interestError)
      }

      // Safe budget comparison
      try {
        const userBudget = Number(userTrip.budget) || 0
        const otherBudget = Number(otherTrip.budget) || 0

        if (userBudget > 0 && otherBudget > 0) {
          const budgetRatio = Math.min(userBudget, otherBudget) / Math.max(userBudget, otherBudget)
          score += budgetRatio * 10

          if (budgetRatio > 0.8) {
            factors.push("Similar budget")
          }
        }
      } catch (budgetError) {
        console.warn("Budget calculation error:", budgetError)
      }

      return {
        score: Math.round(Math.max(0, score)),
        factors: factors.slice(0, 3), // Limit factors to prevent UI overflow
      }
    } catch (error) {
      console.error("Match calculation error:", error)
      return { score: 0, factors: [] }
    }
  }

  // Safe fetch matches with comprehensive error handling
  const fetchMatches = async () => {
    try {
      setRefreshing(true)
      setError(null)

      // Validate inputs
      if (!currentUser?.userId) {
        throw new Error("User not authenticated")
      }

      if (!userTrips || userTrips.length === 0) {
        setMatchedTravelers([])
        setLoading(false)
        setRefreshing(false)
        return
      }

      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication token not found")
      }

      // Get all public trips with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(`${API_BASE_URL}/trips/public`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Failed to fetch public trips: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const publicTrips = Array.isArray(data.trips) ? data.trips : []

      // Calculate matches safely
      const matches = []

      userTrips.forEach((userTrip) => {
        if (!userTrip || !userTrip.id) return

        publicTrips.forEach((publicTrip) => {
          if (!publicTrip || !publicTrip.id) return

          // Don't match with own trips
          if (publicTrip.user_id === currentUser.userId) return

          try {
            const matchResult = calculateMatchScore(userTrip, publicTrip)

            // Only include matches with score > 15 (lowered threshold for better results)
            if (matchResult.score > 15) {
              matches.push({
                ...publicTrip,
                matchScore: matchResult.score,
                matchFactors: matchResult.factors,
                userTripId: userTrip.id,
                userTripDestination: userTrip.destination || "Unknown",
                // Ensure required fields have defaults
                destination: publicTrip.destination || "Unknown Destination",
                days: publicTrip.days || 1,
                travelers: publicTrip.travelers || 1,
                rating: publicTrip.rating || 4.0,
              })
            }
          } catch (matchError) {
            console.warn("Error calculating match for trip:", publicTrip.id, matchError)
          }
        })
      })

      // Sort by match score and remove duplicates safely
      const uniqueMatches = matches
        .filter((match, index, self) => {
          try {
            return index === self.findIndex((m) => m.id === match.id && m.userTripId === match.userTripId)
          } catch {
            return true
          }
        })
        .sort((a, b) => {
          try {
            return (b.matchScore || 0) - (a.matchScore || 0)
          } catch {
            return 0
          }
        })
        .slice(0, 10) // Limit to top 10 matches

      setMatchedTravelers(uniqueMatches)
    } catch (err) {
      console.error("Error fetching matches:", err)

      // Set user-friendly error message
      if (err.name === "AbortError") {
        setError("Request timed out. Please try again.")
      } else if (err.message.includes("fetch")) {
        setError("Network error. Please check your connection.")
      } else {
        setError("Unable to load travel matches. Please try again later.")
      }

      setMatchedTravelers([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Safe effect with cleanup
  useEffect(() => {
    let mounted = true

    const loadMatches = async () => {
      if (mounted && userTrips && userTrips.length > 0) {
        await fetchMatches()
      } else if (mounted) {
        setLoading(false)
      }
    }

    loadMatches()

    return () => {
      mounted = false
    }
  }, [userTrips, currentUser])

  // Get match color based on score safely
  const getMatchColor = (score) => {
    const safeScore = Number(score) || 0
    if (safeScore >= 80) return "from-emerald-500 to-green-400"
    if (safeScore >= 60) return "from-cyan-500 to-blue-400"
    if (safeScore >= 40) return "from-yellow-500 to-orange-400"
    return "from-red-500 to-pink-400"
  }

  // Loading state
  if (loading) {
    return (
      <div className={`${themeClasses.card} rounded-2xl border p-6 backdrop-blur-sm`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-700/50 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex space-x-4">
                <div className="w-16 h-16 bg-slate-700/50 rounded-xl"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-700/50 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-700/50 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={`${themeClasses.card} rounded-2xl border p-6 backdrop-blur-sm`}>
        <div className="text-center">
          <AlertCircle className={`h-12 w-12 ${themeClasses.secondaryText} mx-auto mb-4`} />
          <h3 className={`text-lg font-semibold ${themeClasses.text} mb-2`}>Unable to Load Matches</h3>
          <p className={`${themeClasses.secondaryText} mb-4 text-sm`}>{error}</p>
          <button
            onClick={fetchMatches}
            disabled={refreshing}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50"
          >
            {refreshing ? "Retrying..." : "Try Again"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${themeClasses.card} rounded-2xl border backdrop-blur-sm overflow-hidden`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${themeClasses.text}`}>Travelers Near You</h2>
              <p className={`text-sm ${themeClasses.secondaryText}`}>
                {matchedTravelers.length} potential travel matches found
              </p>
            </div>
          </div>

          <button
            onClick={fetchMatches}
            disabled={refreshing}
            className={`p-2 ${themeClasses.card} border border-slate-700/50 rounded-lg hover:border-cyan-500/50 transition-colors ${refreshing ? "animate-spin" : ""}`}
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Matches */}
      <div className="p-6">
        {matchedTravelers.length === 0 ? (
          <div className="text-center py-8">
            <Globe className={`h-16 w-16 ${themeClasses.secondaryText} mx-auto mb-4`} />
            <h3 className={`text-lg font-semibold ${themeClasses.text} mb-2`}>No Matches Found</h3>
            <p className={`${themeClasses.secondaryText} mb-4`}>
              Make your trips public to discover fellow travelers with similar plans!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {matchedTravelers.map((match) => {
              const safeMatch = {
                id: match.id || `match-${Date.now()}-${Math.random()}`,
                destination: match.destination || "Unknown Destination",
                userTripDestination: match.userTripDestination || "Unknown",
                matchScore: match.matchScore || 0,
                matchFactors: Array.isArray(match.matchFactors) ? match.matchFactors : [],
                days: match.days || 1,
                travelers: match.travelers || 1,
                rating: match.rating || 4.0,
                userTripId: match.userTripId || match.id,
              }

              return (
                <div
                  key={`${safeMatch.id}-${safeMatch.userTripId}`}
                  className="flex items-center space-x-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/30 hover:border-cyan-500/30 transition-colors group"
                >
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 flex-shrink-0">
                    <div className="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center">
                      <span className="text-lg font-bold text-white">
                        {safeMatch.destination.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className={`font-semibold ${themeClasses.text} truncate`}>{safeMatch.destination}</h4>
                        <p className={`text-sm ${themeClasses.secondaryText}`}>
                          Matches your trip to {safeMatch.userTripDestination}
                        </p>
                      </div>

                      {/* Match Score */}
                      <div className="text-right flex-shrink-0 ml-4">
                        <div
                          className={`text-lg font-bold bg-gradient-to-r ${getMatchColor(safeMatch.matchScore)} bg-clip-text text-transparent`}
                        >
                          {safeMatch.matchScore}%
                        </div>
                        <div className="text-xs text-slate-400">match</div>
                      </div>
                    </div>

                    {/* Match Factors */}
                    {safeMatch.matchFactors.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {safeMatch.matchFactors.slice(0, 2).map((factor, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center space-x-1 px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-full border border-cyan-500/30"
                          >
                            <Zap className="h-3 w-3" />
                            <span>{factor}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Trip Details */}
                    <div className="flex items-center space-x-4 text-xs text-slate-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{safeMatch.days} days</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{safeMatch.travelers} travelers</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3" />
                        <span>{Number(safeMatch.rating).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 flex-shrink-0">
                    <button
                      onClick={() => handleViewLocation(safeMatch)}
                      className="p-2 bg-slate-800/50 hover:bg-cyan-500/20 border border-slate-700/50 hover:border-cyan-500/30 rounded-lg transition-colors group"
                      title="View Location"
                    >
                      <Eye className="h-4 w-4 text-slate-400 group-hover:text-cyan-400" />
                    </button>
                    <button
                      onClick={() => handleChatClick(safeMatch)}
                      className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg transition-colors"
                      title="Start Chat"
                    >
                      <MessageCircle className="h-4 w-4 text-white" />
                    </button>
                    <button
                      onClick={() => handleConnectClick(safeMatch)}
                      className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg transition-colors"
                      title="Connect"
                    >
                      <Users className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default MatchEngine
