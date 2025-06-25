"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Star,
  MapPin,
  DollarSign,
  ThumbsUp,
  Filter,
  Search,
  Heart,
  Share2,
  Clock,
  Globe,
  Lightbulb,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  X,
  Calendar,
  Award,
  MessageSquare,
  TrendingUp,
  Eye,
  Camera,
  Zap,
} from "lucide-react"
import { useAuth } from "../assets/Context/AuthContext"
import { API_BASE_URL } from "../assets/Utils/Constants"
import axios from "axios"

const ReviewsPage = () => {
  const { user, token } = useAuth()
  const [reviews, setReviews] = useState([])
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState(new Set()) // Track favorite reviews
  const [filters, setFilters] = useState({
    destination: "",
    rating: "",
    travel_style: "",
    sort_by: "created_at",
    sort_order: "DESC",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 12,
    offset: 0,
    hasMore: false,
  })
  const [expandedReviews, setExpandedReviews] = useState(new Set())
  const [selectedImages, setSelectedImages] = useState([])
  const [showImageModal, setShowImageModal] = useState(false)

  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      : {
          "Content-Type": "application/json",
        },
  })

  const showToast = useCallback((message, type = "info") => {
    const toast = document.createElement("div")
    toast.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-2xl shadow-2xl transition-all duration-300 backdrop-blur-xl border ${
      type === "success"
        ? "bg-gradient-to-r from-emerald-500/90 to-green-500/90 text-white border-emerald-400/50"
        : type === "error"
          ? "bg-gradient-to-r from-red-500/90 to-rose-500/90 text-white border-red-400/50"
          : "bg-gradient-to-r from-blue-500/90 to-cyan-500/90 text-white border-blue-400/50"
    }`
    toast.textContent = message
    document.body.appendChild(toast)

    setTimeout(() => {
      toast.style.opacity = "0"
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast)
        }
      }, 300)
    }, 4000)
  }, [])

  const fetchReviews = useCallback(
    async (reset = false) => {
      try {
        setLoading(true)
        const params = {
          ...filters,
          destination: searchQuery || filters.destination,
          limit: pagination.limit,
          offset: reset ? 0 : pagination.offset,
        }

        const response = await api.get("/reviews/public", { params })

        if (response.data.success) {
          const newReviews = response.data.reviews
          setReviews(reset ? newReviews : [...reviews, ...newReviews])
          setPagination(response.data.pagination)

          // Check favorite status for the new reviews if user is logged in
          if (user && newReviews.length > 0) {
            const reviewIds = newReviews.map((review) => review.id)
            try {
              const favResponse = await api.post("/reviews/favorites/check", { reviewIds })
              if (favResponse.data.success) {
                setFavorites((prev) => {
                  const newFavorites = new Set(prev)
                  favResponse.data.favoriteIds.forEach((id) => newFavorites.add(id))
                  return newFavorites
                })
              }
            } catch (error) {
              console.error("Error checking favorite status:", error)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching reviews:", error)
        showToast("Failed to load reviews", "error")
      } finally {
        setLoading(false)
      }
    },
    [filters, searchQuery, pagination.limit, pagination.offset, reviews, api, showToast, user],
  )

  const fetchDestinations = useCallback(async () => {
    try {
      const response = await api.get("/reviews/destinations")
      if (response.data.success) {
        setDestinations(response.data.destinations)
      }
    } catch (error) {
      console.error("Error fetching destinations:", error)
    }
  }, [api])

  const handleVote = async (reviewId, isHelpful) => {
    if (!user) {
      showToast("Please login to vote on reviews", "error")
      return
    }

    try {
      await api.post(`/reviews/${reviewId}/vote`, { is_helpful: isHelpful })
      showToast("Thank you for your feedback!", "success")

      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId ? { ...review, helpful_votes: review.helpful_votes + (isHelpful ? 1 : 0) } : review,
        ),
      )
    } catch (error) {
      console.error("Error voting on review:", error)
      showToast("Failed to record your vote", "error")
    }
  }

  const handleFavorite = async (reviewId) => {
    if (!user) {
      showToast("Please login to save favorites", "error")
      return
    }

    try {
      const isFavorited = favorites.has(reviewId)

      if (isFavorited) {
        // Remove from favorites
        await api.delete(`/reviews/${reviewId}/favorite`)
        setFavorites((prev) => {
          const newSet = new Set(prev)
          newSet.delete(reviewId)
          return newSet
        })
        showToast("Removed from favorites", "info")
      } else {
        // Add to favorites
        await api.post(`/reviews/${reviewId}/favorite`)
        setFavorites((prev) => new Set([...prev, reviewId]))
        showToast("Added to favorites!", "success")
      }
    } catch (error) {
      console.error("Error updating favorite:", error)
      if (error.response?.status === 400 && error.response?.data?.message === "Review already in favorites") {
        showToast("Review is already in your favorites", "info")
      } else if (error.response?.status === 404 && error.response?.data?.message === "Review not found in favorites") {
        showToast("Review was not in your favorites", "info")
      } else {
        showToast("Failed to update favorite", "error")
      }
    }
  }

  const handleShare = async (review) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: review.title,
          text: `Check out this amazing review of ${review.destination}!`,
          url: window.location.href,
        })
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href)
        showToast("Link copied to clipboard!", "success")
      }
    } catch (error) {
      console.error("Error sharing:", error)
      showToast("Failed to share", "error")
    }
  }

  const toggleExpandReview = (reviewId) => {
    setExpandedReviews((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId)
      } else {
        newSet.add(reviewId)
      }
      return newSet
    })
  }

  const openImageModal = (images, startIndex = 0) => {
    setSelectedImages({ images, currentIndex: startIndex })
    setShowImageModal(true)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return "text-emerald-600"
    if (rating >= 3.5) return "text-amber-600"
    if (rating >= 2.5) return "text-orange-600"
    return "text-red-600"
  }

  const travelStyleIcons = {
    solo: "🧳",
    couple: "💕",
    family: "👨‍👩‍👧‍👦",
    friends: "👥",
    group: "🎉",
    business: "💼",
  }

  useEffect(() => {
    fetchReviews(true)
    fetchDestinations()
  }, [])

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchReviews(true)
    }, 500)

    return () => clearTimeout(delayedSearch)
  }, [filters, searchQuery])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fillRule=evenodd%3E%3Cg fill=%23ffffff fillOpacity=0.1%3E%3Ccircle cx=30 cy=30 r=2/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-cyan-300/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-teal-300/20 rounded-full blur-xl animate-pulse delay-500"></div>

        <div className="relative container mx-auto px-6 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-5xl mx-auto"
          >
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-white/20 to-cyan-200/20 rounded-3xl flex items-center justify-center backdrop-blur-sm shadow-2xl border border-white/20">
                <Star className="w-12 h-12 text-yellow-300" />
              </div>
            </div>
            <h1 className="text-6xl md:text-7xl font-black mb-8 bg-gradient-to-r from-white via-cyan-100 to-teal-100 bg-clip-text text-transparent">
              Travel Reviews & Stories
            </h1>
            <p className="text-2xl text-cyan-100 mb-12 leading-relaxed max-w-3xl mx-auto">
              Discover authentic experiences from fellow travelers around the world and share your own adventures
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <motion.div
                className="text-center p-6 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-4xl font-bold mb-2">{destinations.length}+</div>
                <div className="text-cyan-100 flex items-center justify-center">
                  <Globe className="w-4 h-4 mr-2" />
                  Destinations
                </div>
              </motion.div>
              <motion.div
                className="text-center p-6 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-4xl font-bold mb-2">{reviews.length}+</div>
                <div className="text-cyan-100 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Reviews
                </div>
              </motion.div>
              <motion.div
                className="text-center p-6 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-4xl font-bold mb-2">4.8</div>
                <div className="text-cyan-100 flex items-center justify-center">
                  <Star className="w-4 h-4 mr-2" />
                  Avg Rating
                </div>
              </motion.div>
              <motion.div
                className="text-center p-6 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-4xl font-bold mb-2">98%</div>
                <div className="text-cyan-100 flex items-center justify-center">
                  <Award className="w-4 h-4 mr-2" />
                  Verified
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-16">
        {/* Enhanced Search and Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
            {/* Search Bar */}
            <div className="relative mb-8">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search destinations, experiences, or keywords..."
                className="w-full pl-16 pr-6 py-5 text-lg border-2 border-gray-200 dark:border-slate-700 rounded-2xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 transition-all bg-white dark:bg-slate-800 text-gray-800 dark:text-white shadow-lg"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Filter className="w-5 h-5" />
                <span>Advanced Filters</span>
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                  <TrendingUp className="w-5 h-5 text-cyan-500" />
                  <span className="font-semibold">{pagination.total} reviews found</span>
                </div>
              </div>
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-8 pt-8 border-t border-gray-200 dark:border-slate-700"
                >
                  <div className="grid md:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                        Destination
                      </label>
                      <select
                        value={filters.destination}
                        onChange={(e) => setFilters((prev) => ({ ...prev, destination: e.target.value }))}
                        className="w-full p-4 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 bg-white dark:bg-slate-800 text-gray-800 dark:text-white shadow-lg"
                      >
                        <option value="">All Destinations</option>
                        {destinations.map((dest) => (
                          <option key={dest.destination} value={dest.destination}>
                            {dest.destination} ({dest.review_count})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Rating</label>
                      <select
                        value={filters.rating}
                        onChange={(e) => setFilters((prev) => ({ ...prev, rating: e.target.value }))}
                        className="w-full p-4 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 bg-white dark:bg-slate-800 text-gray-800 dark:text-white shadow-lg"
                      >
                        <option value="">All Ratings</option>
                        <option value="5">⭐⭐⭐⭐⭐ (5 stars)</option>
                        <option value="4">⭐⭐⭐⭐ (4+ stars)</option>
                        <option value="3">⭐⭐⭐ (3+ stars)</option>
                        <option value="2">⭐⭐ (2+ stars)</option>
                        <option value="1">⭐ (1+ stars)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                        Travel Style
                      </label>
                      <select
                        value={filters.travel_style}
                        onChange={(e) => setFilters((prev) => ({ ...prev, travel_style: e.target.value }))}
                        className="w-full p-4 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 bg-white dark:bg-slate-800 text-gray-800 dark:text-white shadow-lg"
                      >
                        <option value="">All Styles</option>
                        <option value="solo">🧳 Solo Travel</option>
                        <option value="couple">💕 Couple</option>
                        <option value="family">👨‍👩‍👧‍👦 Family</option>
                        <option value="friends">👥 Friends</option>
                        <option value="group">🎉 Group</option>
                        <option value="business">💼 Business</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Sort By</label>
                      <select
                        value={`${filters.sort_by}_${filters.sort_order}`}
                        onChange={(e) => {
                          const [sort_by, sort_order] = e.target.value.split("_")
                          setFilters((prev) => ({ ...prev, sort_by, sort_order }))
                        }}
                        className="w-full p-4 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 bg-white dark:bg-slate-800 text-gray-800 dark:text-white shadow-lg"
                      >
                        <option value="created_at_DESC">Newest First</option>
                        <option value="created_at_ASC">Oldest First</option>
                        <option value="rating_DESC">Highest Rated</option>
                        <option value="rating_ASC">Lowest Rated</option>
                        <option value="helpful_count_DESC">Most Helpful</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Enhanced Reviews Grid */}
        <div className="space-y-8">
          {loading && reviews.length === 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-8 animate-pulse shadow-xl">
                  <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded-xl mb-6"></div>
                  <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded-xl mb-6"></div>
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-24">
              <div className="w-40 h-40 mx-auto mb-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl">
                <Search className="w-20 h-20 text-white" />
              </div>
              <h3 className="text-4xl font-bold text-gray-800 dark:text-white mb-6">No Reviews Found</h3>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
                Try adjusting your search criteria or check back later for new reviews from fellow travelers!
              </p>
              <button
                onClick={() => {
                  setSearchQuery("")
                  setFilters({
                    destination: "",
                    rating: "",
                    travel_style: "",
                    sort_by: "created_at",
                    sort_order: "DESC",
                  })
                }}
                className="px-12 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-2xl font-semibold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              >
                Clear All Filters
              </button>
            </motion.div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {reviews.map((review, index) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300"
                  >
                    {/* Review Header */}
                    <div className="p-8 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-cyan-50/50 to-blue-50/50 dark:from-slate-800/50 dark:to-slate-700/50">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-xl">{review.user_name?.charAt(0) || "U"}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 dark:text-white text-lg">
                              {review.user_name || "Anonymous"}
                            </h4>
                            <p className="text-gray-500 dark:text-gray-400 flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(review.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 bg-white/80 dark:bg-slate-800/80 rounded-xl px-3 py-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300 dark:text-gray-600"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-2 bg-white/60 dark:bg-slate-800/60 rounded-lg px-3 py-2">
                          <MapPin className="w-4 h-4 text-cyan-500" />
                          <span className="font-medium">{review.destination}</span>
                        </div>
                        {review.travel_style && (
                          <div className="flex items-center space-x-2 bg-white/60 dark:bg-slate-800/60 rounded-lg px-3 py-2">
                            <span>{travelStyleIcons[review.travel_style] || "🧳"}</span>
                            <span className="capitalize font-medium">{review.travel_style}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Review Content */}
                    <div className="p-8">
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 line-clamp-2">
                        {review.title}
                      </h3>

                      <p
                        className={`text-gray-600 dark:text-gray-300 leading-relaxed mb-6 ${
                          expandedReviews.has(review.id) ? "" : "line-clamp-3"
                        }`}
                      >
                        {review.review_text}
                      </p>

                      {review.review_text.length > 150 && (
                        <button
                          onClick={() => toggleExpandReview(review.id)}
                          className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline mb-4 flex items-center space-x-1"
                        >
                          <span>{expandedReviews.has(review.id) ? "Show Less" : "Read More"}</span>
                          <Zap className="w-4 h-4" />
                        </button>
                      )}

                      {/* Images */}
                      {review.images && review.images.length > 0 && (
                        <div className="mb-6">
                          <div className="grid grid-cols-3 gap-3">
                            {review.images.slice(0, 3).map((image, imgIndex) => (
                              <div
                                key={imgIndex}
                                className="relative cursor-pointer group/img overflow-hidden rounded-xl"
                                onClick={() => openImageModal(review.images, imgIndex)}
                              >
                                <img
                                  src={image || "/placeholder.svg"}
                                  alt={`Review image ${imgIndex + 1}`}
                                  className="w-full h-24 object-cover group-hover/img:scale-110 transition-transform duration-300 shadow-lg"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity">
                                  <Camera className="absolute bottom-2 right-2 w-4 h-4 text-white" />
                                </div>
                                {imgIndex === 2 && review.images.length > 3 && (
                                  <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">+{review.images.length - 3}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Highlights */}
                      {review.highlights && review.highlights.length > 0 && (
                        <div className="mb-6">
                          <div className="flex flex-wrap gap-2">
                            {review.highlights.slice(0, 3).map((highlight, idx) => (
                              <span
                                key={idx}
                                className="bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full text-sm font-medium shadow-sm border border-amber-200 dark:border-amber-800"
                              >
                                {highlight}
                              </span>
                            ))}
                            {review.highlights.length > 3 && (
                              <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1 rounded-full text-sm font-medium border border-gray-200 dark:border-gray-700">
                                +{review.highlights.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Trip Details */}
                      <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                        {review.trip_duration && (
                          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                            <Clock className="w-4 h-4 text-cyan-500" />
                            <span className="font-medium">{review.trip_duration} days</span>
                          </div>
                        )}
                        {review.budget_spent && (
                          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                            <DollarSign className="w-4 h-4 text-emerald-500" />
                            <span className="font-medium">₹{(review.budget_spent / 1000).toFixed(0)}K</span>
                          </div>
                        )}
                      </div>

                      {/* Tips */}
                      {review.tips && expandedReviews.has(review.id) && (
                        <div className="mb-6 p-6 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-2xl border border-cyan-200 dark:border-cyan-800">
                          <div className="flex items-start space-x-3">
                            <Lightbulb className="w-6 h-6 text-cyan-600 dark:text-cyan-400 mt-1 flex-shrink-0" />
                            <div>
                              <h5 className="font-bold text-cyan-800 dark:text-cyan-300 mb-2">Traveler's Tip</h5>
                              <p className="text-cyan-700 dark:text-cyan-200">{review.tips}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Review Footer */}
                    <div className="px-8 pb-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <button
                            onClick={() => handleVote(review.id, true)}
                            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group/vote bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2"
                          >
                            <ThumbsUp className="w-5 h-5 group-hover/vote:scale-110 transition-transform" />
                            <span className="font-medium">{review.helpful_votes || 0}</span>
                          </button>

                          {review.would_recommend && (
                            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2">
                              <CheckCircle className="w-5 h-5" />
                              <span className="font-medium">Recommends</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleFavorite(review.id)}
                            className={`p-2 rounded-lg transition-all hover:scale-110 transform ${
                              favorites.has(review.id)
                                ? "text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                                : "text-gray-400 hover:text-red-500 bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700"
                            }`}
                          >
                            <Heart className={`w-5 h-5 ${favorites.has(review.id) ? "fill-current" : ""}`} />
                          </button>
                          <button
                            onClick={() => handleShare(review)}
                            className="p-2 text-gray-400 hover:text-blue-500 transition-colors hover:scale-110 transform bg-slate-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700"
                          >
                            <Share2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Load More Button */}
              {pagination.hasMore && (
                <div className="text-center mt-16">
                  <button
                    onClick={() => {
                      setPagination((prev) => ({ ...prev, offset: prev.offset + prev.limit }))
                      fetchReviews(false)
                    }}
                    disabled={loading}
                    className="px-12 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-2xl font-semibold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Loading More Reviews...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Eye className="w-5 h-5" />
                        <span>Load More Reviews</span>
                      </div>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Enhanced Image Modal */}
      {showImageModal && selectedImages && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-6xl w-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-6 right-6 p-3 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors z-10 backdrop-blur-sm"
            >
              <X className="w-8 h-8" />
            </button>

            <img
              src={selectedImages.images[selectedImages.currentIndex] || "/placeholder.svg"}
              alt="Review image"
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />

            {selectedImages.images.length > 1 && (
              <div className="flex justify-center mt-6 space-x-3">
                {selectedImages.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImages((prev) => ({ ...prev, currentIndex: index }))}
                    className={`w-4 h-4 rounded-full transition-all ${
                      index === selectedImages.currentIndex ? "bg-white scale-125" : "bg-white/50 hover:bg-white/75"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ReviewsPage
