"use client"
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react"
const WS_URL = "ws://localhost:8080"
const WS_TOKEN = "embedviz_secret_token_123"
interface VizData {
  pins: any[]
  memory: { totalBytes: number; breakdown: Record<string, number> }
  flow: { nodes: any[]; edges: any[] }
  platform: string
  conflicts: any[]
  timingIssues: any[]
  suggestions: any[]
  memoryWarnings: any[]
}
interface EmbedVizContextType {
  wsConnected: boolean
  deviceLive: boolean
  platform: string
  vizData: VizData
  serialLog: string[]
  sendMessage: (msg: object) => void
  theme: "dark" | "light"
  toggleTheme: () => void
}
const defaultViz: VizData = {
  pins: [],
  memory: { totalBytes: 0, breakdown: {} },
  flow: { nodes: [], edges: [] },
  platform: "Detecting...",
  conflicts: [],
  timingIssues: [],
  suggestions: [],
  memoryWarnings: []
}
const EmbedVizContext = createContext<EmbedVizContextType>({
  wsConnected: false,
  deviceLive: false,
  platform: "Detecting...",
  vizData: defaultViz,
  serialLog: [],
  sendMessage: () => {},
  theme: "dark",
  toggleTheme: () => {}
})
export function EmbedVizProvider({ children }: { children: ReactNode }) {
  const [wsConnected, setWsConnected] = useState(false)
  const [deviceLive, setDeviceLive] = useState(false)
  const [platform, setPlatform] = useState("Detecting...")
  const [vizData, setVizData] = useState<VizData>(defaultViz)
  const [serialLog, setSerialLog] = useState<string[]>([])
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const wsRef = useRef<WebSocket | null>(null)
  useEffect(() => {
    connectWs()
    return () => { wsRef.current?.close() }
  }, [])
  const connectWs = () => {
    try {
      const ws = new WebSocket(`${WS_URL}?token=${WS_TOKEN}`)
      ws.onopen = () => setWsConnected(true)
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data)
        if (msg.type === "RESULT" && msg.data?.status === "success") {
          setPlatform(msg.data.platform || "arduino")
          setVizData({
            pins: msg.data.hardwareStates || [],
            memory: msg.data.memory || { totalBytes: 0, breakdown: {} },
            flow: msg.data.flow || { nodes: [], edges: [] },
            platform: msg.data.platform || "arduino",
            conflicts: msg.data.conflicts || [],
            timingIssues: msg.data.timingIssues || [],
            suggestions: msg.data.suggestions || [],
            memoryWarnings: msg.data.memoryWarnings || []
          })
        } else if (msg.type === "DEVICE_STATUS") {
          setDeviceLive(msg.status === "connected")
        } else if (msg.type === "SERIAL_DATA") {
          setSerialLog(prev => [...prev, msg.data].slice(-500))
        }
      }
      ws.onclose = () => {
        setWsConnected(false)
        setDeviceLive(false)
        setTimeout(connectWs, 3000)
      }
      wsRef.current = ws
    } catch (e) { console.error("WS error", e) }
  }
  const sendMessage = (msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }
  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark")
  return (
    <EmbedVizContext.Provider value={{ wsConnected, deviceLive, platform, vizData, serialLog, sendMessage, theme, toggleTheme }}>
      {children}
    </EmbedVizContext.Provider>
  )
}
export const useEmbedViz = () => useContext(EmbedVizContext)
