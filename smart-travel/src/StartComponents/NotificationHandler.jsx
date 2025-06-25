"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../assets/Context/AuthContext"
import { API_BASE_URL } from "../assets/Utils/Constants"
import axios from "axios"
import LocationRequestModal from "./Location RequestModal"

const NotificationHandler = () => {
  const { user, token } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [locationRequestModal, setLocationRequestModal] = useState({
    isOpen: false,
    request: null,
  })

  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  // Fetch notifications periodically
  useEffect(() => {
    if (!user || !token) return

    const fetchNotifications = async () => {
      try {
        const response = await api.get("/social/notifications")
        if (response.data?.success) {
          const newNotifications = response.data.notifications || []

          // Check for location request notifications
          const locationRequests = newNotifications.filter((notif) => notif.type === "location-request")

          if (locationRequests.length > 0) {
            // Show the most recent location request
            const latestRequest = locationRequests[0]
            setLocationRequestModal({
              isOpen: true,
              request: latestRequest,
            })
          }

          setNotifications(newNotifications)
        }
      } catch (error) {
        console.error("Error fetching notifications:", error)
      }
    }

    // Fetch immediately
    fetchNotifications()

    // Then fetch every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)

    return () => clearInterval(interval)
  }, [user, token])

  const handleLocationRequestResponse = (approved) => {
    console.log(`Location request ${approved ? "approved" : "denied"}`)
    // Optionally refresh notifications or update UI
  }

  return (
    <>
      <LocationRequestModal
        isOpen={locationRequestModal.isOpen}
        onClose={() => setLocationRequestModal({ isOpen: false, request: null })}
        request={locationRequestModal.request}
        onResponse={handleLocationRequestResponse}
      />
    </>
  )
}

export default NotificationHandler
