"use client"

import { useState, useEffect, useRef } from "react"
import { Terminal, Trash2, Pause, Download, ArrowDown, Wifi, WifiOff, Play } from "lucide-react"
import { useEmbedViz } from "./embedviz-context"

interface LogEntry {
  timestamp: string
  message: string
  type: "info" | "warn" | "error" | "data" | "system"
}

const typeColors = { info: "#c5cdd8", warn: "#ffa657", error: "#f85149", data: "#00e5ff", system: "#6b7280" }
const typeLabels = { info: "INF", warn: "WRN", error: "ERR", data: "DAT", system: "SYS" }

function getTimestamp(): string {
  const now = new Date()
  return `${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}:${now.getSeconds().toString().padStart(2,"0")}.${now.getMilliseconds().toString().padStart(3,"0")}`
}

function classifyMessage(msg: string): LogEntry["type"] {
  if (msg.includes("ERROR") || msg.includes("error")) return "error"
  if (msg.includes("WARN") || msg.includes("warn")) return "warn"
  if (msg.includes("SENSOR:") || msg.includes("LED:") || msg.includes("ADC")) return "data"
  if (msg.startsWith("[SYS]") || msg.startsWith("[BOOT]")) return "system"
  return "info"
}

export function SerialMonitor() {
  const { serialLog, deviceLive, sendMessage, theme } = useEmbedViz()
  const isDark = theme === "dark"
  const [logs, setLogs] = useState<LogEntry[]>([
    { timestamp: "00:00:00.000", message: "[SYS] Serial Monitor ready — connect a device", type: "system" }
  ])
  const [paused, setPaused] = useState(false)
  const [input, setInput] = useState("")
  const [ports, setPorts] = useState<string[]>([])
  const [selectedPort, setSelectedPort] = useState("")
  const [showPortMenu, setShowPortMenu] = useState(false)
  const [userScrolled, setUserScrolled] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)
  const userScrolledRef = useRef(false)
  const prevLenRef = useRef(0)

  useEffect(() => { pausedRef.current = paused }, [paused])
  useEffect(() => { userScrolledRef.current = userScrolled }, [userScrolled])

  useEffect(() => {
    if (serialLog.length > prevLenRef.current) {
      const newLines = serialLog.slice(prevLenRef.current)
      prevLenRef.current = serialLog.length
      if (!pausedRef.current) {
        setLogs(prev => [...prev, ...newLines.map(l => ({ timestamp: getTimestamp(), message: l, type: classifyMessage(l) }))].slice(-500))
      }
    }
  }, [serialLog])

  useEffect(() => {
    setLogs(prev => [...prev, { timestamp: getTimestamp(), message: deviceLive ? "[SYS] Device connected" : "[SYS] Device disconnected", type: "system" as const }])
    if (deviceLive) prevLenRef.current = serialLog.length
  }, [deviceLive])

  useEffect(() => {
    if (scrollRef.current && !pausedRef.current && !userScrolledRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    setUserScrolled(scrollHeight - scrollTop - clientHeight > 30)
  }

  const scrollToBottom = () => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    setUserScrolled(false)
  }

  const loadPorts = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/ports")
      const data = await res.json()
      const paths = data.map((p: { path: string }) => p.path)
      setPorts(paths.length > 0 ? paths : ["COM3","COM4","COM5","COM6"])
      setSelectedPort(paths.length > 0 ? paths[0] : "COM5")
    } catch {
      setPorts(["COM3","COM4","COM5","COM6"])
      setSelectedPort("COM5")
    }
  }

  const bg = isDark ? "#0a0e14" : "#ffffff"
  const border = isDark ? "#1c2530" : "#d0d8e4"
  const headerBg = isDark ? "#0d1117" : "#f8fafc"
  const textPrimary = isDark ? "#c5cdd8" : "#2a3a4a"

  return (
    <div className="flex flex-col h-full" style={{ background: bg }}>
      <div className="flex items-center justify-between h-7 px-3 shrink-0" style={{ borderBottom: `1px solid ${border}`, background: headerBg }}>
        <div className="flex items-center gap-2">
          <Terminal className="h-3 w-3 text-[#00e5ff]" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: textPrimary }}>Serial Monitor</span>
          <span className="font-mono text-[10px]" style={{ color: deviceLive ? "#56d364" : "#6b7280" }}>
            {deviceLive ? "● LIVE @ 115200" : "○ OFFLINE"}
          </span>
          {paused && <span className="font-mono text-[9px] text-[#ffa657] border border-[#ffa65744] px-1 rounded">PAUSED</span>}
        </div>
        <div className="flex items-center gap-1">
          {deviceLive ? (
            <button onClick={() => sendMessage({ type: "DISCONNECT_DEVICE" })} className="flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-[9px] text-[#f85149] border border-[#f8514944] hover:opacity-80 transition-all">
              <WifiOff className="h-3 w-3" /> DISC
            </button>
          ) : (
            <div className="relative">
              <button onClick={() => { setShowPortMenu(!showPortMenu); loadPorts() }} className="flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-[9px] text-[#00e5ff] border border-[#00e5ff44] hover:opacity-80 transition-all">
                <Wifi className="h-3 w-3" /> CONNECT
              </button>
              {showPortMenu && (
                <div className="absolute right-0 top-full mt-1 rounded-md p-3 z-50 w-48 shadow-xl" style={{ background: headerBg, border: `1px solid ${border}` }}>
                  <div className="font-mono text-[9px] text-[#6b7280] mb-1">PORT</div>
                  <select value={selectedPort} onChange={e => setSelectedPort(e.target.value)} className="w-full rounded px-2 py-1 font-mono text-[10px] mb-2 outline-none" style={{ background: bg, color: textPrimary, border: `1px solid ${border}` }}>
                    {ports.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <button onClick={() => { sendMessage({ type: "CONNECT_DEVICE", port: selectedPort, baudRate: "115200" }); setShowPortMenu(false) }} className="w-full text-[#00e5ff] rounded px-2 py-1 font-mono text-[10px] hover:opacity-80" style={{ background: "#00e5ff22", border: "1px solid #00e5ff44" }}>
                    Connect
                  </button>
                </div>
              )}
            </div>
          )}
          <button onClick={() => setPaused(p => !p)} className={`p-1 rounded-sm transition-all ${paused ? "text-[#ffa657]" : "text-[#6b7280]"}`}>
            {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          </button>
          <button onClick={() => { setLogs([]); prevLenRef.current = 0 }} className="p-1 rounded-sm text-[#6b7280] hover:text-[#f85149] transition-all"><Trash2 className="h-3 w-3" /></button>
          <button onClick={() => {
            const text = logs.map(l => `${l.timestamp} [${typeLabels[l.type]}] ${l.message}`).join("\n")
            const blob = new Blob([text], { type: "text/plain" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a"); a.href = url; a.download = "serial_log.txt"; a.click()
          }} className="p-1 rounded-sm text-[#6b7280] hover:text-[#c5cdd8] transition-all"><Download className="h-3 w-3" /></button>
          <button onClick={scrollToBottom} className={`p-1 rounded-sm transition-all ${userScrolled ? "text-[#00e5ff]" : "text-[#6b7280]"}`}><ArrowDown className="h-3 w-3" /></button>
        </div>
      </div>

      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-auto px-3 py-1" style={{ background: bg }}>
        {logs.map((log, i) => (
          <div key={i} className="flex gap-2 py-px">
            <span className="font-mono text-[10px] shrink-0 select-none" style={{ color: isDark ? "#3d4450" : "#90a0b0" }}>{log.timestamp}</span>
            <span className="font-mono text-[9px] shrink-0 w-6 text-center" style={{ color: typeColors[log.type] }}>{typeLabels[log.type]}</span>
            <span className="font-mono text-[11px]" style={{ color: typeColors[log.type] }}>{log.message}</span>
          </div>
        ))}
      </div>

      {userScrolled && (
        <div className="flex justify-center py-1" style={{ background: bg, borderTop: `1px solid ${border}` }}>
          <button onClick={scrollToBottom} className="font-mono text-[9px] text-[#00e5ff] flex items-center gap-1 hover:underline">
            <ArrowDown className="h-3 w-3" /> Jump to latest
          </button>
        </div>
      )}

      <div className="flex items-center h-7 shrink-0" style={{ borderTop: `1px solid ${border}`, background: headerBg }}>
        <span className="px-2 font-mono text-[10px] text-[#00e5ff]">{">"}</span>
        <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && input.trim()) { setLogs(prev => [...prev, { timestamp: getTimestamp(), message: `[TX] > ${input}`, type: "data" }]); sendMessage({ type: "SERIAL_SEND", data: input }); setInput("") } }} placeholder="Send command..." className="flex-1 bg-transparent outline-none font-mono text-[11px]" style={{ color: textPrimary }} />
        <button onClick={() => { if (input.trim()) { setLogs(prev => [...prev, { timestamp: getTimestamp(), message: `[TX] > ${input}`, type: "data" }]); sendMessage({ type: "SERIAL_SEND", data: input }); setInput("") } }} className="px-3 font-mono text-[10px] text-[#00e5ff] hover:opacity-80 h-full uppercase tracking-wider">Send</button>
      </div>
    </div>
  )
}
