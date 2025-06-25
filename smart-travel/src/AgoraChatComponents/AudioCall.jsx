"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "../assets/Context/AuthContext"
import { useTheme } from "../assets/Context/ThemeContext"
import AgoraRTCService from "../assets/Services/Agora/AgoraRTCService"
import AgoraTokenService from "../assets/Services/Agora/AgoraTokenService"
import { generateCallChannelName } from "../assets/Services/Agora/AgoraConfig"
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, ArrowLeft, Loader, Wifi, WifiOff } from "lucide-react"

const AudioCall = ({ otherUserId, onEndCall, isIncoming = false, autoStart = false }) => {
  const { user } = useAuth()
  const { theme, getThemeClasses } = useTheme()
  const themeClasses = getThemeClasses()

  // State management
  const [callState, setCallState] = useState("idle") // idle, connecting, connected, ended
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [callDuration, setCallDuration] = useState(0)
  const [connectionQuality, setConnectionQuality] = useState("good")
  const [remoteUsers, setRemoteUsers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Refs
  const callStartTimeRef = useRef(null)
  const durationIntervalRef = useRef(null)
  const channelName = generateCallChannelName(user.id, otherUserId, "audio")

  // ✅ Auto-start call if autoStart prop is true
  useEffect(() => {
    if (autoStart && callState === "idle") {
      startCall()
    }
  }, [autoStart])

  // Setup call duration timer
  useEffect(() => {
    if (callState === "connected" && !durationIntervalRef.current) {
      callStartTimeRef.current = Date.now()
      durationIntervalRef.current = setInterval(() => {
        if (callStartTimeRef.current) {
          setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000))
        }
      }, 1000)
    } else if (callState !== "connected" && durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
    }
  }, [callState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall()
    }
  }, [])

  // Start audio call
  const startCall = async () => {
    try {
      setIsLoading(true)
      setCallState("connecting")
      setError(null)

      console.log(`🎧 Starting audio call with user ${otherUserId}`)

      // Get RTC token
      const token = await AgoraTokenService.generateRTCToken(channelName, user.id, "publisher")

      // Setup event listeners
      setupEventListeners()

      // Join channel
      await AgoraRTCService.joinChannel(channelName, user.id, token)

      // Start local audio
      await AgoraRTCService.startLocalAudio()

      setCallState("connected")
      setIsLoading(false)

      console.log("✅ Audio call started successfully")
    } catch (error) {
      console.error("❌ Failed to start audio call:", error)
      setError("Failed to start call. Please check your microphone permissions.")
      setCallState("ended")
      setIsLoading(false)
    }
  }

  // End audio call
  const endCall = async () => {
    try {
      console.log("📞 Ending audio call")

      // Clear duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
        durationIntervalRef.current = null
      }

      // Leave channel and cleanup
      await AgoraRTCService.leaveChannel()

      setCallState("ended")
      setRemoteUsers([])
      setCallDuration(0)

      // Notify parent component
      setTimeout(() => {
        onEndCall?.()
      }, 1000)

      console.log("✅ Audio call ended")
    } catch (error) {
      console.error("❌ Failed to end audio call:", error)
      onEndCall?.()
    }
  }

  // Setup event listeners
  const setupEventListeners = () => {
    // User events
    const unsubscribeUser = AgoraRTCService.onUser((data) => {
      console.log("👤 User event:", data.type, data.user?.uid)

      if (data.type === "published" && data.mediaType === "audio") {
        // Remote user started audio
        AgoraRTCService.playRemoteTrack(data.user, "audio")
      }

      setRemoteUsers(data.remoteUsers || [])
    })

    // Connection events
    const unsubscribeConnection = AgoraRTCService.onConnection((data) => {
      if (data.type === "network-quality") {
        // Update connection quality based on network stats
        const quality = data.stats.uplinkNetworkQuality
        if (quality >= 4) {
          setConnectionQuality("poor")
        } else if (quality >= 2) {
          setConnectionQuality("fair")
        } else {
          setConnectionQuality("good")
        }
      }
    })

    // Store unsubscribe functions
    window.audioCallUnsubscribers = [unsubscribeUser, unsubscribeConnection]
  }

  // Toggle mute
  const toggleMute = async () => {
    try {
      await AgoraRTCService.muteLocalAudio(!isMuted)
      setIsMuted(!isMuted)
      console.log(`🎤 Audio ${!isMuted ? "muted" : "unmuted"}`)
    } catch (error) {
      console.error("❌ Failed to toggle mute:", error)
    }
  }

  // Toggle speaker (placeholder - actual implementation depends on device)
  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn)
    console.log(`🔊 Speaker ${!isSpeakerOn ? "on" : "off"}`)
  }

  // Format call duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Get connection quality color
  const getQualityColor = () => {
    switch (connectionQuality) {
      case "good":
        return "text-green-500"
      case "fair":
        return "text-yellow-500"
      case "poor":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  return (
    <div className={`flex flex-col h-full ${themeClasses.background} relative`}>
      {/* Header */}
      <div className={`${themeClasses.card} border-b ${themeClasses.border} px-4 py-3`}>
        <div className="flex items-center justify-between">
          <button
            onClick={onEndCall}
            className={`p-2 hover:${themeClasses.cardContent} rounded-full transition-colors`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h3 className={`font-semibold ${themeClasses.primaryText}`}>Audio Call</h3>
            <div className="flex items-center justify-center space-x-2 mt-1">
              {callState === "connected" ? (
                <Wifi className={`w-4 h-4 ${getQualityColor()}`} />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ${themeClasses.secondaryText}`}>
                {callState === "connecting"
                  ? "Connecting..."
                  : callState === "connected"
                    ? "Connected"
                    : callState === "ended"
                      ? "Call Ended"
                      : "Ready"}
              </span>
            </div>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Call Interface */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* User Avatar */}
        <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mb-8 shadow-2xl">
          <Phone className="w-16 h-16 text-white" />
        </div>

        {/* Call Status */}
        <div className="text-center mb-8">
          <h2 className={`text-2xl font-bold ${themeClasses.primaryText}`}>
            {isIncoming ? "Incoming Call..." : "Calling..."}
          </h2>
          {callState === "connected" && (
            <span className={`text-lg ${themeClasses.secondaryText}`}>{formatDuration(callDuration)}</span>
          )}
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Loader className="w-10 h-10 animate-spin text-blue-500" />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500">{error}</div>
        )}
      </div>

      {/* Controls */}
      <div className={`${themeClasses.card} border-t ${themeClasses.border} p-4`}>
        <div className="flex items-center justify-around">
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full hover:${themeClasses.cardContent} transition-colors`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <button
            onClick={endCall}
            className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-colors"
          >
            <PhoneOff className="w-6 h-6" />
          </button>

          <button
            onClick={toggleSpeaker}
            className={`p-3 rounded-full hover:${themeClasses.cardContent} transition-colors`}
          >
            {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AudioCall
