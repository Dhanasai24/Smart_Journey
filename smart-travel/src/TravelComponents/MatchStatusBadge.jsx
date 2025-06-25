"use client"

import { useState } from "react"
import { Eye, EyeOff, MapPin, Users, RefreshCw } from "lucide-react"

const MatchStatusBadge = ({ status, onStatusChange, matchCount = 0, isConnected = false, onRefresh }) => {
  const [showDropdown, setShowDropdown] = useState(false)

  const statusConfig = {
    discoverable: {
      label: "Discoverable",
      color: "from-emerald-500 to-green-500",
      bgColor: "bg-emerald-500/10",
      textColor: "text-emerald-400",
      borderColor: "border-emerald-500/30",
      icon: Eye,
      description: "Visible to other travelers",
    },
    planning_live: {
      label: "Planning Live",
      color: "from-cyan-500 to-blue-500",
      bgColor: "bg-cyan-500/10",
      textColor: "text-cyan-400",
      borderColor: "border-cyan-500/30",
      icon: MapPin,
      description: "Actively planning trips",
    },
    hidden: {
      label: "Hidden",
      color: "from-slate-500 to-gray-500",
      bgColor: "bg-slate-500/10",
      textColor: "text-slate-400",
      borderColor: "border-slate-500/30",
      icon: EyeOff,
      description: "Not visible to others",
    },
    offline: {
      label: "Offline",
      color: "from-red-500 to-pink-500",
      bgColor: "bg-red-500/10",
      textColor: "text-red-400",
      borderColor: "border-red-500/30",
      icon: EyeOff,
      description: "Currently offline",
    },
  }

  const currentStatus = statusConfig[status] || statusConfig.discoverable
  const StatusIcon = currentStatus.icon

  const handleStatusChange = (newStatus) => {
    onStatusChange(newStatus)
    setShowDropdown(false)
  }

  return (
    <div className="relative">
      {/* Main Status Badge */}
      <div
        className={`
          flex items-center space-x-3 px-4 py-3 rounded-xl border backdrop-blur-sm
          ${currentStatus.bgColor} ${currentStatus.borderColor}
          hover:scale-105 transition-all duration-200 cursor-pointer
          shadow-lg hover:shadow-xl
        `}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {/* Connection Status Indicator */}
        <div className="relative">
          <StatusIcon className={`h-5 w-5 ${currentStatus.textColor}`} />
          <div
            className={`
              absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-slate-900
              ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}
            `}
          />
        </div>

        {/* Status Info */}
        <div className="flex-1">
          <div className={`font-semibold text-sm ${currentStatus.textColor}`}>{currentStatus.label}</div>
          <div className="text-xs text-slate-400">{matchCount} matches found</div>
        </div>

        {/* Live Indicator */}
        {status === "planning_live" && (
          <div className="flex items-center space-x-1">
            <div className="h-2 w-2 bg-cyan-400 rounded-full animate-pulse" />
            <span className="text-xs text-cyan-400 font-medium">LIVE</span>
          </div>
        )}

        {/* Dropdown Arrow */}
        <div className={`transform transition-transform ${showDropdown ? "rotate-180" : ""}`}>
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-200">Travel Status</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRefresh?.()
                }}
                className="p-1 hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                <RefreshCw className="h-4 w-4 text-slate-400 hover:text-cyan-400" />
              </button>
            </div>
          </div>

          {/* Status Options */}
          <div className="py-2">
            {Object.entries(statusConfig).map(([key, config]) => {
              if (key === "offline") return null // Don't show offline as selectable option

              const Icon = config.icon
              const isActive = status === key

              return (
                <button
                  key={key}
                  onClick={() => handleStatusChange(key)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 hover:bg-slate-800/50 transition-colors
                    ${isActive ? "bg-slate-800/30" : ""}
                  `}
                >
                  <Icon className={`h-4 w-4 ${config.textColor}`} />
                  <div className="flex-1 text-left">
                    <div className={`text-sm font-medium ${isActive ? config.textColor : "text-slate-200"}`}>
                      {config.label}
                    </div>
                    <div className="text-xs text-slate-400">{config.description}</div>
                  </div>
                  {isActive && <div className="h-2 w-2 bg-cyan-400 rounded-full" />}
                </button>
              )
            })}
          </div>

          {/* Quick Actions */}
          <div className="border-t border-slate-700/50 px-4 py-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <Users className="h-3 w-3" />
                <span>{matchCount} active matches</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
                <span>{isConnected ? "Connected" : "Disconnected"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showDropdown && <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />}
    </div>
  )
}

export default MatchStatusBadge
