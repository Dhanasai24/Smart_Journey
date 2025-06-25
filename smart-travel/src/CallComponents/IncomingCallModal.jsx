"use client"

import { useEffect } from "react"
import { Phone, PhoneOff } from "lucide-react"

const IncomingCallModal = ({ incomingCall, onAnswer, onReject }) => {
  useEffect(() => {
    // Request notification permission if not already granted
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission()
    }

    // Create browser notification
    if (Notification.permission === "granted" && incomingCall) {
      const notification = new Notification(`Incoming ${incomingCall.callType} Call`, {
        body: `From: ${incomingCall.fromUserName || "Someone"}`,
        icon: "/favicon.ico",
      })

      // Close notification when call is handled
      return () => {
        notification.close()
      }
    }
  }, [incomingCall])

  if (!incomingCall) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Incoming {incomingCall.callType} Call</h3>
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 rounded-full overflow-hidden mr-4">
            <img
              src={incomingCall.fromUserAvatar || "/placeholder.svg?height=64&width=64"}
              alt="Caller"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="font-medium">{incomingCall.fromUserName || "Someone"}</p>
            <p className="text-sm text-gray-500">Wants to {incomingCall.callType} call with you</p>
          </div>
        </div>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onReject}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full flex items-center"
          >
            <PhoneOff size={20} className="mr-2" />
            Decline
          </button>
          <button
            onClick={onAnswer}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full flex items-center"
          >
            <Phone size={20} className="mr-2" />
            Answer
          </button>
        </div>
      </div>
    </div>
  )
}

export default IncomingCallModal
