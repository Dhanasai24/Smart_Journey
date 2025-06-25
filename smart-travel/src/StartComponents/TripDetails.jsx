"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../assets/Context/AuthContext"
import { useTheme } from "../assets/Context/ThemeContext"
import { API_BASE_URL } from "../assets/Utils/Constants"
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  ArrowLeft,
  Heart,
  Share2,
  Download,
  Printer,
  Coffee,
  Utensils,
  Sunrise,
  Sunset,
  CheckCircle,
  Circle,
  Navigation,
  Camera,
  Building,
  Plane,
  Train,
  Bus,
  Car,
  Moon,
  Sun,
  Sparkles,
  Zap,
  Star,
  Globe,
  Route,
  Target,
} from "lucide-react"

const TripDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const { theme, toggleTheme, getThemeClasses } = useTheme()
  const themeClasses = getThemeClasses()

  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeDay, setActiveDay] = useState(1)
  const [completedActivities, setCompletedActivities] = useState({})

  useEffect(() => {
    fetchTripDetails()
  }, [id])

  const fetchTripDetails = async () => {
    try {
      setLoading(true)
      console.log(`Fetching trip details for ID: ${id}`)

      const response = await fetch(`${API_BASE_URL}/trips/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error response:", errorData)
        setError(errorData.message || "Failed to fetch trip details")
        return
      }

      const data = await response.json()
      console.log("Fetched trip details:", data.trip)
      setTrip(data.trip)

      // Parse trip_plan if it's a string
      let tripPlan = data.trip.trip_plan
      if (typeof tripPlan === "string") {
        try {
          tripPlan = JSON.parse(tripPlan)
        } catch (e) {
          console.error("Error parsing trip_plan:", e)
        }
      }

      // Load saved activity completions
      if (data.trip.activity_completions) {
        setCompletedActivities(data.trip.activity_completions)
      } else {
        // Initialize completed activities if trip plan exists
        if (tripPlan?.days || tripPlan?.dailyItinerary) {
          const initialCompletedState = {}
          const itinerary = tripPlan.days || tripPlan.dailyItinerary || []

          itinerary.forEach((day, dayIndex) => {
            if (day.activities) {
              day.activities.forEach((activity, activityIndex) => {
                initialCompletedState[`${dayIndex + 1}-${activityIndex}`] = false
              })
            }
          })
          setCompletedActivities(initialCompletedState)
        }
      }
    } catch (err) {
      console.error("Error loading trip details:", err)
      setError("Error loading trip details. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Not set"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const toggleActivityCompletion = async (dayIndex, activityIndex) => {
    const key = `${dayIndex}-${activityIndex}`
    const newCheckedState = !completedActivities[key]

    // Update local state immediately for responsive UI
    setCompletedActivities((prev) => ({
      ...prev,
      [key]: newCheckedState,
    }))

    // Update the database
    try {
      console.log(`🎯 Updating activity completion: ${key} = ${newCheckedState}`)

      const response = await fetch(`${API_BASE_URL}/trips/${id}/activity-completion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dayIndex: dayIndex,
          activityIndex: activityIndex,
          completed: newCheckedState,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Activity completion updated:`, result.progressStats)
      } else {
        console.error("❌ Failed to update activity completion")
        // Revert local state if API call failed
        setCompletedActivities((prev) => ({
          ...prev,
          [key]: !newCheckedState,
        }))
      }
    } catch (error) {
      console.error("❌ Error updating activity completion:", error)
      // Revert local state if API call failed
      setCompletedActivities((prev) => ({
        ...prev,
        [key]: !newCheckedState,
      }))
    }
  }

  const getActivityIcon = (activity) => {
    const activityName = (activity.activity || activity.name || "").toLowerCase()
    const activityType = (activity.type || "").toLowerCase()

    if (activityName.includes("breakfast") || activityName.includes("coffee")) {
      return <Coffee className={`w-5 h-5 ${theme === "dark" ? "text-amber-400" : "text-amber-600"}`} />
    } else if (activityName.includes("lunch") || activityName.includes("dinner") || activityName.includes("food")) {
      return <Utensils className={`w-5 h-5 ${theme === "dark" ? "text-emerald-400" : "text-green-600"}`} />
    } else if (
      activityName.includes("hotel") ||
      activityName.includes("accommodation") ||
      activityName.includes("stay")
    ) {
      return <Building className={`w-5 h-5 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`} />
    } else if (activityName.includes("morning") || activityName.includes("sunrise")) {
      return <Sunrise className={`w-5 h-5 ${theme === "dark" ? "text-orange-400" : "text-orange-500"}`} />
    } else if (activityName.includes("evening") || activityName.includes("sunset")) {
      return <Sunset className={`w-5 h-5 ${theme === "dark" ? "text-purple-400" : "text-purple-600"}`} />
    } else if (activityType.includes("sightseeing") || activityName.includes("visit") || activityName.includes("see")) {
      return <Camera className={`w-5 h-5 ${theme === "dark" ? "text-pink-400" : "text-red-500"}`} />
    } else if (activityType.includes("transport") || activityName.includes("travel")) {
      return <Navigation className={`w-5 h-5 ${theme === "dark" ? "text-cyan-400" : "text-indigo-500"}`} />
    } else {
      return <MapPin className={`w-5 h-5 ${themeClasses.secondaryText}`} />
    }
  }

  const getTransportIcon = (type) => {
    const iconClass = `w-5 h-5 ${themeClasses.accentText}`
    switch (type?.toLowerCase()) {
      case "flight":
        return <Plane className={iconClass} />
      case "train":
        return <Train className={iconClass} />
      case "bus":
        return <Bus className={iconClass} />
      case "car":
        return <Car className={iconClass} />
      default:
        return <Navigation className={iconClass} />
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    if (!trip) return

    // Parse trip_plan if it's a string
    let tripPlan = trip.trip_plan
    if (typeof tripPlan === "string") {
      try {
        tripPlan = JSON.parse(tripPlan)
      } catch (e) {
        console.error("Error parsing trip_plan for download:", e)
        tripPlan = {}
      }
    }

    // Create a formatted text version of the trip
    let tripText = `${trip.title || "My Trip"} to ${trip.destination}\n`
    tripText += `${formatDate(trip.start_date)} to ${formatDate(trip.end_date)}\n\n`

    if (tripPlan?.summary) {
      tripText += `Trip Summary: ${tripPlan.summary}\n\n`
    }

    const itinerary = tripPlan?.days || tripPlan?.dailyItinerary || []
    if (itinerary.length > 0) {
      tripText += "ITINERARY:\n\n"
      itinerary.forEach((day, index) => {
        tripText += `Day ${index + 1}: ${day.title || "Exploring"}\n`
        if (day.activities) {
          day.activities.forEach((activity) => {
            const time = activity.time || ""
            const name = activity.activity || activity.name || ""
            const description = activity.description || ""
            tripText += `- ${time} ${name}: ${description}\n`
          })
        }
        tripText += "\n"
      })
    }

    // Create a blob and download it
    const blob = new Blob([tripText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${trip.destination.replace(/\s+/g, "-")}-trip-plan.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `My ${trip.destination} Trip`,
        text: `Check out my trip plan to ${trip.destination}!`,
        url: window.location.href,
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert("Trip link copied to clipboard!")
    }
  }

  // Particle animation component
  const ParticleBackground = () => null

  if (loading) {
    return (
      <div className={`min-h-screen ${themeClasses.background} flex items-center justify-center relative`}>
        <ParticleBackground />
        <div className="text-center relative z-10">
          <div
            className={`w-20 h-20 border-4 ${theme === "dark" ? "border-cyan-500" : "border-blue-500"} border-t-transparent rounded-full animate-spin mx-auto mb-6`}
          >
            <div
              className={`w-12 h-12 border-2 ${theme === "dark" ? "border-blue-400" : "border-purple-400"} border-t-transparent rounded-full animate-spin absolute top-2 left-2`}
            ></div>
          </div>
          <div className="space-y-2">
            <h2 className={`text-2xl font-bold ${themeClasses.primaryText}`}>Loading Trip Details</h2>
            <p className={`${themeClasses.secondaryText} text-lg`}>Preparing your adventure...</p>
            <div className="flex justify-center space-x-1 mt-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 ${theme === "dark" ? "bg-cyan-400" : "bg-blue-500"} rounded-full animate-bounce`}
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen ${themeClasses.background} p-8 relative`}>
        <ParticleBackground />
        <div
          className={`max-w-4xl mx-auto ${themeClasses.card} rounded-3xl border ${themeClasses.border} p-8 text-center relative z-10`}
        >
          <div
            className={`w-16 h-16 ${theme === "dark" ? "bg-red-500/20" : "bg-red-100"} rounded-full flex items-center justify-center mx-auto mb-6`}
          >
            <Zap className={`w-8 h-8 ${theme === "dark" ? "text-red-400" : "text-red-600"}`} />
          </div>
          <h2 className={`text-3xl font-bold ${theme === "dark" ? "text-red-400" : "text-red-600"} mb-4`}>
            Error Loading Trip
          </h2>
          <p className={`${themeClasses.secondaryText} mb-8 text-lg`}>{error}</p>
          <button
            onClick={() => navigate("/my-trips")}
            className={`${themeClasses.primaryButton} text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg`}
          >
            Back to My Trips
          </button>
        </div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className={`min-h-screen ${themeClasses.background} p-8 relative`}>
        <ParticleBackground />
        <div
          className={`max-w-4xl mx-auto ${themeClasses.card} rounded-3xl border ${themeClasses.border} p-8 text-center relative z-10`}
        >
          <div
            className={`w-16 h-16 ${themeClasses.cardContent} rounded-full flex items-center justify-center mx-auto mb-6`}
          >
            <Globe className={`w-8 h-8 ${themeClasses.secondaryText}`} />
          </div>
          <h2 className={`text-3xl font-bold ${themeClasses.primaryText} mb-4`}>Trip Not Found</h2>
          <p className={`${themeClasses.secondaryText} mb-8 text-lg`}>
            The trip you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <button
            onClick={() => navigate("/my-trips")}
            className={`${themeClasses.primaryButton} text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg`}
          >
            Back to My Trips
          </button>
        </div>
      </div>
    )
  }

  // Parse trip_plan if it's a string
  let tripPlan = trip.trip_plan
  if (typeof tripPlan === "string") {
    try {
      tripPlan = JSON.parse(tripPlan)
    } catch (e) {
      console.error("Error parsing trip_plan:", e)
      tripPlan = {}
    }
  }

  // Parse transport_plan if it's a string
  let transportPlan = trip.transport_plan
  if (typeof transportPlan === "string") {
    try {
      transportPlan = JSON.parse(transportPlan)
    } catch (e) {
      console.error("Error parsing transport_plan:", e)
      transportPlan = {}
    }
  }

  const itinerary = tripPlan?.days || tripPlan?.dailyItinerary || []
  const hasItinerary = itinerary.length > 0

  return (
    <div className={`min-h-screen ${themeClasses.background} py-8 px-4 relative`}>
      <ParticleBackground />

      {/* Theme Toggle Button - Fixed Position */}
      <button
        onClick={toggleTheme}
        className={`fixed top-6 right-6 z-50 ${themeClasses.card} border ${themeClasses.border} p-3 rounded-full transition-all duration-300 hover:scale-110 hover:shadow-lg backdrop-blur-sm`}
      >
        {theme === "dark" ? <Sun className="w-6 h-6 text-yellow-400" /> : <Moon className="w-6 h-6 text-slate-600" />}
      </button>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Back button */}
        <button
          onClick={() => navigate("/my-trips")}
          className={`flex items-center ${themeClasses.accentText} hover:scale-105 transition-all duration-300 mb-8 group`}
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold">Back to My Trips</span>
        </button>

        {/* Trip Header */}
        <div className="relative rounded-3xl overflow-hidden mb-8 group">
          <img
            src={
              trip.thumbnail_url ||
              `https://source.unsplash.com/1600x400/?${encodeURIComponent(trip.destination) || "/placeholder.svg"},travel,landmark`
            }
            alt={trip.destination}
            className="w-full h-80 object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
              e.target.src = `https://source.unsplash.com/1600x400/?${encodeURIComponent(trip.destination)},landmark`
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>

          {/* Floating particles on header - DISABLED */}

          <div className="absolute bottom-0 left-0 w-full p-8">
            <div className="flex justify-between items-end">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="w-6 h-6 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold">Premium Adventure</span>
                </div>
                <h1 className="text-5xl font-bold text-white mb-3 leading-tight">
                  {trip.title || `Trip to ${trip.destination}`}
                </h1>
                <div className="flex items-center text-white/90 mb-2">
                  <MapPin className="w-6 h-6 mr-3" />
                  <span className="text-xl font-semibold">{trip.destination}</span>
                </div>
                <div className="flex items-center text-white/80">
                  <Calendar className="w-5 h-5 mr-3" />
                  <span className="text-lg">
                    {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                  </span>
                </div>
              </div>

              <div className="flex space-x-3">
                {[
                  { icon: Heart, action: () => {}, color: "text-red-400" },
                  { icon: Share2, action: handleShare, color: "text-blue-400" },
                  { icon: Download, action: handleDownload, color: "text-green-400" },
                  { icon: Printer, action: handlePrint, color: "text-purple-400" },
                ].map(({ icon: Icon, action, color }, index) => (
                  <button
                    key={index}
                    onClick={action}
                    className={`bg-white/10 backdrop-blur-md p-4 rounded-full hover:bg-white/20 transition-all duration-300 hover:scale-110 border border-white/20 group`}
                  >
                    <Icon className={`w-6 h-6 text-white group-hover:${color} transition-colors`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Trip Details Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* Basic Trip Info */}
            <div
              className={`${themeClasses.card} rounded-3xl border ${themeClasses.border} p-8 backdrop-blur-sm relative overflow-hidden group hover:shadow-2xl transition-all duration-300`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full -translate-y-16 translate-x-16"></div>

              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${themeClasses.primaryText}`}>Trip Details</h2>
                <Target className={`w-6 h-6 ${themeClasses.accentText}`} />
              </div>

              <div className="space-y-6">
                {[
                  {
                    icon: MapPin,
                    label: "From",
                    value: trip.start_location || "Not specified",
                    color: "text-blue-500",
                  },
                  { icon: Calendar, label: "Duration", value: `${trip.days} days`, color: "text-purple-500" },
                  {
                    icon: Users,
                    label: "Travelers",
                    value: `${trip.travelers} ${trip.travelers === 1 ? "person" : "people"}`,
                    color: "text-green-500",
                  },
                  {
                    icon: DollarSign,
                    label: "Budget",
                    value: `₹${Number(trip.budget).toLocaleString()}`,
                    color: "text-yellow-500",
                  },
                  { icon: Clock, label: "Created", value: formatDate(trip.created_at), color: "text-cyan-500" },
                ].map(({ icon: Icon, label, value, color }, index) => (
                  <div key={index} className="flex items-start group/item">
                    <div
                      className={`${themeClasses.cardContent} p-3 rounded-xl mr-4 group-hover/item:scale-110 transition-transform`}
                    >
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div>
                      <p className={`text-sm ${themeClasses.secondaryText} mb-1`}>{label}</p>
                      <p className={`font-semibold ${themeClasses.primaryText}`}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {tripPlan?.totalEstimatedCost && (
                <div className={`mt-8 pt-6 border-t ${themeClasses.border}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-lg font-semibold ${themeClasses.primaryText} mb-1`}>Estimated Cost</h3>
                      <p className={`text-3xl font-bold ${theme === "dark" ? "text-emerald-400" : "text-green-600"}`}>
                        ₹{Number(tripPlan.totalEstimatedCost).toLocaleString()}
                      </p>
                    </div>
                    <Sparkles className={`w-8 h-8 ${theme === "dark" ? "text-emerald-400" : "text-green-600"}`} />
                  </div>
                </div>
              )}
            </div>

            {/* Transport Plan */}
            {transportPlan && Object.keys(transportPlan).length > 0 && (
              <div
                className={`${themeClasses.card} rounded-3xl border ${themeClasses.border} p-8 backdrop-blur-sm relative overflow-hidden hover:shadow-2xl transition-all duration-300`}
              >
                <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full -translate-y-12 -translate-x-12"></div>

                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl font-bold ${themeClasses.primaryText}`}>Transport</h2>
                  <Route className={`w-6 h-6 ${themeClasses.accentText}`} />
                </div>

                <div className="flex items-center mb-4">
                  <div className={`${themeClasses.cardContent} p-3 rounded-xl mr-4`}>
                    {getTransportIcon(transportPlan.type)}
                  </div>
                  <span className={`font-semibold text-lg ${themeClasses.primaryText}`}>
                    {transportPlan.name || "Transport Plan"}
                  </span>
                </div>

                {transportPlan.description && (
                  <p className={`${themeClasses.secondaryText} mb-4 leading-relaxed`}>{transportPlan.description}</p>
                )}

                {transportPlan.estimatedCost && (
                  <div className={`${themeClasses.cardContent} rounded-xl p-4`}>
                    <p className={`${theme === "dark" ? "text-emerald-400" : "text-green-600"} font-semibold text-lg`}>
                      Estimated Cost: ₹{Number(transportPlan.estimatedCost).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Trip Summary */}
            {tripPlan?.summary && (
              <div
                className={`${themeClasses.card} rounded-3xl border ${themeClasses.border} p-8 backdrop-blur-sm hover:shadow-2xl transition-all duration-300`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl font-bold ${themeClasses.primaryText}`}>Trip Summary</h2>
                  <Globe className={`w-6 h-6 ${themeClasses.accentText}`} />
                </div>
                <p className={`${themeClasses.secondaryText} leading-relaxed text-lg`}>{tripPlan.summary}</p>
              </div>
            )}

            {/* Interests & Preferences */}
            <div
              className={`${themeClasses.card} rounded-3xl border ${themeClasses.border} p-8 backdrop-blur-sm hover:shadow-2xl transition-all duration-300`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${themeClasses.primaryText}`}>Preferences</h2>
                <Star className={`w-6 h-6 ${themeClasses.accentText}`} />
              </div>

              {trip.interests && trip.interests.length > 0 && (
                <div className="mb-6">
                  <h3 className={`text-lg font-semibold ${themeClasses.primaryText} mb-3`}>Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {trip.interests.map((interest, index) => (
                      <span
                        key={index}
                        className={`${theme === "dark" ? "bg-blue-500/20 text-blue-300 border-blue-500/50" : "bg-blue-100 text-blue-800 border-blue-300"} px-4 py-2 rounded-full text-sm font-medium border backdrop-blur-sm`}
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {trip.food_preferences && trip.food_preferences.length > 0 && (
                <div className="mb-6">
                  <h3 className={`text-lg font-semibold ${themeClasses.primaryText} mb-3`}>Food Preferences</h3>
                  <div className="flex flex-wrap gap-2">
                    {trip.food_preferences.map((pref, index) => (
                      <span
                        key={index}
                        className={`${theme === "dark" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50" : "bg-green-100 text-green-800 border-green-300"} px-4 py-2 rounded-full text-sm font-medium border backdrop-blur-sm`}
                      >
                        {pref}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {trip.special_interest && (
                <div>
                  <h3 className={`text-lg font-semibold ${themeClasses.primaryText} mb-3`}>Special Interest</h3>
                  <div className={`${themeClasses.cardContent} rounded-xl p-4`}>
                    <p className={`${themeClasses.secondaryText} leading-relaxed`}>{trip.special_interest}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Itinerary */}
          <div className="xl:col-span-2">
            <div
              className={`${themeClasses.card} rounded-3xl border ${themeClasses.border} p-8 backdrop-blur-sm relative overflow-hidden hover:shadow-2xl transition-all duration-300`}
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-full -translate-y-20 translate-x-20"></div>

              <div className="flex items-center justify-between mb-8">
                <h2 className={`text-3xl font-bold ${themeClasses.primaryText}`}>Adventure Itinerary</h2>
                <Calendar className={`w-8 h-8 ${themeClasses.accentText}`} />
              </div>

              {hasItinerary ? (
                <div>
                  {/* Day selector */}
                  <div className="flex overflow-x-auto pb-6 mb-8 gap-3 scrollbar-hide">
                    {itinerary.map((day, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveDay(index + 1)}
                        className={`px-6 py-3 rounded-xl whitespace-nowrap transition-all duration-300 font-semibold border backdrop-blur-sm ${
                          activeDay === index + 1
                            ? `${themeClasses.primaryButton} text-white shadow-lg scale-105`
                            : `${themeClasses.cardContent} ${themeClasses.primaryText} ${themeClasses.border} hover:scale-105`
                        }`}
                      >
                        Day {index + 1}
                      </button>
                    ))}
                  </div>

                  {/* Day content */}
                  {itinerary.map((day, dayIndex) => (
                    <div key={dayIndex} className={activeDay === dayIndex + 1 ? "block" : "hidden"}>
                      <div className="flex items-center justify-between mb-8">
                        <h3 className={`text-2xl font-bold ${themeClasses.primaryText}`}>
                          Day {dayIndex + 1}: {day.title || "Exploring"}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Sparkles className={`w-5 h-5 ${themeClasses.accentText}`} />
                          <span className={`text-sm ${themeClasses.secondaryText}`}>
                            {day.activities?.length || 0} activities
                          </span>
                        </div>
                      </div>

                      {day.activities && day.activities.length > 0 ? (
                        <div className="space-y-6">
                          {day.activities.map((activity, activityIndex) => (
                            <div
                              key={activityIndex}
                              className={`relative pl-12 border-l-2 transition-all duration-300 ${
                                completedActivities[`${dayIndex + 1}-${activityIndex}`]
                                  ? `${theme === "dark" ? "border-emerald-400" : "border-green-500"} opacity-75`
                                  : `${theme === "dark" ? "border-cyan-400" : "border-blue-400"}`
                              }`}
                            >
                              {/* Activity marker */}
                              <div className="absolute -left-4 top-0">
                                <button
                                  onClick={() => toggleActivityCompletion(dayIndex + 1, activityIndex)}
                                  className={`${themeClasses.card} rounded-full border-2 p-2 hover:shadow-lg transition-all duration-300 hover:scale-110 ${
                                    completedActivities[`${dayIndex + 1}-${activityIndex}`]
                                      ? `${theme === "dark" ? "border-emerald-400" : "border-green-500"}`
                                      : `${theme === "dark" ? "border-cyan-400" : "border-blue-400"}`
                                  }`}
                                >
                                  {completedActivities[`${dayIndex + 1}-${activityIndex}`] ? (
                                    <CheckCircle
                                      className={`w-5 h-5 ${theme === "dark" ? "text-emerald-400" : "text-green-500"}`}
                                    />
                                  ) : (
                                    <Circle
                                      className={`w-5 h-5 ${theme === "dark" ? "text-cyan-400" : "text-blue-400"}`}
                                    />
                                  )}
                                </button>
                              </div>

                              <div
                                className={`${themeClasses.cardContent} rounded-2xl p-6 border ${themeClasses.border} backdrop-blur-sm hover:shadow-lg transition-all duration-300 group`}
                              >
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center space-x-4">
                                    <div
                                      className={`${themeClasses.card} p-3 rounded-xl border ${themeClasses.border}`}
                                    >
                                      {getActivityIcon(activity)}
                                    </div>
                                    <div>
                                      <h4
                                        className={`font-bold text-lg transition-all duration-300 ${
                                          completedActivities[`${dayIndex + 1}-${activityIndex}`]
                                            ? `line-through ${themeClasses.secondaryText}`
                                            : themeClasses.primaryText
                                        }`}
                                      >
                                        {activity.time && (
                                          <span className={`${themeClasses.accentText} mr-2`}>{activity.time} -</span>
                                        )}
                                        {activity.activity || activity.name}
                                      </h4>
                                    </div>
                                  </div>

                                  {activity.cost && (
                                    <div
                                      className={`${theme === "dark" ? "bg-emerald-500/20 text-emerald-400" : "bg-green-100 text-green-700"} px-3 py-1 rounded-full text-sm font-semibold`}
                                    >
                                      ₹{Number(activity.cost).toLocaleString()}
                                    </div>
                                  )}
                                </div>

                                {activity.description && (
                                  <p className={`${themeClasses.secondaryText} mb-4 leading-relaxed`}>
                                    {activity.description}
                                  </p>
                                )}

                                {activity.location && (
                                  <div className="flex items-center space-x-2">
                                    <MapPin className={`w-4 h-4 ${themeClasses.accentText}`} />
                                    <span className={`text-sm ${themeClasses.secondaryText}`}>{activity.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div
                            className={`w-20 h-20 ${themeClasses.cardContent} rounded-full flex items-center justify-center mx-auto mb-6`}
                          >
                            <Calendar className={`w-10 h-10 ${themeClasses.secondaryText}`} />
                          </div>
                          <h3 className={`text-xl font-semibold ${themeClasses.primaryText} mb-2`}>
                            No Activities Planned
                          </h3>
                          <p className={`${themeClasses.secondaryText} mb-6`}>
                            This day is free for spontaneous adventures!
                          </p>
                        </div>
                      )}

                      {/* Day summary */}
                      {day.totalCost && (
                        <div
                          className={`mt-8 ${theme === "dark" ? "bg-emerald-500/10 border-emerald-500/30" : "bg-green-50 border-green-200"} rounded-2xl p-6 border backdrop-blur-sm`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                              <DollarSign
                                className={`w-6 h-6 ${theme === "dark" ? "text-emerald-400" : "text-green-600"}`}
                              />
                              <span className={`font-bold text-lg ${themeClasses.primaryText}`}>
                                Day {dayIndex + 1} Total:
                              </span>
                            </div>
                            <span
                              className={`${theme === "dark" ? "text-emerald-400" : "text-green-600"} font-bold text-2xl`}
                            >
                              ₹{Number(day.totalCost).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div
                    className={`w-24 h-24 ${themeClasses.cardContent} rounded-full flex items-center justify-center mx-auto mb-8`}
                  >
                    <Calendar className={`w-12 h-12 ${themeClasses.secondaryText}`} />
                  </div>
                  <h3 className={`text-2xl font-bold ${themeClasses.primaryText} mb-4`}>No Itinerary Available</h3>
                  <p className={`${themeClasses.secondaryText} mb-8 text-lg`}>
                    This trip doesn't have a detailed itinerary yet.
                  </p>
                  <button
                    onClick={() => navigate("/trip-planner")}
                    className={`${themeClasses.primaryButton} text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg`}
                  >
                    Create Itinerary
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TripDetails
