"use client"

import { useEffect, useRef, useState } from "react"
import { useAuth } from "../assets/Context/AuthContext"
import AblyService from "../assets/Services/AblyService"

export const useAbly = () => {
  const { user, token } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [matchedTravelers, setMatchedTravelers] = useState([])
  const [messages, setMessages] = useState([])
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [onlineUsers, setOnlineUsers] = useState(new Map())
  const [connectionRequests, setConnectionRequests] = useState([])

  // Call state management
  const [incomingCall, setIncomingCall] = useState(null)
  const [activeCall, setActiveCall] = useState(null)
  const [callStatus, setCallStatus] = useState(null)
  const [callStartTime, setCallStartTime] = useState(null)

  // UI refresh trigger
  const [uiRefreshTrigger, setUiRefreshTrigger] = useState(0)

  // Audio management for call sounds
  const ringingAudioRef = useRef(null)
  const dialingAudioRef = useRef(null)

  useEffect(() => {
    if (!user) return

    console.log(`🔌 Initializing Ably connection for user ${user.id}`)

    const initializeAbly = async () => {
      try {
        await AblyService.initialize(user.id, token)
        setIsConnected(true)
      } catch (error) {
        console.error("Failed to initialize Ably:", error)
        setIsConnected(false)
      }
    }

    initializeAbly()

    // Setup event handlers
    const unsubscribeConnection = AblyService.onConnection((data) => {
      console.log("🔌 Connection event:", data)

      switch (data.type) {
        case "connected":
          setIsConnected(true)
          break
        case "disconnected":
        case "suspended":
        case "error":
          setIsConnected(false)
          break
        case "connection-request":
          setConnectionRequests((prev) => [
            ...prev,
            {
              id: Date.now(),
              fromUserId: data.fromUserId,
              fromUserName: data.fromUserName || "Anonymous",
              fromUserAvatar: data.fromUserAvatar || null,
              roomId: data.roomId,
              tripId: data.tripId,
              message: data.message || "Wants to connect",
              timestamp: data.timestamp || new Date().toISOString(),
            },
          ])
          showToast(`${data.fromUserName || "Someone"} wants to connect with you!`, "info")
          break
        case "connection-accepted":
          if (data?.connectionUpdate?.userId) {
            setUiRefreshTrigger((prev) => prev + 1)
          }
          showToast(`${data.fromUserName || "Someone"} accepted your connection request!`, "success")
          break
        case "connection-ready":
          setUiRefreshTrigger((prev) => prev + 1)
          break
        case "connection-rejected":
          showToast("Your connection request was declined", "info")
          break
        case "connection-disconnected":
          setUiRefreshTrigger((prev) => prev + 1)
          showToast(`${data.fromUserName || "Someone"} disconnected from you`, "info")
          break
        case "ui-refresh":
          setUiRefreshTrigger((prev) => prev + 1)
          break
        case "message-notification":
          showToast(`New message from ${data.senderName || "Someone"}: ${data.preview || ""}`, "info")
          break
        default:
          break
      }
    })

    const unsubscribeMessages = AblyService.onMessage((message) => {
      console.log("💬 Message event:", message)
      setMessages((prev) => {
        const exists = prev.some((msg) => msg.id === message.id)
        if (exists) return prev
        return [...prev, message]
      })
    })

    const unsubscribeTyping = AblyService.onTyping((data) => {
      console.log("⌨️ Typing event:", data)
      setTypingUsers((prev) => {
        const newSet = new Set(prev)
        if (data.type === "typing" && data.userId !== user.id) {
          newSet.add(data.userId)
        } else {
          newSet.delete(data.userId)
        }
        return newSet
      })
    })

    const unsubscribeUserStatus = AblyService.onUserStatus((data) => {
      console.log("👤 User status event:", data)
      setOnlineUsers((prev) => {
        const newMap = new Map(prev)
        if (data.type === "online") {
          newMap.set(data.userId, "online")
        } else if (data.type === "offline") {
          newMap.delete(data.userId)
        }
        return newMap
      })
    })

    const unsubscribeCalls = AblyService.onCall((data) => {
      console.log("📞 Call event:", data)

      switch (data.type) {
        case "incoming_call":
          setIncomingCall(data)
          setCallStatus("incoming")
          playRingingSound()
          if (Notification.permission === "granted") {
            new Notification(`Incoming ${data.callType} call`, {
              body: `From: ${data.callerName}`,
              icon: "/favicon.ico",
              tag: "incoming-call",
            })
          }
          break
        case "call_accepted":
          setCallStatus("connecting")
          setIncomingCall(null)
          stopAllSounds()
          break
        case "call_rejected":
          setIncomingCall(null)
          setActiveCall(null)
          setCallStatus(null)
          setCallStartTime(null)
          stopAllSounds()
          break
        case "call_ended":
          setIncomingCall(null)
          setActiveCall(null)
          setCallStatus(null)
          setCallStartTime(null)
          stopAllSounds()
          break
        default:
          break
      }
    })

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up Ably connection")
      stopAllSounds()
      unsubscribeConnection()
      unsubscribeMessages()
      unsubscribeTyping()
      unsubscribeUserStatus()
      unsubscribeCalls()
      AblyService.disconnect()
    }
  }, [user, token])

  // Audio management functions
  const playRingingSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.5)
      const interval = setInterval(() => {
        if (incomingCall) {
          const newOscillator = audioContext.createOscillator()
          const newGainNode = audioContext.createGain()
          newOscillator.connect(newGainNode)
          newGainNode.connect(audioContext.destination)
          newOscillator.frequency.setValueAtTime(800, audioContext.currentTime)
          newGainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          newOscillator.start()
          newOscillator.stop(audioContext.currentTime + 0.5)
        } else {
          clearInterval(interval)
        }
      }, 2000)
      ringingAudioRef.current = { interval, audioContext }
    } catch (error) {
      console.log("Could not play ringing sound:", error)
    }
  }

  const playDialingSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 1)
      const interval = setInterval(() => {
        if (callStatus === "ringing") {
          const newOscillator = audioContext.createOscillator()
          const newGainNode = audioContext.createGain()
          newOscillator.connect(newGainNode)
          newGainNode.connect(audioContext.destination)
          newOscillator.frequency.setValueAtTime(400, audioContext.currentTime)
          newGainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          newOscillator.start()
          newOscillator.stop(audioContext.currentTime + 1)
        } else {
          clearInterval(interval)
        }
      }, 3000)
      dialingAudioRef.current = { interval, audioContext }
    } catch (error) {
      console.log("Could not play dialing sound:", error)
    }
  }

  const stopAllSounds = () => {
    try {
      if (ringingAudioRef.current) {
        clearInterval(ringingAudioRef.current.interval)
        ringingAudioRef.current.audioContext?.close()
        ringingAudioRef.current = null
      }
      if (dialingAudioRef.current) {
        clearInterval(dialingAudioRef.current.interval)
        dialingAudioRef.current.audioContext?.close()
        dialingAudioRef.current = null
      }
    } catch (error) {
      console.log("Error stopping sounds:", error)
    }
  }

  // Toast notification helper
  const showToast = (message, type = "info") => {
    const toast = document.createElement("div")
    toast.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
      type === "success"
        ? "bg-green-500 text-white"
        : type === "error"
          ? "bg-red-500 text-white"
          : type === "warning"
            ? "bg-yellow-500 text-white"
            : "bg-blue-500 text-white"
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
  }

  // Ably methods
  const sendConnectionRequest = async (toUserId, tripId, message) => {
    if (isConnected) {
      try {
        await AblyService.sendConnectionRequest(
          toUserId,
          user?.name || "Anonymous",
          user?.avatar_url || null,
          `room_${user?.id}_${toUserId}`, // Generate room ID
          tripId,
          message,
        )
      } catch (error) {
        console.error("Failed to send connection request:", error)
        showToast("Failed to send connection request", "error")
      }
    }
  }

  const respondToConnectionRequest = async (request, accepted) => {
    if (isConnected) {
      try {
        if (accepted) {
          await AblyService.acceptConnectionRequest(request.fromUserId, request.roomId)
        } else {
          await AblyService.rejectConnectionRequest(request.fromUserId, request.roomId)
        }
      } catch (error) {
        console.error("Failed to respond to connection request:", error)
        showToast("Failed to respond to connection request", "error")
      }
    }
  }

  const sendMessage = async (roomId, message, messageType = "text") => {
    if (isConnected) {
      try {
        return await AblyService.sendMessage(roomId, message, null)
      } catch (error) {
        console.error("Failed to send message:", error)
        showToast("Failed to send message", "error")
        throw error
      }
    }
  }

  const joinChat = async (roomId) => {
    if (isConnected) {
      try {
        await AblyService.joinRoom(roomId, null)
        setMessages([])
      } catch (error) {
        console.error("Failed to join chat:", error)
        showToast("Failed to join chat", "error")
      }
    }
  }

  const leaveChat = async (roomId) => {
    if (isConnected) {
      try {
        await AblyService.leaveRoom(roomId)
      } catch (error) {
        console.error("Failed to leave chat:", error)
      }
    }
  }

  const startTyping = async (roomId) => {
    if (isConnected) {
      try {
        await AblyService.sendTyping(roomId, null, true)
      } catch (error) {
        console.error("Failed to send typing indicator:", error)
      }
    }
  }

  const stopTyping = async (roomId) => {
    if (isConnected) {
      try {
        await AblyService.sendTyping(roomId, null, false)
      } catch (error) {
        console.error("Failed to stop typing indicator:", error)
      }
    }
  }

  // Call methods
  const initiateCall = async (toUserId, roomId, callType) => {
    if (isConnected) {
      try {
        console.log(`📞 [INITIATE-CALL] Calling ${toUserId}`)
        await AblyService.startCall(toUserId, callType, `call_${user?.id}_${toUserId}`)
        setActiveCall({
          fromUserId: user?.id,
          toUserId,
          roomId,
          callType,
          isInitiator: true,
        })
        setCallStatus("ringing")
        playDialingSound()
      } catch (error) {
        console.error("Failed to initiate call:", error)
        showToast("Failed to initiate call", "error")
      }
    }
  }

  const acceptCall = async (callId) => {
    if (isConnected && incomingCall) {
      try {
        console.log(`✅ [ACCEPT-CALL] Accepting call ${callId}`)
        setActiveCall({
          fromUserId: incomingCall.callerId,
          toUserId: user?.id,
          roomId: `room_${incomingCall.callerId}_${user?.id}`,
          callType: incomingCall.callType,
          isInitiator: false,
        })
        setCallStatus("connecting")
        setIncomingCall(null)
        stopAllSounds()
      } catch (error) {
        console.error("Failed to accept call:", error)
        showToast("Failed to accept call", "error")
      }
    }
  }

  const rejectCall = async (callId) => {
    if (isConnected) {
      try {
        console.log(`❌ [REJECT-CALL] Rejecting call ${callId}`)
        setIncomingCall(null)
        setActiveCall(null)
        setCallStatus(null)
        stopAllSounds()
      } catch (error) {
        console.error("Failed to reject call:", error)
      }
    }
  }

  const endCall = async (callId) => {
    if (isConnected) {
      try {
        console.log(`📞 [END-CALL] Ending call ${callId}`)
        if (activeCall) {
          await AblyService.endCall(
            activeCall.isInitiator ? activeCall.toUserId : activeCall.fromUserId,
            `call_${user?.id}_${activeCall.isInitiator ? activeCall.toUserId : activeCall.fromUserId}`,
          )
        }
        setIncomingCall(null)
        setActiveCall(null)
        setCallStatus(null)
        setCallStartTime(null)
        stopAllSounds()
      } catch (error) {
        console.error("Failed to end call:", error)
      }
    }
  }

  const updateLocation = async (latitude, longitude, location) => {
    if (isConnected) {
      try {
        await AblyService.updateStatus("online")
      } catch (error) {
        console.error("Failed to update location:", error)
      }
    }
  }

  const refreshMatches = async () => {
    if (isConnected) {
      try {
        await AblyService.updateStatus("online")
      } catch (error) {
        console.error("Failed to refresh matches:", error)
      }
    }
  }

  const disconnectFromUser = async (toUserId) => {
    if (isConnected) {
      try {
        await AblyService.disconnectFromUser(toUserId)
      } catch (error) {
        console.error("Failed to disconnect from user:", error)
        showToast("Failed to disconnect from user", "error")
      }
    }
  }

  return {
    // Connection state
    isConnected,
    matchedTravelers,
    messages,
    setMessages,
    typingUsers,
    onlineUsers,
    connectionRequests,
    setConnectionRequests,

    // Call state
    incomingCall,
    setIncomingCall,
    activeCall,
    setActiveCall,
    callStatus,
    setCallStatus,
    callStartTime,
    setCallStartTime,

    // UI refresh trigger
    uiRefreshTrigger,

    // Methods
    sendConnectionRequest,
    respondToConnectionRequest,
    sendMessage,
    joinChat,
    leaveChat,
    startTyping,
    stopTyping,
    updateLocation,
    refreshMatches,
    disconnectFromUser,

    // Call methods
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    stopAllSounds,

    // Ably service reference
    ablyService: AblyService,
  }
}
