"use client"

import { useState, useMemo } from "react"
import { Search, Users, MapPin, Star, RefreshCw, SlidersHorizontal } from "lucide-react"
import TravelerCard from "./TravelerCard"

const TravelerCardGrid = ({
  travelers = [],
  onStartChat,
  onViewProfile,
  currentUserId,
  onRefresh,
  isLoading = false,
  theme = "dark",
}) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("compatibility") // compatibility, distance, recent
  const [filterBy, setFilterBy] = useState("all") // all, nearby, high_match
  const [showFilters, setShowFilters] = useState(false)

  // Filter and sort travelers
  const filteredAndSortedTravelers = useMemo(() => {
    let filtered = travelers

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (traveler) =>
          traveler.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          traveler.current_location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          traveler.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          traveler.interests?.some((interest) => interest.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Apply category filter
    switch (filterBy) {
      case "nearby":
        filtered = filtered.filter((t) => t.distance && t.distance <= 50)
        break
      case "high_match":
        filtered = filtered.filter((t) => t.compatibility_score >= 70)
        break
      case "planning_live":
        filtered = filtered.filter((t) => t.status === "planning_live")
        break
      default:
        break
    }

    // Apply sorting
    switch (sortBy) {
      case "compatibility":
        filtered.sort((a, b) => (b.compatibility_score || 0) - (a.compatibility_score || 0))
        break
      case "distance":
        filtered.sort((a, b) => (a.distance || 999) - (b.distance || 999))
        break
      case "recent":
        filtered.sort((a, b) => new Date(b.last_active || 0) - new Date(a.last_active || 0))
        break
      default:
        break
    }

    return filtered
  }, [travelers, searchQuery, sortBy, filterBy])

  const themeClasses = {
    background: theme === "light" ? "bg-gray-50" : "bg-slate-900/30",
    card: theme === "light" ? "bg-white border-gray-200" : "bg-slate-900/50 border-slate-700/50",
    text: theme === "light" ? "text-gray-900" : "text-slate-100",
    secondaryText: theme === "light" ? "text-gray-600" : "text-slate-400",
    accent: theme === "light" ? "text-blue-600" : "text-cyan-400",
    button: theme === "light" ? "bg-blue-50 hover:bg-blue-100" : "bg-slate-800/50 hover:bg-slate-700/50",
  }

  const filterOptions = [
    { value: "all", label: "All Travelers", icon: Users },
    { value: "nearby", label: "Nearby (50km)", icon: MapPin },
    { value: "high_match", label: "High Match (70%+)", icon: Star },
    { value: "planning_live", label: "Planning Live", icon: RefreshCw },
  ]

  const sortOptions = [
    { value: "compatibility", label: "Best Match" },
    { value: "distance", label: "Nearest" },
    { value: "recent", label: "Recently Active" },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading Header */}
        <div className="flex items-center justify-between">
          <div className="h-8 bg-slate-700/50 rounded-lg w-48 animate-pulse" />
          <div className="h-10 bg-slate-700/50 rounded-lg w-32 animate-pulse" />
        </div>

        {/* Loading Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`${themeClasses.card} rounded-2xl border p-6 animate-pulse`}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-16 h-16 bg-slate-700/50 rounded-2xl" />
                <div className="h-6 bg-slate-700/50 rounded-full w-20" />
              </div>
              <div className="space-y-3">
                <div className="h-6 bg-slate-700/50 rounded w-3/4" />
                <div className="h-4 bg-slate-700/50 rounded w-full" />
                <div className="h-4 bg-slate-700/50 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <h2 className={`text-2xl font-bold ${themeClasses.text}`}>Travel Matches</h2>
          <div
            className={`px-3 py-1 ${themeClasses.card} rounded-full border text-sm font-medium ${themeClasses.secondaryText}`}
          >
            {filteredAndSortedTravelers.length} found
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className={`p-2 ${themeClasses.button} border rounded-lg hover:${themeClasses.accent} transition-colors`}
            title="Refresh matches"
          >
            <RefreshCw className="h-5 w-5" />
          </button>

          {/* Search */}
          <div className="relative">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${themeClasses.secondaryText}`}
            />
            <input
              type="text"
              placeholder="Search travelers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 pr-4 py-2 ${themeClasses.card} border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${themeClasses.text} placeholder:${themeClasses.secondaryText} w-64`}
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 ${themeClasses.button} border rounded-lg hover:${themeClasses.accent} transition-colors`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="text-sm font-medium">Filters</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className={`${themeClasses.card} border rounded-xl p-6 backdrop-blur-sm`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Filter By */}
            <div>
              <label className={`block text-sm font-medium ${themeClasses.text} mb-3`}>Filter By</label>
              <div className="grid grid-cols-2 gap-2">
                {filterOptions.map((option) => {
                  const IconComponent = option.icon
                  return (
                    <button
                      key={option.value}
                      onClick={() => setFilterBy(option.value)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filterBy === option.value
                          ? `${themeClasses.accent} bg-cyan-500/10 border border-cyan-500/30`
                          : `${themeClasses.secondaryText} hover:${themeClasses.text} ${themeClasses.button}`
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span>{option.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className={`block text-sm font-medium ${themeClasses.text} mb-3`}>Sort By</label>
              <div className="space-y-2">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      sortBy === option.value
                        ? `${themeClasses.accent} bg-cyan-500/10 border border-cyan-500/30`
                        : `${themeClasses.secondaryText} hover:${themeClasses.text} ${themeClasses.button}`
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Grid */}
      {filteredAndSortedTravelers.length === 0 ? (
        <div className={`${themeClasses.card} border rounded-2xl p-12 text-center backdrop-blur-sm`}>
          <Users className={`h-16 w-16 ${themeClasses.secondaryText} mx-auto mb-4`} />
          <h3 className={`text-xl font-semibold ${themeClasses.text} mb-2`}>No travelers found</h3>
          <p className={`${themeClasses.secondaryText} mb-6`}>
            {searchQuery.trim() || filterBy !== "all"
              ? "Try adjusting your search or filters"
              : "Be the first to start planning and discover fellow travelers!"}
          </p>
          {(searchQuery.trim() || filterBy !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("")
                setFilterBy("all")
              }}
              className={`px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-600 transition-all duration-200`}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedTravelers.map((traveler) => (
            <TravelerCard
              key={traveler.user_id}
              traveler={traveler}
              onStartChat={() => onStartChat(traveler)}
              onViewProfile={() => onViewProfile(traveler)}
              currentUserId={currentUserId}
              theme={theme}
            />
          ))}
        </div>
      )}

      {/* Load More Button (if needed) */}
      {filteredAndSortedTravelers.length > 0 && filteredAndSortedTravelers.length % 12 === 0 && (
        <div className="text-center">
          <button
            onClick={onRefresh}
            className={`px-8 py-3 ${themeClasses.button} border rounded-xl font-medium hover:${themeClasses.accent} transition-colors`}
          >
            Load More Travelers
          </button>
        </div>
      )}
    </div>
  )
}

export default TravelerCardGrid
