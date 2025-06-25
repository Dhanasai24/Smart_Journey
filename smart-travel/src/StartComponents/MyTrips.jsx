"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  Activity,
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle,
  DollarSign,
  Filter,
  Globe,
  Grid3X3,
  Heart,
  List,
  MapPin,
  Moon,
  Plus,
  Search,
  Settings,
  Sparkles,
  Star,
  Sun,
  Target,
  Users,
  Zap,
  Eye,
  RefreshCw,
  Trash2,
  MessageSquare,
  Clock,
} from "lucide-react"
import { useAuth } from "../assets/Context/AuthContext"
import { useTheme } from "../assets/Context/ThemeContext"
import { useSocket } from "../Hooks/UseSocket"
import { API_BASE_URL } from "../assets/Utils/Constants"
import VisibilityToggle from "../TravelComponents/VisibilityToggle"
import ReviewSystem from "./ReviewSystem"

const MyTrips = () => {
  const { user, token } = useAuth()
  const { theme, toggleTheme, getThemeClasses } = useTheme()
  const { isConnected } = useSocket()
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [viewMode, setViewMode] = useState("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(null)
  const canvasRef = useRef(null)

  const themeClasses = getThemeClasses()

  const [stats, setStats] = useState({
    totalTrips: 0,
    activeTrips: 0,
    completedTrips: 0,
    totalBudget: 0,
    averageRating: 0,
    destinationsVisited: 0,
    totalDays: 0,
    favoriteTrips: 0,
    publicTrips: 0,
  })

  const [systemMetrics, setSystemMetrics] = useState({
    tripSuccess: 94,
    routeOptimization: 87,
    budgetEfficiency: 91,
    timeManagement: 89,
    satisfactionIndex: 96,
    explorationRate: 78,
  })

  // Enhanced particle effect matching Dashboard exactly
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const particles = []
    const particleCount = theme === "dark" ? 80 : 60

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * (theme === "dark" ? 2 : 1.5) + 1
        this.speedX = (Math.random() - 0.5) * (theme === "dark" ? 0.3 : 0.2)
        this.speedY = (Math.random() - 0.5) * (theme === "dark" ? 0.3 : 0.2)

        if (theme === "dark") {
          this.color = `rgba(${Math.floor(Math.random() * 100) + 100}, ${Math.floor(Math.random() * 100) + 150}, ${Math.floor(Math.random() * 55) + 200}, ${Math.random() * 0.4 + 0.1})`
        } else {
          this.color = `rgba(${Math.floor(Math.random() * 80) + 60}, ${Math.floor(Math.random() * 120) + 140}, ${Math.floor(Math.random() * 100) + 200}, ${Math.random() * 0.4 + 0.2})`
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

  // Simulate changing metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemMetrics((prev) => ({
        ...prev,
        tripSuccess: Math.floor(Math.random() * 8) + 90,
        routeOptimization: Math.floor(Math.random() * 15) + 80,
        budgetEfficiency: Math.floor(Math.random() * 12) + 85,
        timeManagement: Math.floor(Math.random() * 10) + 85,
        satisfactionIndex: Math.floor(Math.random() * 6) + 94,
        explorationRate: Math.floor(Math.random() * 20) + 70,
      }))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Fetch trips function
  const fetchTrips = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)

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

      // Fetch ratings for user's trips
      const fetchTripRatings = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/reviews/user/my-reviews`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success && data.reviews) {
              // Create a map of trip_id to rating
              const ratingsMap = {}
              data.reviews.forEach((review) => {
                if (review.trip_id) {
                  ratingsMap[review.trip_id] = review.rating
                }
              })

              // Update trips with ratings
              setTrips((prevTrips) =>
                prevTrips.map((trip) => ({
                  ...trip,
                  rating: ratingsMap[trip.id] || trip.rating,
                })),
              )
            }
          }
        } catch (error) {
          console.error("Error fetching trip ratings:", error)
        }
      }

      // Call fetchTripRatings after setting trips
      fetchTripRatings()

      // Calculate enhanced stats including public trips
      const totalTrips = userTrips.length
      const activeTrips = userTrips.filter(
        (trip) =>
          trip.status === "active" || (trip.progress_stats?.percentage > 0 && trip.progress_stats?.percentage < 100),
      ).length
      const completedTrips = userTrips.filter(
        (trip) => trip.status === "completed" || trip.progress_stats?.percentage === 100,
      ).length
      const totalBudget = userTrips.reduce((sum, trip) => sum + (Number(trip.budget) || 0), 0)
      const favoriteTrips = userTrips.filter((trip) => trip.is_favorite).length
      const publicTrips = userTrips.filter((trip) => trip.is_public || trip.visibility === "public").length
      const destinationsVisited = new Set(userTrips.map((trip) => trip.destination)).size
      const totalDays = userTrips.reduce((sum, trip) => sum + (trip.days || 0), 0)
      const averageRating =
        userTrips.length > 0
          ? (userTrips.reduce((sum, trip) => sum + (trip.rating || 4.5), 0) / userTrips.length).toFixed(1)
          : 0

      setStats({
        totalTrips,
        activeTrips,
        completedTrips,
        totalBudget,
        averageRating,
        destinationsVisited,
        totalDays,
        favoriteTrips,
        publicTrips,
      })
    } catch (err) {
      console.error("Error fetching trips:", err)
      setError("Failed to load trips. Please try again later.")
    } finally {
      setLoading(false)
      if (showRefreshing) setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchTrips()
  }, [token])

  const handleVisibilityChange = (tripId, isPublic, updatedTrip) => {
    console.log(`🔄 Visibility changed for trip ${tripId}: ${isPublic ? "PUBLIC" : "PRIVATE"}`)
    console.log("Updated trip data:", updatedTrip)

    setTrips((prevTrips) =>
      prevTrips.map((trip) =>
        trip.id === tripId
          ? {
              ...trip,
              is_public: isPublic,
              visibility: isPublic ? "public" : "private",
              ...updatedTrip,
            }
          : trip,
      ),
    )

    const updatedTrips = trips.map((trip) =>
      trip.id === tripId
        ? {
            ...trip,
            is_public: isPublic,
            visibility: isPublic ? "public" : "private",
          }
        : trip,
    )
    const publicTrips = updatedTrips.filter((trip) => trip.is_public || trip.visibility === "public").length
    setStats((prev) => ({ ...prev, publicTrips }))

    // Show success message
    showToast(`Trip ${isPublic ? "made public" : "made private"} successfully!`, "success")
  }

  const handleToggleFavorite = async (trip) => {
    try {
      const response = await fetch(`${API_BASE_URL}/trips/${trip.id}/favorite`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        setTrips(trips.map((t) => (t.id === trip.id ? { ...t, is_favorite: !t.is_favorite } : t)))
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
    }
  }

  const handleDeleteTrip = async (trip) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to permanently delete your trip to ${trip.destination}? This action cannot be undone.`,
    )

    if (!isConfirmed) return

    try {
      const response = await fetch(`${API_BASE_URL}/trips/${trip.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        setTrips(trips.filter((t) => t.id !== trip.id))

        const updatedTrips = trips.filter((t) => t.id !== trip.id)
        const totalTrips = updatedTrips.length
        const activeTrips = updatedTrips.filter(
          (trip) =>
            trip.status === "active" || (trip.progress_stats?.percentage > 0 && trip.progress_stats?.percentage < 100),
        ).length
        const completedTrips = updatedTrips.filter(
          (trip) => trip.status === "completed" || trip.progress_stats?.percentage === 100,
        ).length
        const favoriteTrips = updatedTrips.filter((trip) => trip.is_favorite).length
        const publicTrips = updatedTrips.filter((trip) => trip.is_public || trip.visibility === "public").length

        setStats((prev) => ({
          ...prev,
          totalTrips,
          activeTrips,
          completedTrips,
          favoriteTrips,
          publicTrips,
        }))

        console.log(`✅ Trip to ${trip.destination} deleted successfully`)
      } else {
        throw new Error("Failed to delete trip")
      }
    } catch (error) {
      console.error("Error deleting trip:", error)
      alert("Failed to delete trip. Please try again.")
    }
  }

  // Handle review submission
  const handleReviewSubmitted = (review) => {
    console.log("Review submitted:", review)
    setShowReviewModal(null)
    // Show success message
    const toast = document.createElement("div")
    toast.className = "fixed top-4 right-4 z-50 p-4 bg-green-500 text-white rounded-lg shadow-lg"
    toast.textContent = "Review submitted successfully! 🎉"
    document.body.appendChild(toast)
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast)
      }
    }, 3000)
  }

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "Not set"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch {
      return "Invalid date"
    }
  }

  // Filter and sort trips
  const filteredTrips = trips
    .filter((trip) => {
      const matchesSearch =
        trip.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (trip.title && trip.title.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesFilter =
        filterStatus === "all" ||
        (filterStatus === "active" &&
          (trip.status === "active" ||
            (trip.progress_stats?.percentage > 0 && trip.progress_stats?.percentage < 100))) ||
        (filterStatus === "completed" && (trip.status === "completed" || trip.progress_stats?.percentage === 100)) ||
        (filterStatus === "planning" && (!trip.progress_stats || trip.progress_stats?.percentage === 0)) ||
        (filterStatus === "favorites" && trip.is_favorite) ||
        (filterStatus === "public" && (trip.is_public || trip.visibility === "public"))

      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.created_at || 0) - new Date(a.created_at || 0)
        case "budget":
          return (Number(b.budget) || 0) - (Number(a.budget) || 0)
        case "duration":
          return (b.days || 0) - (a.days || 0)
        case "alphabetical":
          return a.destination.localeCompare(b.destination)
        default:
          return 0
      }
    })

  const getStatusBadge = (trip) => {
    const progress = trip.progress_stats?.percentage || 0
    if (progress === 100) return { text: "COMPLETED", color: themeClasses.successBadge }
    if (progress > 0) return { text: "ACTIVE", color: themeClasses.activeBadge }
    if (trip.start_date && new Date(trip.start_date) > new Date())
      return { text: "SCHEDULED", color: "bg-purple-500/20 text-purple-400 border-purple-500/50" }
    return { text: "PLANNING", color: "bg-slate-500/20 text-slate-400 border-slate-500/50" }
  }

  const handleCreateTrip = () => {
    navigate("/trip-planner")
  }

  const showToast = (message, type = "info") => {
    const toast = document.createElement("div")
    toast.className = `fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl backdrop-blur-lg border transition-all duration-500 transform ${
      type === "success"
        ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-100"
        : type === "error"
          ? "bg-red-500/20 border-red-400/30 text-red-100"
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

  return (
    <div
      className={`min-h-screen ${themeClasses.background} ${themeClasses.primaryText} relative overflow-hidden transition-all duration-500`}
    >
      {/* Background particle effect */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full ${theme === "dark" ? "opacity-20" : "opacity-40"}`}
      />

      {/* Grid Pattern Overlay */}
      <div className={`absolute inset-0 ${themeClasses.gridPattern}`}></div>

      <div className="container mx-auto p-6 relative z-10">
        {/* Enhanced Header */}
        <header
          className={`flex flex-col lg:flex-row items-start lg:items-center justify-between py-6 border-b ${themeClasses.border} mb-8`}
        >
          <div className="flex items-center space-x-4 mb-4 lg:mb-0">
            <div
              className={`w-16 h-16 ${theme === "dark" ? "bg-gradient-to-br from-cyan-500 to-blue-600" : "bg-gradient-to-br from-blue-500 to-purple-600"} rounded-2xl flex items-center justify-center shadow-2xl`}
            >
              <Target className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1
                className={`text-4xl font-bold ${theme === "dark" ? "bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent" : "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"}`}
              >
                TRAVEL COMMAND CENTER
              </h1>
              <p className={`${themeClasses.secondaryText} text-lg font-medium`}>Your Adventure Dashboard</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className={`p-3 ${themeClasses.cardContent} border ${themeClasses.border} rounded-xl hover:scale-105 transition-all duration-300 ${themeClasses.secondaryText} hover:${themeClasses.accentText}`}
            >
              {theme === "dark" ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>

            <div
              className={`px-6 py-3 ${theme === "dark" ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400" : "bg-blue-100 border-blue-300 text-blue-700"} border rounded-full font-semibold`}
            >
              <div
                className={`h-2 w-2 rounded-full ${theme === "dark" ? "bg-cyan-400" : "bg-blue-600"} mr-3 animate-pulse inline-block`}
              ></div>
              SYSTEM ONLINE
            </div>
            <button
              onClick={handleCreateTrip}
              className={`${themeClasses.primaryButton} text-white px-8 py-3 rounded-xl font-semibold hover:shadow-xl transition-all transform hover:scale-105 flex items-center space-x-2`}
            >
              <Plus className="w-5 h-5" />
              <span>NEW ADVENTURE</span>
            </button>
          </div>
        </header>

        {error && (
          <div
            className={`${theme === "dark" ? "bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-500/50 text-red-400" : "bg-gradient-to-r from-red-50 to-pink-50 border-red-200 text-red-700"} border px-6 py-4 rounded-xl mb-6 backdrop-blur-sm`}
          >
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 mr-3" />
              <span className="text-base font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Enhanced Statistics Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="lg:col-span-3">
            <div className={`${themeClasses.card} border ${themeClasses.border} rounded-2xl p-6`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Activity className={`mr-4 h-7 w-7 ${themeClasses.accentText}`} />
                  <h2 className={`text-2xl font-bold ${themeClasses.primaryText}`}>Travel Intelligence Dashboard</h2>
                </div>
                <div className="flex items-center space-x-3">
                  <div
                    className={`px-4 py-2 ${theme === "dark" ? "bg-green-500/20 text-green-400 border-green-500/50" : "bg-green-100 text-green-700 border-green-300"} border rounded-full text-sm font-semibold`}
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${theme === "dark" ? "bg-green-400" : "bg-green-600"} mr-2 animate-pulse inline-block`}
                    ></div>
                    OPERATIONAL
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <MetricCard
                  icon={Globe}
                  label="Total Adventures"
                  value={stats.totalTrips}
                  color={theme === "dark" ? "from-cyan-500 to-blue-500" : "from-blue-500 to-purple-500"}
                  theme={theme}
                />
                <MetricCard
                  icon={Zap}
                  label="Active Journeys"
                  value={stats.activeTrips}
                  color={theme === "dark" ? "from-yellow-500 to-orange-500" : "from-orange-500 to-red-500"}
                  theme={theme}
                />
                <MetricCard
                  icon={CheckCircle}
                  label="Completed"
                  value={stats.completedTrips}
                  color={theme === "dark" ? "from-green-500 to-emerald-500" : "from-emerald-500 to-green-600"}
                  theme={theme}
                />
                <MetricCard
                  icon={Eye}
                  label="Public Trips"
                  value={stats.publicTrips}
                  color={theme === "dark" ? "from-purple-500 to-pink-500" : "from-pink-500 to-purple-600"}
                  theme={theme}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={`${themeClasses.card} border ${themeClasses.border} rounded-2xl p-6`}>
              <h3 className={`text-xl font-bold ${themeClasses.primaryText} mb-4 flex items-center`}>
                <BarChart3 className={`mr-3 h-6 w-6 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`} />
                System Status
              </h3>
              <div className="space-y-4">
                <SystemMetric label="Trip Success" value={systemMetrics.tripSuccess} color="green" theme={theme} />
                <SystemMetric
                  label="Route Optimization"
                  value={systemMetrics.routeOptimization}
                  color="cyan"
                  theme={theme}
                />
                <SystemMetric
                  label="Budget Efficiency"
                  value={systemMetrics.budgetEfficiency}
                  color="purple"
                  theme={theme}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Control Panel */}
        <div className={`${themeClasses.card} border ${themeClasses.border} rounded-2xl p-6 mb-6`}>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
            <h2 className={`text-2xl font-bold ${themeClasses.primaryText} flex items-center`}>
              <Settings className={`mr-3 h-7 w-7 ${themeClasses.accentText}`} />
              Control Panel
            </h2>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => fetchTrips(true)}
                disabled={refreshing}
                className={`p-3 ${themeClasses.cardContent} border ${themeClasses.border} rounded-lg hover:scale-105 transition-all duration-300 ${refreshing ? "animate-spin" : ""}`}
              >
                <RefreshCw className={`w-5 h-5 ${themeClasses.accentText}`} />
              </button>
              <button
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                className={`p-3 ${themeClasses.cardContent} border ${themeClasses.border} rounded-lg hover:scale-105 transition-all duration-300`}
              >
                {viewMode === "grid" ? (
                  <List className={`w-5 h-5 ${themeClasses.accentText}`} />
                ) : (
                  <Grid3X3 className={`w-5 h-5 ${themeClasses.accentText}`} />
                )}
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 ${themeClasses.cardContent} border ${themeClasses.border} rounded-lg hover:scale-105 transition-all duration-300`}
              >
                <Filter className={`w-5 h-5 ${themeClasses.accentText}`} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${themeClasses.secondaryText}`}
              />
              <input
                type="text"
                placeholder="Search adventures..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full ${themeClasses.input} rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-${theme === "dark" ? "cyan" : "blue"}-500/50 transition-colors`}
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`${themeClasses.input} rounded-lg px-4 py-3 focus:outline-none focus:border-${theme === "dark" ? "cyan" : "blue"}-500/50 transition-colors`}
            >
              <option value="all">All Adventures</option>
              <option value="active">Active Journeys</option>
              <option value="completed">Completed</option>
              <option value="planning">Planning Phase</option>
              <option value="favorites">Favorites</option>
              <option value="public">Public Trips</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`${themeClasses.input} rounded-lg px-4 py-3 focus:outline-none focus:border-${theme === "dark" ? "cyan" : "blue"}-500/50 transition-colors`}
            >
              <option value="date">Sort by Date</option>
              <option value="budget">Sort by Budget</option>
              <option value="duration">Sort by Duration</option>
              <option value="alphabetical">Alphabetical</option>
            </select>

            <div
              className={`flex items-center justify-center ${themeClasses.cardContent} border ${themeClasses.border} rounded-lg px-4 py-3`}
            >
              <span className={`${themeClasses.accentText} font-semibold`}>
                {filteredTrips.length} Adventures Found
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Trip Grid/List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={`animate-pulse ${themeClasses.cardContent} rounded-xl p-6`}>
                <div className={`h-32 ${theme === "dark" ? "bg-slate-700/50" : "bg-gray-200"} rounded-lg mb-4`}></div>
                <div className={`h-4 ${theme === "dark" ? "bg-slate-700/50" : "bg-gray-200"} rounded w-3/4 mb-2`}></div>
                <div className={`h-3 ${theme === "dark" ? "bg-slate-700/50" : "bg-gray-200"} rounded w-1/2`}></div>
              </div>
            ))}
          </div>
        ) : filteredTrips.length > 0 ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredTrips.map((trip) => {
              const status = getStatusBadge(trip)
              const progress = trip.progress_stats?.percentage || 0
              const isCompleted =
                trip.status === "completed" ||
                trip.progress_stats?.percentage === 100 ||
                (trip.end_date && new Date(trip.end_date) < new Date())

              return viewMode === "grid" ? (
                <div
                  key={trip.id}
                  className={`group ${themeClasses.card} border ${themeClasses.border} rounded-xl overflow-hidden hover:border-${theme === "dark" ? "cyan" : "blue"}-500/50 transition-all transform hover:scale-105`}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={
                        trip.thumbnail_url ||
                        `https://source.unsplash.com/800x400/?${encodeURIComponent(trip.destination) || "/placeholder.svg"},travel`
                      }
                      alt={trip.destination}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = "/placeholder.svg?height=192&width=400"
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${status.color} backdrop-blur-sm border`}
                      >
                        {status.text}
                      </span>
                      {(trip.is_public || trip.visibility === "public") && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border-green-500/50 backdrop-blur-sm border">
                          PUBLIC
                        </span>
                      )}
                    </div>

                    <div className="absolute top-4 left-4">
                      <VisibilityToggle trip={trip} onVisibilityChange={handleVisibilityChange} className="" />
                    </div>

                    <div className="absolute bottom-4 left-4">
                      <h3 className="text-xl font-bold text-white mb-1">{trip.destination}</h3>
                      <div className="flex items-center text-cyan-300">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="text-sm">Adventure Destination</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {progress > 0 && (
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-sm ${themeClasses.secondaryText} font-medium`}>Trip Progress</span>
                          <span className={`text-sm font-bold ${themeClasses.accentText}`}>{progress}%</span>
                        </div>
                        <div className={`w-full ${theme === "dark" ? "bg-slate-800" : "bg-gray-200"} rounded-full h-2`}>
                          <div
                            className={`${theme === "dark" ? "bg-gradient-to-r from-cyan-500 to-blue-500" : "bg-gradient-to-r from-blue-500 to-purple-500"} h-2 rounded-full transition-all duration-500`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div className={`flex items-center ${themeClasses.secondaryText}`}>
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{trip.days} days</span>
                      </div>
                      <div className={`flex items-center ${themeClasses.secondaryText}`}>
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>₹{(Number(trip.budget) / 1000).toFixed(0)}K</span>
                      </div>
                      <div className={`flex items-center ${themeClasses.secondaryText}`}>
                        <Users className="w-4 h-4 mr-2" />
                        <span>{trip.travelers || 1} travelers</span>
                      </div>
                      {trip.rating && trip.rating > 0 ? (
                        <div
                          className={`flex items-center ${theme === "dark" ? "text-yellow-400" : "text-yellow-600"}`}
                        >
                          <Star className="w-4 h-4 mr-2" />
                          <span>{trip.rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <div className={`flex items-center ${themeClasses.secondaryText}`}>
                          <Star className="w-4 h-4 mr-2" />
                          <span>No rating</span>
                        </div>
                      )}
                    </div>

                    {/* FIXED: Better Start Date Styling - matches dark theme */}
                    {trip.start_date && (
                      <div className="mb-4 flex items-center justify-center">
                        <div
                          className={`flex items-center px-4 py-2 rounded-lg ${theme === "dark" ? "bg-slate-800/50 border border-slate-700/50 text-slate-300" : "bg-gray-100 border border-gray-200 text-gray-700"} backdrop-blur-sm`}
                        >
                          <Clock className={`w-4 h-4 mr-2 ${theme === "dark" ? "text-cyan-400" : "text-blue-500"}`} />
                          <span className="text-sm font-medium">{formatDate(trip.start_date)}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            handleToggleFavorite(trip)
                          }}
                          className={`p-2 rounded-lg transition-all ${
                            trip.is_favorite
                              ? "bg-pink-500/20 text-pink-400 border border-pink-500/50"
                              : `${themeClasses.cardContent} border ${themeClasses.border} ${themeClasses.secondaryText}`
                          } hover:scale-110`}
                        >
                          <Heart className={`w-4 h-4 ${trip.is_favorite ? "fill-current" : ""}`} />
                        </button>
                        {/* Write Review button for completed trips */}
                        {isCompleted && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              setShowReviewModal(trip)
                            }}
                            className={`p-2 rounded-lg transition-all ${themeClasses.cardContent} border ${themeClasses.border} ${themeClasses.secondaryText} hover:bg-yellow-500/20 hover:text-yellow-400 hover:border-yellow-500/50 hover:scale-110`}
                            title="Write Review"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            handleDeleteTrip(trip)
                          }}
                          className={`p-2 rounded-lg transition-all ${themeClasses.cardContent} border ${themeClasses.border} ${themeClasses.secondaryText} hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 hover:scale-110`}
                          title="Delete Trip"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => navigate(`/trip-details/${trip.id}`)}
                        className={`px-4 py-2 ${themeClasses.primaryButton} text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all`}
                      >
                        View Details
                      </button>
                    </div>

                    {trip.is_favorite && (
                      <div className={`mt-4 flex items-center ${theme === "dark" ? "text-pink-400" : "text-pink-600"}`}>
                        <Heart className="w-4 h-4 mr-2 fill-current" />
                        <span className="text-sm font-medium">Favorite Adventure</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  key={trip.id}
                  className={`group ${themeClasses.card} border ${themeClasses.border} rounded-xl p-6 hover:border-${theme === "dark" ? "cyan" : "blue"}-500/50 transition-all flex items-center space-x-6`}
                >
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 relative">
                    <img
                      src={
                        trip.thumbnail_url ||
                        `https://source.unsplash.com/200x200/?${encodeURIComponent(trip.destination) || "/placeholder.svg"},travel`
                      }
                      alt={trip.destination}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = "/placeholder.svg?height=96&width=96"
                      }}
                    />
                    {(trip.is_public || trip.visibility === "public") && (
                      <div className="absolute top-1 right-1">
                        <Eye className="w-3 h-3 text-green-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={`text-xl font-bold ${themeClasses.primaryText}`}>{trip.destination}</h3>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.color} border`}>
                          {status.text}
                        </span>
                        <VisibilityToggle trip={trip} onVisibilityChange={handleVisibilityChange} className="" />
                      </div>
                    </div>

                    <div className={`grid grid-cols-4 gap-4 text-sm ${themeClasses.secondaryText} mb-3`}>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{trip.days} days</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>₹{(Number(trip.budget) / 1000).toFixed(0)}K</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{trip.travelers || 1} travelers</span>
                      </div>
                      {trip.rating && trip.rating > 0 ? (
                        <div
                          className={`flex items-center ${theme === "dark" ? "text-yellow-400" : "text-yellow-600"}`}
                        >
                          <Star className="w-4 h-4 mr-2" />
                          <span>{trip.rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <div className={`flex items-center ${themeClasses.secondaryText}`}>
                          <Star className="w-4 h-4 mr-2" />
                          <span>No rating</span>
                        </div>
                      )}
                    </div>

                    {/* FIXED: Start Date in List View - matches theme */}
                    {trip.start_date && (
                      <div className="mb-3">
                        <div
                          className={`flex items-center px-3 py-2 rounded-lg ${theme === "dark" ? "bg-slate-800/50 border border-slate-700/50" : "bg-gray-100 border border-gray-200"}`}
                        >
                          <Clock className={`w-3 h-3 mr-2 ${theme === "dark" ? "text-cyan-400" : "text-blue-500"}`} />
                          <span className={`text-xs font-medium ${themeClasses.secondaryText}`}>
                            Start: {formatDate(trip.start_date)}
                          </span>
                        </div>
                      </div>
                    )}

                    {progress > 0 && (
                      <div className="mb-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-xs ${themeClasses.secondaryText}`}>Progress</span>
                          <span className={`text-xs font-bold ${themeClasses.accentText}`}>{progress}%</span>
                        </div>
                        <div
                          className={`w-full ${theme === "dark" ? "bg-slate-800" : "bg-gray-200"} rounded-full h-1.5`}
                        >
                          <div
                            className={`${theme === "dark" ? "bg-gradient-to-r from-cyan-500 to-blue-500" : "bg-gradient-to-r from-blue-500 to-purple-500"} h-1.5 rounded-full`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            handleToggleFavorite(trip)
                          }}
                          className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-all ${
                            trip.is_favorite
                              ? "bg-pink-500/20 text-pink-400"
                              : `${themeClasses.secondaryText} hover:${themeClasses.accentText}`
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${trip.is_favorite ? "fill-current" : ""}`} />
                          <span className="text-sm">{trip.is_favorite ? "Favorited" : "Favorite"}</span>
                        </button>
                        {/* Write Review button for completed trips in list view */}
                        {isCompleted && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              setShowReviewModal(trip)
                            }}
                            className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-all ${themeClasses.secondaryText} hover:text-yellow-400 hover:bg-yellow-500/20`}
                            title="Write Review"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-sm">Review</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            handleDeleteTrip(trip)
                          }}
                          className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-all ${themeClasses.secondaryText} hover:text-red-400 hover:bg-red-500/20`}
                          title="Delete Trip"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-sm">Delete</span>
                        </button>
                      </div>

                      <button
                        onClick={() => navigate(`/trip-details/${trip.id}`)}
                        className={`px-4 py-2 ${themeClasses.primaryButton} text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all`}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div
              className={`w-32 h-32 ${theme === "dark" ? "bg-gradient-to-br from-cyan-500/20 to-purple-500/20" : "bg-gradient-to-br from-blue-100 to-purple-100"} rounded-full flex items-center justify-center mx-auto mb-8`}
            >
              <Sparkles className={`w-16 h-16 ${themeClasses.accentText}`} />
            </div>
            <h3 className={`text-3xl font-bold ${themeClasses.primaryText} mb-4`}>No Adventures Found</h3>
            <p className={`${themeClasses.secondaryText} mb-8 text-lg`}>
              {searchQuery || filterStatus !== "all"
                ? "Try adjusting your search or filters"
                : "Ready to embark on your first adventure?"}
            </p>
            <button
              onClick={handleCreateTrip}
              className={`${themeClasses.primaryButton} text-white px-10 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all transform hover:scale-105`}
            >
              Launch New Adventure
            </button>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <ReviewSystem
          tripData={showReviewModal}
          onClose={() => setShowReviewModal(null)}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  )
}

// Enhanced Component definitions
function MetricCard({ icon: Icon, label, value, color, theme }) {
  return (
    <div
      className={`${theme === "dark" ? "bg-slate-800/50 border-slate-700/50" : "bg-white/90 border-gray-200/50"} border rounded-xl p-4 relative overflow-hidden hover:scale-105 transition-all duration-300`}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon className={`h-6 w-6 ${theme === "dark" ? "text-slate-400" : "text-gray-600"}`} />
        <div className={`text-2xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{value}</div>
      </div>
      <div className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-gray-600"} font-medium`}>{label}</div>
      <div
        className={`absolute -bottom-4 -right-4 h-12 w-12 rounded-full bg-gradient-to-r ${color} opacity-15 blur-lg`}
      ></div>
    </div>
  )
}

function SystemMetric({ label, value, color, theme }) {
  const getColor = () => {
    switch (color) {
      case "green":
        return "from-green-500 to-emerald-500"
      case "cyan":
        return "from-cyan-500 to-blue-500"
      case "purple":
        return "from-purple-500 to-pink-500"
      default:
        return "from-cyan-500 to-blue-500"
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-gray-600"} font-medium`}>{label}</div>
        <div className={`text-sm font-bold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>{value}%</div>
      </div>
      <div className={`h-2 ${theme === "dark" ? "bg-slate-800" : "bg-gray-200"} rounded-full overflow-hidden`}>
        <div
          className={`h-full bg-gradient-to-r ${getColor()} rounded-full transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

export default MyTrips
