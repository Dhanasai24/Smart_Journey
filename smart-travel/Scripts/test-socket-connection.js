import { io } from "socket.io-client"

// Test Socket.IO connection to your backend
const testSocketConnection = () => {
  console.log("🧪 Testing Socket.IO connection...")

  const socket = io("http://localhost:3000", {
    transports: ["websocket", "polling"],
    timeout: 5000,
  })

  socket.on("connect", () => {
    console.log("✅ Socket.IO connection successful!")
    console.log(`🔌 Connected with ID: ${socket.id}`)

    // Test user registration
    socket.emit("register-user", {
      userId: 1,
      token: "test-token",
    })

    // Test connection request
    setTimeout(() => {
      socket.emit("send-connection-request", {
        fromUserId: 1,
        toUserId: 2,
        tripId: 1,
        message: "Test connection request",
      })
    }, 1000)

    // Disconnect after 5 seconds
    setTimeout(() => {
      console.log("🔌 Disconnecting...")
      socket.disconnect()
    }, 5000)
  })

  socket.on("connect_error", (error) => {
    console.error("❌ Socket.IO connection failed:", error.message)
    console.log("💡 Make sure your backend server is running on port 3000")
  })

  socket.on("disconnect", (reason) => {
    console.log(`👋 Disconnected: ${reason}`)
  })

  socket.on("traveler-connection-request", (data) => {
    console.log("🔔 Received connection request:", data)
  })

  socket.on("connection-request-sent", (data) => {
    console.log("📤 Connection request sent:", data)
  })

  socket.on("error", (error) => {
    console.error("❌ Socket error:", error)
  })
}

// Run the test
testSocketConnection()
