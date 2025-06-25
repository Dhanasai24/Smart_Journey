"use client"

import { useParams, useNavigate, useLocation } from "react-router-dom"
import ChatContainer from "./ChatContainer"

const AgoraChatPage = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  // ✅ Get user info from navigation state
  const otherUser = location.state?.otherUser || {
    id: userId,
    name: `User ${userId}`,
    avatar_url: null,
    email: null,
  }

  const roomId = location.state?.roomId
  const autoCall = location.state?.autoCall

  const handleBack = () => {
    navigate("/social-travel")
  }

  return (
    <div className="h-screen">
      <ChatContainer
        otherUserId={userId}
        otherUser={otherUser}
        roomId={roomId}
        autoCall={autoCall}
        onBack={handleBack}
      />
    </div>
  )
}

export default AgoraChatPage
