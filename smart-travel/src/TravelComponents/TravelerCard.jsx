"use client"

import { useState } from "react"
import { MapPin, Heart, MessageCircle, Star, Users, Zap, Globe, Camera, Coffee, Mountain, Plane } from "lucide-react"

const TravelerCard = ({ traveler, onStartChat, onViewProfile, currentUserId, theme = "dark" }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Parse interests safely
  const interests = traveler.interests ? JSON.parse(traveler.interests) : []
  const matchFactors = traveler.match_factors || []

  // Get interest icons
  const getInterestIcon = (interest) => {
    const iconMap = {
      adventure: Mountain,
      photography: Camera,
      food: Coffee,
      culture: Globe,
      travel: Plane,
      hiking: Mountain,
      art: Star,
      music: Star,
      sports: Users,
      nature: Mountain,
    }
    return iconMap[interest.toLowerCase()] || Star
  }

  // Get compatibility color
  const getCompatibilityColor = (score) => {
    if (score >= 80) return "from-emerald-500 to-green-400"
    if (score >= 60) return "from-cyan-500 to-blue-400"
    if (score >= 40) return "from-yellow-500 to-orange-400"
    return "from-red-500 to-pink-400"
  }

  // Get status badge
  const getStatusBadge = () => {
    const statusConfig = {
      discoverable: { label: "Available", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
      planning_live: { label: "Planning Live", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
      hidden: { label: "Busy", color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
    }

    const config = statusConfig[traveler.status] || statusConfig.discoverable
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${config.color} backdrop-blur-sm`}>
        {config.label}
      </span>
    )
  }

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
      onClick={() => onViewProfile?.(traveler)}
    >
      {/* Background Gradient Effect */}
      <div
        className={`
        absolute inset-0 bg-gradient-to-br ${getCompatibilityColor(traveler.compatibility_score)} 
        opacity-5 group-hover:opacity-10 transition-opacity duration-300
      `}
      />

      {/* Header with Avatar and Status */}
      <div className="relative p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5">
              <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-900">
                {traveler.avatar_url ? (
                  <img
                    src={traveler.avatar_url || "/placeholder.svg"}
                    alt={traveler.display_name}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                    onLoad={() => setImageLoaded(true)}
                    onError={(e) => {
                      e.target.style.display = "none"
                      setImageLoaded(false)
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{traveler.display_name?.charAt(0) || "T"}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Online Status Indicator */}
            <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse" />
          </div>

          {/* Status Badge */}
          <div className="flex flex-col items-end space-y-2">
            {getStatusBadge()}
            {traveler.distance && (
              <div className="flex items-center space-x-1 text-xs text-slate-400">
                <MapPin className="h-3 w-3" />
                <span>{traveler.distance}km away</span>
              </div>
            )}
          </div>
        </div>

        {/* Name and Bio */}
        <div className="mb-4">
          <h3 className={`text-xl font-bold ${themeClasses.text} mb-1`}>
            {traveler.display_name || `User ${traveler.user_id}`}
          </h3>
          {traveler.bio && <p className={`text-sm ${themeClasses.secondaryText} line-clamp-2`}>{traveler.bio}</p>}
        </div>

        {/* Location */}
        {traveler.current_location && (
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className={`h-4 w-4 ${themeClasses.accent}`} />
            <span className={`text-sm ${themeClasses.secondaryText}`}>{traveler.current_location}</span>
          </div>
        )}
      </div>

      {/* Compatibility Score */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between mb-3">
          <span className={`text-sm font-medium ${themeClasses.secondaryText}`}>Compatibility</span>
          <span
            className={`text-lg font-bold bg-gradient-to-r ${getCompatibilityColor(traveler.compatibility_score)} bg-clip-text text-transparent`}
          >
            {traveler.compatibility_score}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${getCompatibilityColor(traveler.compatibility_score)} transition-all duration-500 ease-out`}
            style={{ width: `${traveler.compatibility_score}%` }}
          />
        </div>
      </div>

      {/* Interests */}
      {interests.length > 0 && (
        <div className="px-6 pb-4">
          <div className={`text-sm font-medium ${themeClasses.secondaryText} mb-3`}>Shared Interests</div>
          <div className="flex flex-wrap gap-2">
            {interests.slice(0, 4).map((interest, index) => {
              const InterestIcon = getInterestIcon(interest)
              return (
                <div
                  key={index}
                  className="flex items-center space-x-1 px-3 py-1 bg-slate-800/50 rounded-full border border-slate-700/50"
                >
                  <InterestIcon className="h-3 w-3 text-cyan-400" />
                  <span className="text-xs text-slate-300 capitalize">{interest}</span>
                </div>
              )
            })}
            {interests.length > 4 && (
              <div className="flex items-center px-3 py-1 bg-slate-800/50 rounded-full border border-slate-700/50">
                <span className="text-xs text-slate-400">+{interests.length - 4} more</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Match Factors */}
      {matchFactors.length > 0 && (
        <div className="px-6 pb-4">
          <div className={`text-sm font-medium ${themeClasses.secondaryText} mb-2`}>Why you match</div>
          <div className="space-y-1">
            {matchFactors.slice(0, 2).map((factor, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Zap className="h-3 w-3 text-yellow-400 flex-shrink-0" />
                <span className="text-xs text-slate-300">{factor}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-6 pb-6">
        <div className="flex space-x-3">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onStartChat?.(traveler)
            }}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/25"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Chat</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              // Handle like/favorite action
            }}
            className="px-4 py-3 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-pink-500/50 rounded-xl transition-all duration-200 group"
          >
            <Heart className="h-4 w-4 text-slate-400 group-hover:text-pink-400 transition-colors" />
          </button>
        </div>
      </div>

      {/* Hover Effect Overlay */}
      {isHovered && (
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-2xl pointer-events-none" />
      )}
    </div>
  )
}

export default TravelerCard
