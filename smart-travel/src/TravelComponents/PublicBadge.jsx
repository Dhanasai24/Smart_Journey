"use client"

import { motion } from "framer-motion"
import { Globe } from "lucide-react"

const PublicBadge = ({ className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        relative px-3 py-1 rounded-full text-green-400 bg-green-500/20 
        border border-green-500/50 backdrop-blur-sm ${className}
      `}
    >
      <div className="flex items-center space-x-1">
        <Globe className="w-3 h-3" />
        <span className="text-xs font-bold">PUBLIC</span>
      </div>

      {/* Pulse effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-green-400/20"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  )
}

export default PublicBadge
