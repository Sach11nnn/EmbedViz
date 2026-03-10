"use client"

import { useState, useEffect, useRef } from "react"
import { useEmbedViz } from "./embedviz-context"

const modeColors: Record<string, string> = {
  OUTPUT: "#56d364", INPUT: "#00e5ff", INPUT_PULLUP: "#00e5ff",
  ADC: "#ffa657", PWM: "#bc8cff", I2C: "#00e5ff", SPI: "#bc8cff",
  UART: "#ffa657", GPIO: "#56d364", ANALOG: "#ffa657",
  WiFi: "#56d364", Bluetooth: "#bc8cff", DAC: "#f85149", TOUCH: "#00e5ff", LEDC: "#bc8cff",
}

const severityColor = (s: string) =>
  s === "ERROR" || s === "BUG" || s === "ISR_ERROR" ? "#f85149"
  : s === "WARNING" || s === "ISR_WARNING" ? "#ffa657"
  : s === "PERFORMANCE" ? "#bc8cff"
  : s === "MEMORY" ? "#ffa657"
  : s === "SECURITY" ? "#f85149"
  : "#00e5ff"

function detectComponentName(varName: string): string {
  const n = varName.toLowerCase()
  if (/led|light|lamp/.test(n)) return "LED"
  if (/buzz|beep|piezo/.test(n)) return "Buzzer"
  if (/servo|motor/.test(n)) return "Servo"
  if (/btn|button|switch/.test(n)) return "Button"
  if (/temp|dht|therm/.test(n)) return "Temp"
  if (/sensor|sens/.test(n)) return "Sensor"
  if (/relay/.test(n)) return "Relay"
  if (/pot|knob/.test(n)) return "Pot"
  if (/trig|echo|ultrasonic/.test(n)) return "Ultrasonic"
  if (/ir|infrared/.test(n)) return "IR"
  if (/lcd|oled|display/.test(n)) return "Display"
  if (/fan/.test(n)) return "Fan"
  return ""
}

