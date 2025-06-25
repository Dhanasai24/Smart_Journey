"use client"

import { createContext, useContext, useState, useEffect } from "react"

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first, default to dark
    if (typeof window !== "undefined") {
      return localStorage.getItem("smart-journey-theme") || "dark"
    }
    return "dark"
  })

  useEffect(() => {
    // Save theme to localStorage whenever it changes
    localStorage.setItem("smart-journey-theme", theme)

    // Apply theme to document root for global CSS
    document.documentElement.setAttribute("data-theme", theme)

    // Add theme class to body for additional styling
    document.body.className = theme
  }, [theme])

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"))
  }

  // Enhanced theme classes for consistent styling across all components
  const getThemeClasses = () => ({
    // Backgrounds
    background:
      theme === "dark"
        ? "bg-gradient-to-br from-black via-slate-900 to-slate-800"
        : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50",

    // Cards and containers
    card:
      theme === "dark"
        ? "bg-slate-900/50 border-slate-700/50 backdrop-blur-sm"
        : "bg-white/80 border-white/60 shadow-xl backdrop-blur-sm",

    cardContent: theme === "dark" ? "bg-slate-800/50 border-slate-600/50" : "bg-white/70 border-gray-200/50",

    // Text colors
    primaryText: theme === "dark" ? "text-slate-100" : "text-gray-800",
    secondaryText: theme === "dark" ? "text-slate-400" : "text-gray-600",
    accentText: theme === "dark" ? "text-cyan-400" : "text-blue-600",

    // Interactive elements
    border: theme === "dark" ? "border-slate-700/50" : "border-gray-200/50",
    hover: theme === "dark" ? "hover:bg-slate-800/50" : "hover:bg-gray-50",

    // Buttons
    primaryButton:
      theme === "dark"
        ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
        : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",

    secondaryButton:
      theme === "dark"
        ? "bg-slate-800/50 border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
        : "bg-white/70 border-gray-200/50 text-gray-700 hover:bg-gray-50",

    // Input fields
    input:
      theme === "dark"
        ? "bg-slate-800/50 border-slate-600/50 text-slate-100 placeholder:text-slate-400"
        : "bg-white/70 border-gray-200/50 text-gray-800 placeholder:text-gray-500",

    // Status badges
    successBadge:
      theme === "dark"
        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
        : "bg-emerald-100 text-emerald-700 border-emerald-300",

    activeBadge:
      theme === "dark"
        ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50"
        : "bg-blue-100 text-blue-700 border-blue-300",

    warningBadge:
      theme === "dark"
        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
        : "bg-yellow-100 text-yellow-700 border-yellow-300",

    // Grid and patterns
    gridPattern:
      theme === "dark"
        ? "bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20"
        : "bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:50px_50px] opacity-30",
  })

  const value = {
    theme,
    toggleTheme,
    getThemeClasses,
    isDark: theme === "dark",
    isLight: theme === "light",
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
