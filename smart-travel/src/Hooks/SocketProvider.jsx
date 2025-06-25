// SocketProvider.js
import { createContext, useContext } from "react"
import { useSocket as useSocketHook } from "./UseSocket"

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const socketValue = useSocketHook()
  return (
    <SocketContext.Provider value={socketValue}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocketContext = () => useContext(SocketContext)