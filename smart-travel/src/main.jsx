import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter as Router } from "react-router-dom"
import { AuthProvider } from "./assets/Context/AuthContext"
import AppRoutes from "./AppRoutes"
import "./index.css"
import { ThemeProvider } from "./assets/Context/ThemeContext"
//import { GlobalCallProvider } from "./CallComponents/GlobalCallProvider"
import { SocketProvider } from "./Hooks/SocketProvider"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
       
          <SocketProvider>
        <Router>
          <AppRoutes />
        </Router>
      </SocketProvider>
       
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
)
