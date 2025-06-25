"use client"

import { useState } from "react"
import {
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Star,
  Heart,
  Clock,
  CheckCircle,
  PlayCircle,
  MoreVertical,
  Share2,
  Edit3,
} from "lucide-react"
import VisibilityToggle from "./VisibilityToggle"
import PublicBadge from "./PublicBadge"

const TripCard = ({
  trip,
  onToggleVisibility,
  onToggleFavorite,
  onViewDetails,
  onEdit,
  currentUserId,
  theme = "dark",
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  // Calculate trip progress
  const getProgress = () => {
    if (trip.progress_stats) {
      return trip.progress_stats.percentage || 0
    }

    const now = new Date()
    const startDate = new Date(trip.start_date)
    const endDate = new Date(trip.end_date)

    if (now < startDate) return 0
    if (now > endDate) return 100

    const totalDuration = endDate - startDate
    const elapsed = now - startDate
    return Math.round((elapsed / totalDuration) * 100)
  }

  // Get status info
  const getStatusInfo = () => {
    const progress = getProgress()
    const now = new Date()
    const startDate = new Date(trip.start_date)
    const endDate = new Date(trip.end_date)

    if (progress === 100 || now > endDate) {
      return {
        status: "Completed",
        color: "from-emerald-500 to-green-400",
        bgColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        icon: CheckCircle,
      }
    } else if (progress > 0 || (now >= startDate && now <= endDate)) {
      return {
        status: "Active",
        color: "from-cyan-500 to-blue-400",
        bgColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
        icon: PlayCircle,
      }
    } else {
      return {
        status: "Planning",
        color: "from-yellow-500 to-orange-400",
        bgColor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        icon: Clock,
      }
    }
  }

  // Format date range
  const formatDateRange = () => {
    const start = new Date(trip.start_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
    const end = new Date(trip.end_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    return `${start} - ${end}`
  }

  // Get progress color
  const getProgressColor = () => {
    const progress = getProgress()
    if (progress === 100) return "from-emerald-500 to-green-400"
    if (progress > 50) return "from-cyan-500 to-blue-400"
    if (progress > 0) return "from-yellow-500 to-orange-400"
    return "from-slate-500 to-slate-400"
  }

  // Handle visibility change
  const handleVisibilityChange = (tripId, isPublic, updatedTrip) => {
    if (onToggleVisibility) {
      onToggleVisibility(tripId, isPublic, updatedTrip)
    }
  }

  const statusInfo = getStatusInfo()
  const progress = getProgress()
  const isPublic = trip.is_public || trip.visibility === "public"

  const themeClasses = {
    card:
      theme === "light"
        ? "bg-white/90 border-gray-200/50 shadow-xl hover:shadow-2xl"
        : "bg-slate-900/50 border-slate-700/50 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/10",
    text: theme === "light" ? "text-gray-900" : "text-slate-100",
    secondaryText: theme === "light" ? "text-gray-600" : "text-slate-400",
    accent: theme === "light" ? "text-blue-600" : "text-cyan-400",
  }

  return (
    <div
      className={`
        relative group ${themeClasses.card} rounded-2xl border backdrop-blur-sm
        transform transition-all duration-300 hover:scale-105 cursor-pointer
        overflow-hidden
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewDetails?.(trip)}
    >
      {/* Background Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={
            trip.thumbnail_url || `https://source.unsplash.com/800x400/?${encodeURIComponent(trip.destination)},travel`
          }
          alt={trip.destination}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            e.target.src = "/placeholder.svg?height=192&width=400"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

        {/* Top badges */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <div className="flex space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusInfo.bgColor} backdrop-blur-sm border`}>
              {statusInfo.status}
            </span>
            {trip.is_favorite && (
              <div className="p-2 bg-pink-500/20 backdrop-blur-sm rounded-full border border-pink-500/30">
                <Heart className="h-4 w-4 text-pink-400 fill-current" />
              </div>
            )}
            {/* Public Badge - INTEGRATED */}
            {isPublic && <PublicBadge />}
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-2 bg-black/20 backdrop-blur-sm rounded-full border border-white/20 hover:bg-black/40 transition-colors"
            >
              <MoreVertical className="h-4 w-4 text-white" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-12 bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-xl p-2 min-w-[160px] z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit?.(trip)
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit Trip</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    // Handle share
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share Trip</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Destination */}
        <div className="absolute bottom-4 left-4">
          <h3 className="text-2xl font-bold text-white mb-1">{trip.destination}</h3>
          <div className="flex items-center text-cyan-300">
            <MapPin className="w-4 h-4 mr-1" />
            <span className="text-sm">{formatDateRange()}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Progress Bar */}
        {progress > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm ${themeClasses.secondaryText} font-medium`}>Trip Progress</span>
              <span
                className={`text-sm font-bold bg-gradient-to-r ${getProgressColor()} bg-clip-text text-transparent`}
              >
                {progress}%
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${getProgressColor()} transition-all duration-500 ease-out`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Trip Details */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className={`flex items-center ${themeClasses.secondaryText}`}>
            <Calendar className="w-4 h-4 mr-2" />
            <span className="text-sm">{trip.days} days</span>
          </div>
          <div className={`flex items-center ${themeClasses.secondaryText}`}>
            <DollarSign className="w-4 h-4 mr-2" />
            <span className="text-sm">₹{(Number(trip.budget) / 1000).toFixed(0)}K</span>
          </div>
          <div className={`flex items-center ${themeClasses.secondaryText}`}>
            <Users className="w-4 h-4 mr-2" />
            <span className="text-sm">{trip.travelers_joined || trip.travelers || 1} travelers</span>
          </div>
          <div className={`flex items-center ${theme === "dark" ? "text-yellow-400" : "text-yellow-600"}`}>
            <Star className="w-4 h-4 mr-2" />
            <span className="text-sm">{(trip.rating || 4.5).toFixed(1)}</span>
          </div>
        </div>

        {/* Tags */}
        {trip.tags && trip.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {trip.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-slate-800/50 text-slate-300 text-xs rounded-full border border-slate-700/50"
                >
                  {tag}
                </span>
              ))}
              {trip.tags.length > 3 && (
                <span className="px-2 py-1 bg-slate-800/50 text-slate-400 text-xs rounded-full border border-slate-700/50">
                  +{trip.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-700/30">
          {/* Visibility Toggle - INTEGRATED */}
          <VisibilityToggle trip={trip} onVisibilityChange={handleVisibilityChange} />

          {/* Favorite Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite?.(trip)
            }}
            className={`p-2 rounded-lg transition-all duration-200 ${
              trip.is_favorite
                ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-pink-400 hover:border-pink-500/30"
            }`}
          >
            <Heart className={`h-4 w-4 ${trip.is_favorite ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>

      {/* Hover Effect */}
      {isHovered && (
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-2xl pointer-events-none" />
      )}
    </div>
  )
}

export default TripCard