export function PinStates() {
  const { vizData, theme, serialLog } = useEmbedViz()
  const isDark = theme === "dark"
  const pins = vizData.pins
  const data = vizData as any
  const conflicts = data.conflicts || []
  const timingIssues = data.timingIssues || []
  const suggestions = data.suggestions || []
  const memoryWarnings = data.memoryWarnings || []
  const interrupts = data.interrupts || []
  const allIssues = [...conflicts, ...timingIssues, ...memoryWarnings, ...suggestions, ...interrupts]
  const code = typeof window !== "undefined" ? (window as any).__embedviz_code || "" : ""

  const [tab, setTab] = useState<"pins" | "issues">("pins")
  const [liveStates, setLiveStates] = useState<Record<string, { value: string; updated: number }>>({})
  const prevLenRef = useRef(0)

  useEffect(() => {
    if (serialLog.length <= prevLenRef.current) return
    const newLines = serialLog.slice(prevLenRef.current)
    prevLenRef.current = serialLog.length
    newLines.forEach(line => {
      const match = line.match(/^([A-Z_0-9]+):(HIGH|LOW|ON|OFF|-?\d+\.?\d*)/i)
      if (!match) return
      setLiveStates(prev => ({
        ...prev,
        [match[1].toUpperCase()]: { value: match[2].toUpperCase(), updated: Date.now() }
      }))
    })
  }, [serialLog])

  const bg = isDark ? "#0a0e14" : "#ffffff"
  const border = isDark ? "#1c2530" : "#d0d8e4"
  const headerBg = isDark ? "#0d1117" : "#f8fafc"
  const textPrimary = isDark ? "#c5cdd8" : "#2a3a4a"
  const textMuted = isDark ? "#6b7280" : "#8090a0"

  const getStateColor = (value: string) => {
    if (value === "HIGH" || value === "ON") return "#56d364"
    if (value === "LOW" || value === "OFF") return "#f85149"
    const num = parseFloat(value)
    if (!isNaN(num)) return num > 800 ? "#f85149" : num > 400 ? "#ffa657" : "#00e5ff"
    return "#6b7280"
  }

  const isRecent = (updated: number) => Date.now() - updated < 3000

  const getVarName = (pinNum: string): string => {
    const match = code.match(new RegExp('int\\s+(\\w+)\\s*=\\s*' + pinNum + '\\s*;'))
    return match ? match[1] : ""
  }

  return (
    <div className="flex flex-col h-full" style={{ background: bg }}>
      {/* Header */}
      <div className="flex items-center justify-between h-8 px-3 shrink-0"
        style={{ borderBottom: "1px solid " + border, background: headerBg }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setTab("pins")}
            className="font-mono text-[10px] font-bold uppercase tracking-wider transition-colors"
            style={{ color: tab === "pins" ? "#00e5ff" : textMuted }}>
            Hardware ({pins.length})
          </button>
          <button onClick={() => setTab("issues")}
            className="font-mono text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1"
            style={{ color: tab === "issues" ? "#ffa657" : textMuted }}>
            Diagnostics
            {allIssues.length > 0 && (
              <span className="px-1 rounded text-[9px]" style={{
                background: conflicts.length > 0 ? "#f8514920" : "#ffa65720",
                color: conflicts.length > 0 ? "#f85149" : "#ffa657",
                border: "1px solid " + (conflicts.length > 0 ? "#f8514940" : "#ffa65740")
              }}>{allIssues.length}</span>
            )}
          </button>
        </div>
        {Object.keys(liveStates).length > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#56d364] animate-pulse" />
            <span className="font-mono text-[9px] text-[#56d364]">LIVE</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {tab === "pins" ? (
          pins.length === 0 ? (
            <div className="flex items-center justify-center h-full font-mono text-[11px]"
              style={{ color: textMuted }}>Write code to detect hardware</div>
          ) : (
            pins.map((pin: any, i: number) => {
              const modeStr = pin.mode || pin.type || "GPIO"
              const color = modeColors[modeStr] || "#00e5ff"
              const hasConflict = conflicts.some((c: any) => c.pin === (pin.pin || pin.name))
              const pinLabel = (pin.pin || pin.name || "?").toString()
              const liveState = liveStates[pinLabel.toUpperCase()]
              const liveVal = liveState?.value || null
              const liveColor = liveVal ? getStateColor(liveVal) : null
              const fresh = liveState ? isRecent(liveState.updated) : false

              const varName = getVarName(pinLabel)
              const compName = varName ? detectComponentName(varName) : ""
              const displayName = compName || varName || pinLabel

              return (
                <div key={i} className="flex items-center gap-2 px-3 py-2 transition-all"
                  style={{
                    borderBottom: "1px solid " + (isDark ? "#0f1520" : "#eef2f7"),
                    background: hasConflict ? "#f8514908" : fresh ? (liveColor + "08") : "transparent"
                  }}>

                  {/* Color dot */}
                  <div className="w-2 h-2 rounded-full shrink-0" style={{
                    background: hasConflict ? "#f85149" : liveColor || color,
                    boxShadow: fresh ? "0 0 8px " + liveColor + "99" : "0 0 4px " + color + "44"
                  }} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[11px] font-bold" style={{ color: textPrimary }}>
                        {displayName}
                      </span>
                      {(varName || compName) && (
                        <span className="font-mono text-[9px] px-1 rounded"
                          style={{ color, background: color + "15" }}>
                          pin {pinLabel}
                        </span>
                      )}
                      <span className="font-mono text-[9px]" style={{ color: textMuted }}>
                        {pin.type || "GPIO"} · L{pin.line || "?"}
                      </span>
                      {hasConflict && (
                        <span className="font-mono text-[9px] px-1 rounded"
                          style={{ color: "#f85149", background: "#f8514920" }}>CONFLICT</span>
                      )}
                    </div>
                    {liveVal && !isNaN(parseFloat(liveVal)) && (
                      <div className="mt-1 h-1.5 rounded-full overflow-hidden"
                        style={{ background: isDark ? "#1c2530" : "#e2e8f0", width: "85%" }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{
                          width: Math.min((parseFloat(liveVal) / 1023) * 100, 100) + "%",
                          background: liveColor || color
                        }} />
                      </div>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{ color, background: color + "15", border: "1px solid " + color + "30" }}>
                      {modeStr}
                    </span>
                    {liveVal && (
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          color: liveColor || "#6b7280",
                          background: (liveColor || "#6b7280") + "20",
                          border: "1px solid " + (liveColor || "#6b7280") + "50",
                          boxShadow: fresh ? "0 0 6px " + liveColor + "60" : "none"
                        }}>
                        {liveVal}
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )
        ) : (
          allIssues.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <span className="font-mono text-[11px] text-[#56d364]">No issues detected!</span>
            </div>
          ) : (
            <div className="flex flex-col">
              {allIssues.map((issue: any, i: number) => {
                const severity = issue.severity || issue.type || "INFO"
                const color = severityColor(severity)
                return (
                  <div key={i} className="px-3 py-2"
                    style={{ borderBottom: "1px solid " + (isDark ? "#0f1520" : "#eef2f7"), borderLeft: "2px solid " + color }}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-[9px] font-bold px-1 rounded"
                        style={{ color, background: color + "20" }}>{severity}</span>
                      {issue.line && <span className="font-mono text-[9px]" style={{ color: textMuted }}>Line {issue.line}</span>}
                      {issue.ms && <span className="font-mono text-[9px]" style={{ color: textMuted }}>{issue.ms}ms</span>}
                    </div>
                    <p className="font-mono text-[10px]" style={{ color: textPrimary }}>{issue.message}</p>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between h-6 px-3 shrink-0"
        style={{ borderTop: "1px solid " + border, background: headerBg }}>
        <span className="font-mono text-[9px]" style={{ color: textMuted }}>Static + Live Analysis</span>
        <span className="font-mono text-[9px]"
          style={{ color: conflicts.length > 0 ? "#f85149" : "#56d364" }}>
          {conflicts.length > 0 ? conflicts.length + " conflicts!" : "No conflicts"}
        </span>
      </div>
    </div>
  )
}
