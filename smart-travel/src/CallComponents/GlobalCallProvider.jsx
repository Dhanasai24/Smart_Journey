"use client"

import { createContext, useContext } from "react"
import { useSocket } from "../Hooks/UseSocket"
import { useAuth } from "../assets/Context/AuthContext"
import IncomingCallModal from "./IncomingCallModal"

// Create context
const GlobalCallContext = createContext()

// Provider component
export const GlobalCallProvider = ({ children }) => {
  const { user } = useAuth()
  const { incomingCall, setIncomingCall, answerCall, rejectCall, stopAllSounds } = useSocket()

  // Handle answer call
  const handleAnswerCall = async () => {
    if (!incomingCall) return

    // Navigate to chat room if needed
    if (window.location.pathname !== `/chat/${incomingCall.roomId}`) {
      window.location.href = `/chat/${incomingCall.roomId}`
    } else {
      // If already in chat room, answer directly
      answerCall(incomingCall.callId)
    }

    stopAllSounds()
  }

  // Handle reject call
  const handleRejectCall = () => {
    if (!incomingCall) return
    rejectCall(incomingCall.callId)
    setIncomingCall(null)
    stopAllSounds()
  }

  return (
    <GlobalCallContext.Provider value={{ incomingCall }}>
      {children}
      {incomingCall && (
        <IncomingCallModal incomingCall={incomingCall} onAnswer={handleAnswerCall} onReject={handleRejectCall} />
      )}
    </GlobalCallContext.Provider>
  )
}

// Custom hook to use the call context
export const useGlobalCall = () => useContext(GlobalCallContext)
