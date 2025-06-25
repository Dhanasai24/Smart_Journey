"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../assets/Context/AuthContext"
import ChatRoom from "./ChatRoom"
import AudioCall from "./AudioCall"
import VideoCall from "./VideoCall"

const ChatContainer = ({ otherUserId, otherUser, roomId, autoCall, onBack }) => {
  const { user } = useAuth()
  const [currentView, setCurrentView] = useState("chat") // chat, audio-call, video-call
  const [incomingCall, setIncomingCall] = useState(null)

  // ✅ Enhanced auto-start call logic
  useEffect(() => {
    const checkAutoStartCall = () => {
      // Check for auto-call from navigation state first
      if (autoCall && autoCall.type) {
        console.log(`🚀 Auto-starting ${autoCall.type} call from navigation`)

        if (autoCall.type === "video") {
          setCurrentView("video-call")
        } else {
          setCurrentView("audio-call")
        }
        return
      }

      // Check sessionStorage as fallback
      const autoStartCall = sessionStorage.getItem("autoStartCall")
      if (autoStartCall) {
        try {
          const callData = JSON.parse(autoStartCall)

          // Check if call is for this user and not too old (5 minutes)
          if (callData.targetUserId === otherUserId && Date.now() - callData.timestamp < 5 * 60 * 1000) {
            console.log(`🚀 Auto-starting ${callData.callType} call from sessionStorage`)

            // Clear the stored call intent
            sessionStorage.removeItem("autoStartCall")

            // Start the call
            if (callData.callType === "video") {
              setCurrentView("video-call")
            } else {
              setCurrentView("audio-call")
            }
          } else {
            // Clear expired call intent
            sessionStorage.removeItem("autoStartCall")
          }
        } catch (error) {
          console.error("❌ Error parsing auto-start call data:", error)
          sessionStorage.removeItem("autoStartCall")
        }
      }
    }

    checkAutoStartCall()
  }, [otherUserId, autoCall])

  // Handle starting audio call
  const handleStartAudioCall = (targetUserId) => {
    console.log(`🎧 Starting audio call with user: ${targetUserId}`)
    setCurrentView("audio-call")
  }

  // Handle starting video call
  const handleStartVideoCall = (targetUserId) => {
    console.log(`🎥 Starting video call with user: ${targetUserId}`)
    setCurrentView("video-call")
  }

  // Handle ending call
  const handleEndCall = () => {
    console.log("📞 Call ended, returning to chat")
    setCurrentView("chat")
    setIncomingCall(null)
  }

  // Handle back navigation
  const handleBack = () => {
    if (currentView !== "chat") {
      setCurrentView("chat")
    } else {
      // Clear any pending call intents when going back
      sessionStorage.removeItem("autoStartCall")
      onBack?.()
    }
  }

  // Simulate incoming call (you can integrate this with your notification system)
  useEffect(() => {
    // Example: Listen for incoming calls from your backend/socket system
    // This is where you'd integrate with your existing notification system

    const handleIncomingCall = (callData) => {
      setIncomingCall(callData)
      setCurrentView(callData.type === "video" ? "video-call" : "audio-call")
    }

    // Add your event listeners here
    // socket.on('incoming-call', handleIncomingCall)

    return () => {
      // Cleanup event listeners
      // socket.off('incoming-call', handleIncomingCall)
    }
  }, [])

  // Render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case "audio-call":
        return (
          <AudioCall
            otherUserId={otherUserId}
            otherUser={otherUser}
            roomId={roomId}
            onEndCall={handleEndCall}
            isIncoming={incomingCall?.type === "audio"}
            autoStart={true} // ✅ Auto-start call when navigated from call button
          />
        )

      case "video-call":
        return (
          <VideoCall
            otherUserId={otherUserId}
            otherUser={otherUser}
            roomId={roomId}
            onEndCall={handleEndCall}
            isIncoming={incomingCall?.type === "video"}
            autoStart={true} // ✅ Auto-start call when navigated from call button
          />
        )

      case "chat":
      default:
        return (
          <ChatRoom
            otherUserId={otherUserId}
            otherUser={otherUser}
            roomId={roomId}
            onBack={handleBack}
            onStartAudioCall={handleStartAudioCall}
            onStartVideoCall={handleStartVideoCall}
          />
        )
    }
  }

  return <div className="h-full">{renderCurrentView()}</div>
}

export default ChatContainer
