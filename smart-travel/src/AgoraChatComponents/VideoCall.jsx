"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "../assets/Context/AuthContext"
import { useTheme } from "../assets/Context/ThemeContext"
import AgoraRTCService from "../assets/Services/Agora/AgoraRTCService"
import AgoraTokenService from "../assets/Services/Agora/AgoraTokenService"
import { generateCallChannelName } from "../assets/Services/Agora/AgoraConfig"
import {
  Video,
  VideoOff,
  PhoneOff,
  Mic,
  MicOff,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Settings,
  Wifi,
  WifiOff,
  Loader,
  Clock,
} from "lucide-react"

const VideoCall = ({ otherUserId, onEndCall, isIncoming = false, autoStart = false }) => {
  const { user } = useAuth()
  const { theme, getThemeClasses } = useTheme()
  const themeClasses = getThemeClasses()

  // State management
  const [callState, setCallState] = useState("idle") // idle, connecting, connected, ended
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [remoteUsers, setRemoteUsers] = useState([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [connectionQuality, setConnectionQuality] = useState("good")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Refs
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const callStartTimeRef = useRef(null)
  const durationIntervalRef = useRef(null)
  const channelName = generateCallChannelName(user.id, otherUserId, "video")

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

  // Start video call
  const startCall = async () => {
    try {
      setIsLoading(true)
      setCallState("connecting")
      setError(null)

      console.log(`🎥 Starting video call with user ${otherUserId}`)

      // Get RTC token
      const token = await AgoraTokenService.generateRTCToken(channelName, user.id, "publisher")

      // Setup event listeners
      setupEventListeners()

      // Join channel
      await AgoraRTCService.joinChannel(channelName, user.id, token)

      // Start local audio and video
      await AgoraRTCService.startLocalAudio()
      const videoTrack = await AgoraRTCService.startLocalVideo()

      // Play local video
      if (videoTrack && localVideoRef.current) {
        videoTrack.play(localVideoRef.current)
      }

      setCallState("connected")
      setIsLoading(false)

      console.log("✅ Video call started successfully")
    } catch (error) {
      console.error("❌ Failed to start video call:", error)
      setError("Failed to start call. Please check your camera and microphone permissions.")
      setCallState("ended")
      setIsLoading(false)
    }
  }

  // End video call
  const endCall = async () => {
    try {
      console.log("📞 Ending video call")

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

      console.log("✅ Video call ended")
    } catch (error) {
      console.error("❌ Failed to end video call:", error)
      onEndCall?.()
    }
  }

  // Setup event listeners
  const setupEventListeners = () => {
    // User events
    const unsubscribeUser = AgoraRTCService.onUser((data) => {
      console.log("👤 User event:", data.type, data.user?.uid)

      if (data.type === "published") {
        if (data.mediaType === "video" && remoteVideoRef.current) {
          // Play remote video
          AgoraRTCService.playRemoteTrack(data.user, "video", remoteVideoRef.current)
        } else if (data.mediaType === "audio") {
          // Play remote audio
          AgoraRTCService.playRemoteTrack(data.user, "audio")
        }
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
    window.videoCallUnsubscribers = [unsubscribeUser, unsubscribeConnection]
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

  // Toggle video
  const toggleVideo = async () => {
    try {
      await AgoraRTCService.muteLocalVideo(!isVideoOff)
      setIsVideoOff(!isVideoOff)
      console.log(`📹 Video ${!isVideoOff ? "muted" : "unmuted"}`)
    } catch (error) {
      console.error("❌ Failed to toggle video:", error)
    }
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
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
    <div className={`fixed inset-0 ${themeClasses.background} z-50 ${isFullscreen ? "bg-black" : ""}`}>
      <div className={`h-full flex flex-col ${isFullscreen ? "" : "max-w-4xl mx-auto"}`}>
        {/* Header */}
        {!isFullscreen && (
          <div className={`${themeClasses.card} border-b ${themeClasses.border} px-6 py-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={onEndCall}
                  className={`p-2 hover:${themeClasses.cardContent} rounded-full transition-colors`}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center space-x-2">
                  {callState === "connected" ? (
                    <Wifi className={`w-5 h-5 ${getQualityColor()}`} />
                  ) : (
                    <WifiOff className="w-5 h-5 text-red-500" />
                  )}
                  <h2 className={`text-xl font-bold ${themeClasses.primaryText}`}>Agora Video Call</h2>
                </div>

                {callState === "connected" && (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className={themeClasses.secondaryText}>{formatDuration(callDuration)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {remoteUsers.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className={themeClasses.secondaryText}>{remoteUsers.length + 1} participants</span>
                  </div>
                )}

                <button
                  onClick={toggleFullscreen}
                  className={`p-2 hover:${themeClasses.cardContent} rounded-lg transition-colors`}
                >
                  {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Video area */}
        <div className="flex-1 relative bg-gray-900">
          {callState === "connecting" || isLoading ? (
            // Loading screen
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-white">
                <Loader className="w-16 h-16 animate-spin mx-auto mb-4" />
                <p className="text-xl">
                  {callState === "connecting" ? "Connecting to video call..." : "Starting video call..."}
                </p>
              </div>
            </div>
          ) : callState === "ended" ? (
            // Call ended screen
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-white">
                <p className="text-xl">Call Ended</p>
                {error && <p className="text-red-400 mt-2">{error}</p>}
              </div>
            </div>
          ) : (
            // Active call screen
            <>
              {/* Remote video */}
              <div className="w-full h-full">
                <video ref={remoteVideoRef} className="w-full h-full object-cover" autoPlay playsInline muted={false} />

                {/* Remote user placeholder */}
                {remoteUsers.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="text-center text-white">
                      <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Video className="w-12 h-12" />
                      </div>
                      <p className="text-lg">Waiting for others to join...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Local video (Picture-in-picture) */}
              <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                <video ref={localVideoRef} className="w-full h-full object-cover" autoPlay playsInline muted />

                {isVideoOff && (
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <VideoOff className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>

              {/* Status overlay */}
              {!isFullscreen && (
                <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-2 rounded-lg backdrop-blur-sm">
                  <p className="text-sm">
                    {callState === "connecting"
                      ? "Connecting..."
                      : callState === "connected"
                        ? `Connected • ${formatDuration(callDuration)}`
                        : "Agora Video Call"}
                  </p>
                </div>
              )}

              {/* Connection quality */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      connectionQuality === "good"
                        ? "bg-green-500"
                        : connectionQuality === "fair"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  />
                  <span className="text-xs capitalize">{connectionQuality}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Controls */}
        {callState !== "ended" && (
          <div className={`${themeClasses.card} border-t ${themeClasses.border} px-6 py-4`}>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={toggleVideo}
                disabled={callState !== "connected"}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg ${
                  isVideoOff ? "bg-red-500 hover:bg-red-600 text-white" : "bg-gray-300 hover:bg-gray-400 text-gray-600"
                } ${callState !== "connected" ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              </button>

              <button
                onClick={toggleMute}
                disabled={callState !== "connected"}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg ${
                  isMuted ? "bg-red-500 hover:bg-red-600 text-white" : "bg-gray-300 hover:bg-gray-400 text-gray-600"
                } ${callState !== "connected" ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              <button
                onClick={endCall}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
              >
                <PhoneOff className="w-8 h-8" />
              </button>

              <button
                disabled={callState !== "connected"}
                className={`w-12 h-12 bg-gray-300 hover:bg-gray-400 text-gray-600 rounded-full flex items-center justify-center transition-colors shadow-lg ${
                  callState !== "connected" ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Settings className="w-6 h-6" />
              </button>

              {!isFullscreen && (
                <button
                  onClick={toggleFullscreen}
                  className="w-12 h-12 bg-gray-300 hover:bg-gray-400 text-gray-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
                >
                  <Maximize2 className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VideoCall
