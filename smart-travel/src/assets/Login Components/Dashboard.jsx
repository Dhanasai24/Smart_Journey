"use client"

import { useState, useEffect, useRef } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bell,
  Calendar,
  CheckCircle,
  DollarSign,
  Globe,
  Heart,
  MapPin,
  Moon,
  Navigation,
  Plane,
  Search,
  Settings,
  Sun,
  Target,
  TrendingUp,
} from "lucide-react"
import { useAuth } from "../Context/AuthContext"
import { API_BASE_URL } from "../Utils/Constants"

const Dashboard = () => {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(location.state?.message || null)
  const [theme, setTheme] = useState("light")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const canvasRef = useRef(null)

  // Real calculated stats from actual trip data
  const [realStats, setRealStats] = useState({
    totalTrips: 0,
    upcomingTrips: 0,
    completedTrips: 0,
    activeTrips: 0,
    totalBudget: 0,
    averageBudget: 0,
    totalDays: 0,
    averageDuration: 0,
    destinationsVisited: 0,
    favoriteTrips: 0,
    completionRate: 0,
    totalProgress: 0,
    budgetUtilization: 0,
    planningEfficiency: 0,
    tripsWithPlans: 0,
    budgetSpent: 0,
    budgetRemaining: 0,
    avgBudgetPerDay: 0,
  })

  // Update time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Enhanced search functionality
  const handleSearch = (query) => {
    setSearchQuery(query)
    if (query.length > 1) {
      const destinations = [
        "Paris, France",
        "Tokyo, Japan",
        "Bali, Indonesia",
        "New York, USA",
        "London, UK",
        "Dubai, UAE",
        "Singapore",
        "Thailand",
        "Italy",
        "Spain",
        "Greece",
        "Turkey",
        "Egypt",
        "Morocco",
        "India",
        "Nepal",
        "Bhutan",
      ]

      const tripTypes = [
        "European Tour",
        "Asian Adventure",
        "Beach Paradise",
        "Mountain Trek",
        "City Break",
        "Cultural Journey",
        "Wildlife Safari",
        "Romantic Getaway",
      ]

      const mockResults = [
        ...destinations
          .filter((dest) => dest.toLowerCase().includes(query.toLowerCase()))
          .map((dest) => ({ type: "destination", name: dest, icon: MapPin })),
        ...tripTypes
          .filter((trip) => trip.toLowerCase().includes(query.toLowerCase()))
          .map((trip) => ({ type: "trip", name: trip, icon: Plane })),
      ].slice(0, 6)

      setSearchResults(mockResults)
      setShowSearchResults(true)
    } else {
      setShowSearchResults(false)
    }
  }

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      if (searchQuery.toLowerCase().includes("trip") || searchQuery.toLowerCase().includes("plan")) {
        navigate("/trip-planner")
      } else {
        navigate("/my-trips")
      }
      setShowSearchResults(false)
      setSearchQuery("")
    }
  }

  const handleNavigation = (path) => {
    switch (path) {
      case "dashboard":
        break
      case "analytics":
        navigate("/my-trips")
        break
      case "route":
        navigate("/trip-planner")
        break
      case "weather":
        console.log("Weather page not implemented yet")
        break
      case "security":
        console.log("Security page not implemented yet")
        break
      case "data":
        navigate("/my-trips")
        break
      case "ai":
        navigate("/trip-planner")
        break
      case "settings":
        console.log("Settings page not implemented yet")
        break
      default:
        break
    }
  }

  // Particle effect adapted for both themes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const particles = []
    const particleCount = theme === "light" ? 60 : 80

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * (theme === "light" ? 1.5 : 2) + 1
        this.speedX = (Math.random() - 0.5) * (theme === "light" ? 0.2 : 0.3)
        this.speedY = (Math.random() - 0.5) * (theme === "light" ? 0.2 : 0.3)

        if (theme === "light") {
          this.color = `rgba(${Math.floor(Math.random() * 80) + 60}, ${Math.floor(Math.random() * 120) + 140}, ${Math.floor(Math.random() * 100) + 200}, ${Math.random() * 0.4 + 0.2})`
        } else {
          this.color = `rgba(${Math.floor(Math.random() * 100) + 100}, ${Math.floor(Math.random() * 100) + 150}, ${Math.floor(Math.random() * 55) + 200}, ${Math.random() * 0.4 + 0.1})`
        }
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        if (this.x > canvas.width) this.x = 0
        if (this.x < 0) this.x = canvas.width
        if (this.y > canvas.height) this.y = 0
        if (this.y < 0) this.y = canvas.height
      }

      draw() {
        if (!ctx) return
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const particle of particles) {
        particle.update()
        particle.draw()
      }

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      if (!canvas) return
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [theme])

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        console.log("Fetching trips for dashboard...")
        const response = await fetch(`${API_BASE_URL}/trips`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch trips: ${response.status}`)
        }

        const data = await response.json()
        const userTrips = data.trips || []
        setTrips(userTrips)

        // Calculate REAL stats from actual trip data
        const now = new Date()
        const totalTrips = userTrips.length
        const upcomingTrips = userTrips.filter((trip) => trip.start_date && new Date(trip.start_date) > now).length
        const completedTrips = userTrips.filter(
          (trip) => trip.status === "completed" || (trip.progress_stats && trip.progress_stats.percentage === 100),
        ).length
        const activeTrips = userTrips.filter(
          (trip) =>
            trip.status === "active" ||
            (trip.progress_stats && trip.progress_stats.percentage > 0 && trip.progress_stats.percentage < 100),
        ).length
        const favoriteTrips = userTrips.filter((trip) => trip.is_favorite).length
        const totalBudget = userTrips.reduce((sum, trip) => sum + (Number(trip.budget) || 0), 0)
        const averageBudget = totalTrips > 0 ? Math.round(totalBudget / totalTrips) : 0
        const totalDays = userTrips.reduce((sum, trip) => sum + (trip.days || 0), 0)
        const averageDuration = totalTrips > 0 ? Math.round(totalDays / totalTrips) : 0
        const destinationsVisited = new Set(userTrips.map((trip) => trip.destination)).size

        // Calculate real completion rate
        const completionRate = totalTrips > 0 ? Math.round((completedTrips / totalTrips) * 100) : 0

        // Calculate average progress across all trips
        const totalProgress =
          totalTrips > 0
            ? Math.round(userTrips.reduce((sum, trip) => sum + (trip.progress_stats?.percentage || 0), 0) / totalTrips)
            : 0

        // FIXED: Calculate planning efficiency properly
        let tripsWithPlans = 0
        userTrips.forEach((trip) => {
          // Check if trip has a detailed plan
          let hasDetailedPlan = false

          // Check trip_plan field
          if (trip.trip_plan) {
            try {
              const tripPlan = typeof trip.trip_plan === "string" ? JSON.parse(trip.trip_plan) : trip.trip_plan
              if (tripPlan) {
                // Check for various plan structures
                if (tripPlan.days && Array.isArray(tripPlan.days) && tripPlan.days.length > 0) {
                  hasDetailedPlan = true
                } else if (
                  tripPlan.dailyItinerary &&
                  Array.isArray(tripPlan.dailyItinerary) &&
                  tripPlan.dailyItinerary.length > 0
                ) {
                  hasDetailedPlan = true
                } else if (tripPlan.itinerary && Array.isArray(tripPlan.itinerary) && tripPlan.itinerary.length > 0) {
                  hasDetailedPlan = true
                } else if (tripPlan.schedule && Array.isArray(tripPlan.schedule) && tripPlan.schedule.length > 0) {
                  hasDetailedPlan = true
                }
              }
            } catch (e) {
              console.log("Error parsing trip plan:", e)
            }
          }

          // Also check if trip has hotels, flights, or other detailed info
          if (!hasDetailedPlan) {
            if (
              (trip.hotels && trip.hotels.length > 0) ||
              (trip.flights && trip.flights.length > 0) ||
              (trip.activities && trip.activities.length > 0)
            ) {
              hasDetailedPlan = true
            }
          }

          if (hasDetailedPlan) {
            tripsWithPlans++
          }
        })

        const planningEfficiency = totalTrips > 0 ? Math.round((tripsWithPlans / totalTrips) * 100) : 0

        // ENHANCED: Better budget calculations
        const completedTripsBudget = userTrips
          .filter(
            (trip) => trip.status === "completed" || (trip.progress_stats && trip.progress_stats.percentage === 100),
          )
          .reduce((sum, trip) => sum + (Number(trip.budget) || 0), 0)

        const activeTripsBudget = userTrips
          .filter(
            (trip) =>
              trip.status === "active" ||
              (trip.progress_stats && trip.progress_stats.percentage > 0 && trip.progress_stats.percentage < 100),
          )
          .reduce((sum, trip) => sum + (Number(trip.budget) || 0), 0)

        // Calculate budget spent (completed trips) vs remaining (upcoming/active)
        const budgetSpent = completedTripsBudget
        const budgetRemaining = totalBudget - budgetSpent

        // Calculate budget utilization as percentage of total budget that's been spent
        const budgetUtilization = totalBudget > 0 ? Math.round((budgetSpent / totalBudget) * 100) : 0

        // Calculate average budget per day
        const avgBudgetPerDay = totalDays > 0 ? Math.round(totalBudget / totalDays) : 0

        setRealStats({
          totalTrips,
          upcomingTrips,
          completedTrips,
          activeTrips,
          totalBudget,
          averageBudget,
          totalDays,
          averageDuration,
          destinationsVisited,
          favoriteTrips,
          completionRate,
          totalProgress,
          budgetUtilization,
          planningEfficiency,
          tripsWithPlans,
          budgetSpent,
          budgetRemaining,
          avgBudgetPerDay,
        })
      } catch (err) {
        console.error("Error fetching trips for dashboard:", err)
        setError("Failed to load travel data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchTrips()

    if (location.state?.message) {
      const timer = setTimeout(() => {
        setMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [location.state, token])

  const handlePlanTrip = () => {
    navigate("/trip-planner")
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusBadge = (trip) => {
    const progress = trip.progress_stats?.percentage || 0
    if (theme === "light") {
      if (progress === 100) return { text: "Completed", color: "bg-emerald-100 text-emerald-700 border-emerald-200" }
      if (progress > 0) return { text: "Active", color: "bg-blue-100 text-blue-700 border-blue-200" }
      if (trip.start_date && new Date(trip.start_date) > new Date())
        return { text: "Scheduled", color: "bg-purple-100 text-purple-700 border-purple-200" }
      return { text: "Planning", color: "bg-gray-100 text-gray-700 border-gray-200" }
    } else {
      if (progress === 100) return { text: "Completed", color: "bg-green-500/20 text-green-400 border-green-500/50" }
      if (progress > 0) return { text: "Active", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50" }
      if (trip.start_date && new Date(trip.start_date) > new Date())
        return { text: "Scheduled", color: "bg-purple-500/20 text-purple-400 border-purple-500/50" }
      return { text: "Planning", color: "bg-slate-500/20 text-slate-400 border-slate-500/50" }
    }
  }

  // Theme-based classes
  const themeClasses = {
    background:
      theme === "light"
        ? "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
        : "bg-gradient-to-br from-black via-slate-900 to-slate-800",
    text: theme === "light" ? "text-gray-900" : "text-slate-100",
    card:
      theme === "light"
        ? "bg-white/90 border-white/60 shadow-xl backdrop-blur-sm"
        : "bg-slate-900/50 border-slate-700/50 backdrop-blur-sm",
    cardContent: theme === "light" ? "bg-white/70 border-gray-200/50" : "bg-slate-800/50 border-slate-700/50",
    primaryText: theme === "light" ? "text-gray-800" : "text-slate-100",
    secondaryText: theme === "light" ? "text-gray-600" : "text-slate-400",
    accentText: theme === "light" ? "text-blue-600" : "text-cyan-400",
    border: theme === "light" ? "border-gray-200/50" : "border-slate-700/50",
  }

  return (
    <div className={`${theme} min-h-screen ${themeClasses.background} ${themeClasses.text} relative overflow-hidden`}>
      {/* Background particle effect */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full ${theme === "light" ? "opacity-40" : "opacity-20"}`}
      />

      <div className="container mx-auto p-4 sm:p-6 relative z-10">
        {/* Header - RESPONSIVE LAYOUT */}
        <header
          className={`flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 border-b ${themeClasses.border} mb-6 gap-4`}
        >
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Plane className="h-7 w-7 text-white" />
            </div>
            <div>
              <span
                className={`text-2xl sm:text-3xl font-bold ${
                  theme === "light"
                    ? "bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
                    : "bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent"
                }`}
              >
                SMART TRAVEL
              </span>
              <div className={`text-sm ${themeClasses.secondaryText} font-medium`}>
                Your Intelligent Travel Companion
              </div>
            </div>
          </div>

          {/* Controls Section - RESPONSIVE */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {/* Search Bar - RESPONSIVE */}
            <div className="relative order-2 sm:order-1">
              <div
                className={`flex items-center space-x-2 ${themeClasses.cardContent} rounded-full px-3 sm:px-4 py-2 sm:py-3 border ${themeClasses.border} backdrop-blur-sm w-full sm:min-w-[280px] lg:min-w-[300px]`}
              >
                <Search className={`h-4 w-4 sm:h-5 sm:w-5 ${themeClasses.secondaryText} flex-shrink-0`} />
                <input
                  type="text"
                  placeholder="Search destinations, trips..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className={`bg-transparent border-none focus:outline-none text-sm sm:text-base w-full placeholder:${themeClasses.secondaryText} ${themeClasses.primaryText}`}
                />
              </div>

              {/* Enhanced Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div
                  className={`absolute top-full left-0 right-0 mt-2 ${themeClasses.card} rounded-xl border ${themeClasses.border} shadow-xl z-50 max-h-80 overflow-y-auto`}
                >
                  <div className={`p-2 border-b ${themeClasses.border}`}>
                    <span className={`text-sm ${themeClasses.secondaryText} font-medium`}>
                      Search Results ({searchResults.length})
                    </span>
                  </div>
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      className={`flex items-center space-x-3 p-3 hover:${theme === "light" ? "bg-gray-50" : "bg-slate-800/50"} cursor-pointer transition-colors ${index === searchResults.length - 1 ? "rounded-b-xl" : ""}`}
                      onClick={() => {
                        if (result.type === "trip") {
                          navigate("/trip-planner")
                        } else {
                          navigate("/trip-planner")
                        }
                        setShowSearchResults(false)
                        setSearchQuery("")
                      }}
                    >
                      <result.icon className={`h-4 w-4 ${themeClasses.accentText}`} />
                      <div className="flex-1">
                        <span className={`${themeClasses.primaryText} text-base font-medium`}>{result.name}</span>
                        <div className={`text-sm ${themeClasses.secondaryText} capitalize`}>{result.type}</div>
                      </div>
                      <div
                        className={`text-xs ${themeClasses.secondaryText} bg-${theme === "light" ? "gray-100" : "slate-800"} px-2 py-1 rounded-full`}
                      >
                        {result.type}
                      </div>
                    </div>
                  ))}
                  <div className={`p-3 border-t ${themeClasses.border} text-center`}>
                    <span className={`text-sm ${themeClasses.secondaryText}`}>
                      Press Enter to search or click on a result
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons - RESPONSIVE */}
            <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4 order-1 sm:order-2">
              {/* Notification */}
              <button
                className={`relative p-2 sm:p-3 ${themeClasses.secondaryText} hover:${themeClasses.accentText} transition-colors`}
              >
                <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
                <span
                  className={`absolute -top-1 -right-1 h-2.5 w-2.5 sm:h-3 sm:w-3 ${theme === "light" ? "bg-blue-500" : "bg-cyan-500"} rounded-full animate-pulse`}
                ></span>
              </button>

              {/* Theme Toggle - ALWAYS VISIBLE */}
              <button
                onClick={toggleTheme}
                className={`p-2 sm:p-3 ${themeClasses.secondaryText} hover:${themeClasses.accentText} transition-colors flex-shrink-0`}
              >
                {theme === "dark" ? (
                  <Moon className="h-5 w-5 sm:h-6 sm:w-6" />
                ) : (
                  <Sun className="h-5 w-5 sm:h-6 sm:w-6" />
                )}
              </button>

              {/* User Profile */}
              <div
                className={`flex items-center space-x-2 sm:space-x-3 ${themeClasses.cardContent} rounded-full px-2 sm:px-4 py-1 sm:py-2 border ${themeClasses.border} flex-shrink-0`}
              >
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 ${theme === "light" ? "bg-gradient-to-br from-blue-500 to-purple-600" : "bg-gradient-to-br from-cyan-500 to-blue-600"} rounded-full flex items-center justify-center`}
                >
                  <span className="text-white text-sm sm:text-base font-bold">{user?.name?.charAt(0) || "T"}</span>
                </div>
                <span className={`text-sm sm:text-base font-medium ${themeClasses.primaryText} hidden sm:block`}>
                  {user?.name || "Traveler"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {message && (
          <div
            className={`${
              theme === "light"
                ? "bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-emerald-700"
                : "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 text-green-400"
            } px-6 py-4 rounded-xl mb-6 backdrop-blur-sm`}
            style={{
              animation: "fadeIn 0.5s ease-out",
            }}
          >
            <div className="flex items-center">
              <CheckCircle className="w-6 h-6 mr-3" />
              <span className="text-base font-medium">{message}</span>
            </div>
          </div>
        )}

        {error && (
          <div
            className={`${
              theme === "light"
                ? "bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700"
                : "bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/50 text-red-400"
            } px-6 py-4 rounded-xl mb-6 backdrop-blur-sm`}
          >
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 mr-3" />
              <span className="text-base font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - CLICKABLE NAVIGATION */}
          <div className="col-span-12 md:col-span-3 lg:col-span-2">
            <div className={`${themeClasses.card} rounded-2xl p-6 h-full`}>
              <nav className="space-y-3">
                <NavItem
                  icon={Target}
                  label="Dashboard"
                  active
                  theme={theme}
                  onClick={() => handleNavigation("dashboard")}
                />
                <NavItem
                  icon={BarChart3}
                  label="Trip Analytics"
                  theme={theme}
                  onClick={() => handleNavigation("analytics")}
                />
                <NavItem icon={Navigation} label="Plan Trip" theme={theme} onClick={() => handleNavigation("route")} />
                <NavItem icon={Settings} label="Settings" theme={theme} onClick={() => handleNavigation("settings")} />
              </nav>

              <div className={`mt-8 pt-6 border-t ${themeClasses.border}`}>
                <div className={`text-sm ${themeClasses.secondaryText} mb-4 font-semibold`}>TRIP STATISTICS</div>
                <div className="space-y-4">
                  <StatusItem label="Completion Rate" value={realStats.completionRate} color="green" theme={theme} />
                  <StatusItem
                    label="Planning Progress"
                    value={realStats.planningEfficiency}
                    color="blue"
                    theme={theme}
                  />
                  <StatusItem label="Budget Usage" value={realStats.budgetUtilization} color="purple" theme={theme} />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-12 md:col-span-9 lg:col-span-7">
            <div className="grid gap-6">
              {/* Real Travel Statistics Overview */}
              <div className={`${themeClasses.card} rounded-2xl overflow-hidden`}>
                <div className={`border-b ${themeClasses.border} p-6`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Activity className={`mr-4 h-7 w-7 ${themeClasses.accentText}`} />
                      <div>
                        <h2 className={`text-2xl font-bold ${themeClasses.primaryText}`}>Your Travel Statistics</h2>
                        <p className={`text-base ${themeClasses.secondaryText} mt-1`}>
                          Real data from your actual trips
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div
                        className={`px-4 py-2 ${
                          theme === "light"
                            ? "bg-blue-100 text-blue-700 border border-blue-200"
                            : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
                        } rounded-full text-sm font-semibold`}
                      >
                        <div
                          className={`h-2 w-2 rounded-full ${theme === "light" ? "bg-blue-600" : "bg-cyan-400"} mr-2 animate-pulse inline-block`}
                        ></div>
                        LIVE DATA
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <RealMetricCard
                      title="Trip Completion"
                      value={realStats.completionRate}
                      icon={CheckCircle}
                      color="green"
                      detail={`${realStats.completedTrips} of ${realStats.totalTrips} trips completed`}
                      theme={theme}
                    />
                    <RealMetricCard
                      title="Planning Efficiency"
                      value={realStats.planningEfficiency}
                      icon={Target}
                      color="blue"
                      detail={`${realStats.tripsWithPlans} trips with detailed plans`}
                      theme={theme}
                    />
                    <RealMetricCard
                      title="Average Progress"
                      value={realStats.totalProgress}
                      icon={TrendingUp}
                      color="purple"
                      detail={`Across all your trips`}
                      theme={theme}
                    />
                  </div>

                  {/* Real Travel Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                      icon={Globe}
                      label="Total Trips"
                      value={realStats.totalTrips}
                      color="from-cyan-500 to-blue-500"
                      theme={theme}
                    />
                    <StatCard
                      icon={Calendar}
                      label="Upcoming Trips"
                      value={realStats.upcomingTrips}
                      color="from-purple-500 to-pink-500"
                      theme={theme}
                    />
                    <StatCard
                      icon={CheckCircle}
                      label="Completed"
                      value={realStats.completedTrips}
                      color="from-green-500 to-emerald-500"
                      theme={theme}
                    />
                    <StatCard
                      icon={Heart}
                      label="Favorites"
                      value={realStats.favoriteTrips}
                      color="from-red-500 to-pink-500"
                      theme={theme}
                    />
                  </div>
                </div>
              </div>

              {/* Real Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`${themeClasses.card} rounded-2xl p-6`}>
                  <div className="flex items-center mb-6">
                    <BarChart3 className={`mr-3 h-6 w-6 ${theme === "light" ? "text-blue-600" : "text-blue-400"}`} />
                    <h3 className={`text-xl font-bold ${themeClasses.primaryText}`}>Trip Analytics</h3>
                  </div>
                  <div className="space-y-5">
                    <AnalyticsItem
                      label="Destinations Visited"
                      value={realStats.destinationsVisited}
                      total={20}
                      color="blue"
                      theme={theme}
                    />
                    <AnalyticsItem
                      label="Average Trip Duration"
                      value={realStats.averageDuration}
                      total={14}
                      color="purple"
                      unit=" days"
                      theme={theme}
                    />
                    <AnalyticsItem
                      label="Total Travel Days"
                      value={realStats.totalDays}
                      total={365}
                      color="cyan"
                      unit=" days"
                      theme={theme}
                    />
                    <AnalyticsItem
                      label="Budget per Day"
                      value={Math.round(realStats.avgBudgetPerDay / 1000)}
                      total={10}
                      color="green"
                      unit="K ₹"
                      theme={theme}
                    />
                  </div>
                </div>

                <div className={`${themeClasses.card} rounded-2xl p-6`}>
                  <div className="flex items-center mb-6">
                    <DollarSign className={`mr-3 h-6 w-6 ${theme === "light" ? "text-green-600" : "text-green-400"}`} />
                    <h3 className={`text-xl font-bold ${themeClasses.primaryText}`}>Budget Overview</h3>
                  </div>
                  <div className="space-y-4">
                    <div className={`${themeClasses.cardContent} rounded-xl p-4`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm ${themeClasses.secondaryText}`}>Total Budget</span>
                        <span className={`text-lg font-bold ${theme === "light" ? "text-blue-600" : "text-blue-400"}`}>
                          ₹{realStats.totalBudget.toLocaleString()}
                        </span>
                      </div>
                      <div className={`text-xs ${themeClasses.secondaryText}`}>Across {realStats.totalTrips} trips</div>
                    </div>

                    <div className={`${themeClasses.cardContent} rounded-xl p-4`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm ${themeClasses.secondaryText}`}>Budget Spent</span>
                        <span
                          className={`text-lg font-bold ${theme === "light" ? "text-green-600" : "text-green-400"}`}
                        >
                          ₹{realStats.budgetSpent.toLocaleString()}
                        </span>
                      </div>
                      <div className={`text-xs ${themeClasses.secondaryText}`}>
                        From {realStats.completedTrips} completed trips
                      </div>
                    </div>

                    <div className={`${themeClasses.cardContent} rounded-xl p-4`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm ${themeClasses.secondaryText}`}>Budget Remaining</span>
                        <span
                          className={`text-lg font-bold ${theme === "light" ? "text-purple-600" : "text-purple-400"}`}
                        >
                          ₹{realStats.budgetRemaining.toLocaleString()}
                        </span>
                      </div>
                      <div className={`text-xs ${themeClasses.secondaryText}`}>For upcoming & active trips</div>
                    </div>

                    <div className={`${themeClasses.cardContent} rounded-xl p-4`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm ${themeClasses.secondaryText}`}>Budget Utilization</span>
                        <span
                          className={`text-lg font-bold ${theme === "light" ? "text-orange-600" : "text-orange-400"}`}
                        >
                          {realStats.budgetUtilization}%
                        </span>
                      </div>
                      <div
                        className={`w-full ${theme === "light" ? "bg-gray-200" : "bg-slate-700"} rounded-full h-2 mt-2`}
                      >
                        <div
                          className={`${theme === "light" ? "bg-gradient-to-r from-orange-500 to-red-500" : "bg-gradient-to-r from-orange-500 to-red-500"} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${realStats.budgetUtilization}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Adventures */}
              <div className={`${themeClasses.card} rounded-2xl p-6`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <TrendingUp className={`mr-4 h-7 w-7 ${themeClasses.accentText}`} />
                    <h2 className={`text-2xl font-bold ${themeClasses.primaryText}`}>Recent Adventures</h2>
                  </div>
                  <Link
                    to="/my-trips"
                    className={`${themeClasses.accentText} hover:opacity-80 font-semibold text-base flex items-center transition-colors`}
                  >
                    View All Trips
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`animate-pulse ${themeClasses.cardContent} rounded-xl p-4`}>
                        <div
                          className={`h-24 ${theme === "light" ? "bg-gray-200" : "bg-slate-700/50"} rounded-lg mb-3`}
                        ></div>
                        <div
                          className={`h-4 ${theme === "light" ? "bg-gray-200" : "bg-slate-700/50"} rounded w-3/4 mb-2`}
                        ></div>
                        <div
                          className={`h-3 ${theme === "light" ? "bg-gray-200" : "bg-slate-700/50"} rounded w-1/2`}
                        ></div>
                      </div>
                    ))}
                  </div>
                ) : trips.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {trips.slice(0, 4).map((trip) => {
                      const status = getStatusBadge(trip)
                      const progress = trip.progress_stats?.percentage || 0

                      return (
                        <Link
                          key={trip.id}
                          to={`/trip-details/${trip.id}`}
                          className={`group ${themeClasses.cardContent} rounded-xl border ${themeClasses.border} overflow-hidden hover:${theme === "light" ? "border-blue-300 shadow-lg" : "border-cyan-500/50"} transition-all transform hover:scale-105`}
                        >
                          <div className="relative h-28 overflow-hidden">
                            <img
                              src={
                                trip.thumbnail_url ||
                                `https://source.unsplash.com/800x400/?${encodeURIComponent(trip.destination) || "/placeholder.svg"},travel`
                              }
                              alt={trip.destination}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                e.target.src = "/placeholder.svg?height=112&width=400"
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            <div className="absolute top-3 right-3">
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${status.color} backdrop-blur-sm`}
                              >
                                {status.text}
                              </span>
                            </div>
                            <div className="absolute bottom-3 left-3">
                              <h3 className="text-base font-bold text-white">{trip.destination}</h3>
                            </div>
                          </div>

                          <div className="p-4">
                            {progress > 0 && (
                              <div className="mb-3">
                                <div className="flex justify-between items-center mb-2">
                                  <span className={`text-sm ${themeClasses.secondaryText} font-medium`}>
                                    Trip Progress
                                  </span>
                                  <span className={`text-sm font-semibold ${themeClasses.accentText}`}>
                                    {progress}%
                                  </span>
                                </div>
                                <div
                                  className={`w-full ${theme === "light" ? "bg-gray-200" : "bg-slate-700"} rounded-full h-2`}
                                >
                                  <div
                                    className={`${theme === "light" ? "bg-gradient-to-r from-blue-500 to-purple-500" : "bg-gradient-to-r from-cyan-500 to-blue-500"} h-2 rounded-full transition-all duration-300`}
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}

                            <div className="flex justify-between items-center text-sm">
                              <div className={`flex items-center ${themeClasses.secondaryText}`}>
                                <Calendar className="w-4 h-4 mr-2" />
                                <span className="font-medium">{trip.days} days</span>
                              </div>
                              <div className={`${themeClasses.accentText} font-bold text-base`}>
                                ₹{(Number(trip.budget) / 1000).toFixed(0)}K
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div
                      className={`w-28 h-28 ${
                        theme === "light"
                          ? "bg-gradient-to-br from-blue-100 to-purple-100"
                          : "bg-gradient-to-br from-cyan-500/20 to-purple-500/20"
                      } rounded-full flex items-center justify-center mx-auto mb-6`}
                    >
                      <Plane className={`w-14 h-14 ${themeClasses.accentText}`} />
                    </div>
                    <h3 className={`text-2xl font-bold ${themeClasses.primaryText} mb-3`}>No Adventures Yet</h3>
                    <p className={`${themeClasses.secondaryText} mb-8 text-lg`}>
                      Start planning your first amazing journey!
                    </p>
                    <button
                      onClick={handlePlanTrip}
                      className={`${
                        theme === "light"
                          ? "bg-gradient-to-r from-blue-600 to-purple-600"
                          : "bg-gradient-to-r from-cyan-600 to-blue-600"
                      } text-white px-10 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all transform hover:scale-105`}
                    >
                      Plan Your First Trip
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="col-span-12 lg:col-span-3">
            <div className="grid gap-6">
              {/* System Time */}
              <div className={`${themeClasses.card} rounded-2xl overflow-hidden`}>
                <div
                  className={`${
                    theme === "light"
                      ? "bg-gradient-to-br from-blue-50 to-indigo-50"
                      : "bg-gradient-to-br from-slate-800 to-slate-900"
                  } p-6 border-b ${themeClasses.border}`}
                >
                  <div className="text-center">
                    <div className={`text-sm ${themeClasses.secondaryText} mb-2 font-semibold`}>CURRENT TIME</div>
                    <div className={`text-4xl font-mono ${themeClasses.accentText} mb-2 font-bold`}>
                      {formatTime(currentTime)}
                    </div>
                    <div className={`text-base ${themeClasses.secondaryText} font-medium`}>
                      {formatDate(currentTime)}
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`${themeClasses.cardContent} rounded-lg p-3 border ${themeClasses.border}`}>
                      <div className={`text-sm ${themeClasses.secondaryText} mb-1 font-medium`}>Total Trips</div>
                      <div className={`text-base font-mono ${themeClasses.primaryText} font-semibold`}>
                        {realStats.totalTrips}
                      </div>
                    </div>
                    <div className={`${themeClasses.cardContent} rounded-lg p-3 border ${themeClasses.border}`}>
                      <div className={`text-sm ${themeClasses.secondaryText} mb-1 font-medium`}>Active</div>
                      <div className={`text-base font-mono ${themeClasses.primaryText} font-semibold`}>
                        {realStats.activeTrips}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className={`${themeClasses.card} rounded-2xl p-6`}>
                <h3 className={`text-xl font-bold ${themeClasses.primaryText} mb-5`}>Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <ActionButton icon={Plane} label="Plan Trip" onClick={handlePlanTrip} theme={theme} />
                  <ActionButton icon={MapPin} label="My Trips" onClick={() => navigate("/my-trips")} theme={theme} />
                  <ActionButton
                    icon={BarChart3}
                    label="Analytics"
                    onClick={() => navigate("/my-trips")}
                    theme={theme}
                  />
                  <ActionButton
                    icon={Settings}
                    label="Settings"
                    onClick={() => console.log("Settings")}
                    theme={theme}
                  />
                </div>
              </div>

              {/* Trip Summary */}
              <div className={`${themeClasses.card} rounded-2xl p-6`}>
                <h3 className={`text-xl font-bold ${themeClasses.primaryText} mb-5`}>Trip Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className={`${themeClasses.secondaryText}`}>Destinations</span>
                    <span className={`font-bold ${themeClasses.primaryText}`}>{realStats.destinationsVisited}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`${themeClasses.secondaryText}`}>Total Days</span>
                    <span className={`font-bold ${themeClasses.primaryText}`}>{realStats.totalDays}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`${themeClasses.secondaryText}`}>Avg Duration</span>
                    <span className={`font-bold ${themeClasses.primaryText}`}>{realStats.averageDuration} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`${themeClasses.secondaryText}`}>Completion</span>
                    <span className={`font-bold ${theme === "light" ? "text-green-600" : "text-green-400"}`}>
                      {realStats.completionRate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close search results */}
      {showSearchResults && <div className="fixed inset-0 z-40" onClick={() => setShowSearchResults(false)}></div>}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

// Component definitions with theme support and real data
function NavItem({ icon: Icon, label, active, theme, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
        active
          ? theme === "light"
            ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border border-blue-200"
            : "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30"
          : theme === "light"
            ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
      }`}
    >
      <Icon className="mr-3 h-5 w-5" />
      <span className="text-base font-medium">{label}</span>
    </button>
  )
}

function StatusItem({ label, value, color, theme }) {
  const getColor = () => {
    if (theme === "light") {
      switch (color) {
        case "blue":
          return "from-blue-400 to-blue-600"
        case "green":
          return "from-emerald-400 to-green-600"
        case "purple":
          return "from-purple-400 to-pink-600"
        default:
          return "from-blue-400 to-blue-600"
      }
    } else {
      switch (color) {
        case "blue":
          return "from-cyan-500 to-blue-500"
        case "green":
          return "from-green-500 to-emerald-500"
        case "purple":
          return "from-purple-500 to-pink-500"
        default:
          return "from-cyan-500 to-blue-500"
      }
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className={`text-sm ${theme === "light" ? "text-gray-600" : "text-slate-400"} font-medium`}>{label}</div>
        <div className={`text-sm ${theme === "light" ? "text-gray-600" : "text-slate-400"} font-semibold`}>
          {value}%
        </div>
      </div>
      <div className={`h-2 ${theme === "light" ? "bg-gray-200" : "bg-slate-800"} rounded-full overflow-hidden`}>
        <div className={`h-full bg-gradient-to-r ${getColor()} rounded-full`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  )
}

function RealMetricCard({ title, value, icon: Icon, color, detail, theme }) {
  const getColor = () => {
    if (theme === "light") {
      switch (color) {
        case "blue":
          return "from-blue-400 to-blue-600 border-blue-200"
        case "green":
          return "from-emerald-400 to-green-600 border-emerald-200"
        case "purple":
          return "from-purple-400 to-pink-600 border-purple-200"
        default:
          return "from-blue-400 to-blue-600 border-blue-200"
      }
    } else {
      switch (color) {
        case "blue":
          return "from-cyan-500 to-blue-500 border-cyan-500/30"
        case "green":
          return "from-green-500 to-emerald-500 border-green-500/30"
        case "purple":
          return "from-purple-500 to-pink-500 border-purple-500/30"
        default:
          return "from-cyan-500 to-blue-500 border-cyan-500/30"
      }
    }
  }

  return (
    <div
      className={`${theme === "light" ? "bg-white/90" : "bg-slate-800/50"} rounded-xl border ${getColor()} p-5 relative overflow-hidden`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`text-base ${theme === "light" ? "text-gray-600" : "text-slate-400"} font-medium`}>{title}</div>
        <Icon className={`h-6 w-6 ${theme === "light" ? `text-${color}-600` : `text-${color}-400`}`} />
      </div>
      <div
        className={`text-3xl font-bold mb-2 ${theme === "light" ? "text-gray-800" : "bg-gradient-to-r bg-clip-text text-transparent from-slate-100 to-slate-300"}`}
      >
        {value}%
      </div>
      <div className={`text-sm ${theme === "light" ? "text-gray-500" : "text-slate-500"} font-medium`}>{detail}</div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, theme }) {
  return (
    <div
      className={`${theme === "light" ? "bg-white/90 border-gray-200/50" : "bg-slate-800/50 border-slate-700/50"} rounded-xl border p-5 relative overflow-hidden`}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon className={`h-6 w-6 ${theme === "light" ? "text-gray-600" : "text-slate-400"}`} />
        <div className={`text-3xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{value}</div>
      </div>
      <div className={`text-sm ${theme === "light" ? "text-gray-600" : "text-slate-400"} font-medium`}>{label}</div>
      <div
        className={`absolute -bottom-4 -right-4 h-12 w-12 rounded-full bg-gradient-to-r ${color} opacity-15 blur-lg`}
      ></div>
    </div>
  )
}

function AnalyticsItem({ label, value, total, color, unit = "", theme }) {
  const percentage = Math.min((value / total) * 100, 100)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className={`text-base ${theme === "light" ? "text-gray-600" : "text-slate-400"} font-medium`}>{label}</div>
        <div className={`text-base font-semibold ${theme === "light" ? `text-${color}-600` : `text-${color}-400`}`}>
          {value}
          {unit}
        </div>
      </div>
      <div className={`h-2.5 ${theme === "light" ? "bg-gray-200" : "bg-slate-800"} rounded-full overflow-hidden`}>
        <div
          className={`h-full bg-gradient-to-r from-${color}-500 to-${color}-400 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  )
}

function ActionButton({ icon: Icon, label, onClick, theme }) {
  return (
    <button
      onClick={onClick}
      className={`h-auto py-4 px-4 border ${
        theme === "light"
          ? "border-gray-200 bg-white/90 hover:bg-gray-50 hover:border-blue-300 hover:shadow-lg"
          : "border-slate-700/50 bg-slate-800/50 hover:bg-slate-700/50 hover:border-cyan-500/50"
      } rounded-xl flex flex-col items-center justify-center space-y-2 w-full transition-all transform hover:scale-105`}
    >
      <Icon className={`h-6 w-6 ${theme === "light" ? "text-blue-600" : "text-cyan-400"}`} />
      <span className={`text-sm font-medium ${theme === "light" ? "text-gray-700" : "text-slate-300"}`}>{label}</span>
    </button>
  )
}

export default Dashboard
