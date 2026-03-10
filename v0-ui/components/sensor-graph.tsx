"use client"

import { useState, useEffect, useRef } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { Activity, Trash2, Pause, Play, Download } from "lucide-react"
import { useEmbedViz } from "./embedviz-context"

interface DataPoint {
  time: string
  value: number
  label: string
}

const COLORS = ["#00e5ff", "#56d364", "#ffa657", "#bc8cff", "#f85149", "#ffd700", "#ff69b4"]

const CustomTooltip = ({ active, payload, isDark }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg p-2 shadow-xl" style={{
        background: isDark ? "#0d1117" : "#ffffff",
        border: "1px solid " + (isDark ? "#2a3f5f" : "#d0d8e4"),
        fontFamily: "monospace", fontSize: "10px"
      }}>
        <div style={{ color: isDark ? "#6b7280" : "#8090a0", marginBottom: 4, fontSize: 9 }}>
          {payload[0]?.payload?.time}
        </div>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2" style={{ color: p.color }}>
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span>{p.name}:</span>
            <strong>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</strong>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function SensorGraph() {
  const { serialLog, theme } = useEmbedViz()
  const isDark = theme === "dark"
  const [dataMap, setDataMap] = useState<Record<string, DataPoint[]>>({})
  const [paused, setPaused] = useState(false)
  const [hiddenKeys, setHiddenKeys] = useState<string[]>([])
  const pausedRef = useRef(false)
  const prevLenRef = useRef(0)

  useEffect(() => { pausedRef.current = paused }, [paused])

  useEffect(() => {
    if (serialLog.length <= prevLenRef.current) return
    const newLines = serialLog.slice(prevLenRef.current)
    prevLenRef.current = serialLog.length
    if (pausedRef.current) return

    const now = new Date()
    const time = now.getHours().toString().padStart(2,"0") + ":" +
                 now.getMinutes().toString().padStart(2,"0") + ":" +
                 now.getSeconds().toString().padStart(2,"0")

    newLines.forEach(line => {
      const match = line.match(/^([A-Z_]+):(-?\d+\.?\d*)/)
      if (!match) return
      const key = match[1]
      const value = parseFloat(match[2])
      if (isNaN(value)) return
      setDataMap(prev => {
        const existing = prev[key] || []
        const updated = [...existing, { time, value, label: key }].slice(-80)
        return { ...prev, [key]: updated }
      })
    })
  }, [serialLog])

  const clearData = () => {
    setDataMap({})
    setHiddenKeys([])
    prevLenRef.current = 0
  }

  const toggleKey = (key: string) => {
    setHiddenKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  const exportCSV = () => {
    const allKeys = Object.keys(dataMap)
    if (!allKeys.length) return
    const allTimes = [...new Set(allKeys.flatMap(k => dataMap[k].map(d => d.time)))]
    const header = ["time", ...allKeys].join(",")
    const rows = allTimes.map(t => {
      const vals = allKeys.map(k => {
        const pt = dataMap[k].find(d => d.time === t)
        return pt ? pt.value : ""
      })
      return [t, ...vals].join(",")
    })
    const csv = [header, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = "sensor_data.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  const bg = isDark ? "#0a0e14" : "#ffffff"
  const border = isDark ? "#1c2530" : "#d0d8e4"
  const headerBg = isDark ? "#0d1117" : "#f8fafc"
  const gridColor = isDark ? "#1c253044" : "#e0e8f0"
  const textColor = isDark ? "#6b7280" : "#8090a0"
  const textPrimary = isDark ? "#c5cdd8" : "#2a3a4a"

  const allKeys = Object.keys(dataMap)
  const visibleKeys = allKeys.filter(k => !hiddenKeys.includes(k))
  const hasData = allKeys.length > 0

  const mergedData: Record<string, any>[] = []
  if (hasData) {
    const allTimes = [...new Set(allKeys.flatMap(k => dataMap[k].map(d => d.time)))].slice(-80)
    allTimes.forEach(time => {
      const point: Record<string, any> = { time }
      allKeys.forEach(key => {
        const match = dataMap[key].find(d => d.time === time)
        if (match) point[key] = match.value
      })
      mergedData.push(point)
    })
  }

  return (
    <div className="flex flex-col h-full" style={{ background: bg }}>
      {/* Header */}
      <div className="flex items-center justify-between h-8 px-3 shrink-0"
        style={{ borderBottom: "1px solid " + border, background: headerBg }}>
        <div className="flex items-center gap-2">
          <Activity className="h-3 w-3 text-[#00e5ff]" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: textPrimary }}>
            Sensor Graph
          </span>
          {/* Toggle buttons per sensor */}
          {allKeys.map((key, i) => {
            const isHidden = hiddenKeys.includes(key)
            const color = COLORS[i % COLORS.length]
            return (
              <button key={key} onClick={() => toggleKey(key)}
                className="font-mono text-[9px] px-1.5 py-0.5 rounded transition-all"
                style={{
                  color: isHidden ? textColor : color,
                  background: isHidden ? "transparent" : color + "15",
                  border: "1px solid " + (isHidden ? (isDark ? "#2d3748" : "#cbd5e0") : color + "40"),
                  textDecoration: isHidden ? "line-through" : "none",
                  opacity: isHidden ? 0.5 : 1
                }}>
                {key}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-1">
          {paused && (
            <span className="font-mono text-[9px] text-[#ffa657] border border-[#ffa65744] px-1 rounded">PAUSED</span>
          )}
          <button onClick={() => setPaused(p => !p)}
            className="p-1 rounded-sm transition-all"
            style={{ color: paused ? "#ffa657" : "#6b7280" }}>
            {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          </button>
          <button onClick={exportCSV} className="p-1 rounded-sm transition-all"
            style={{ color: "#6b7280" }} title="Export CSV">
            <Download className="h-3 w-3" />
          </button>
          <button onClick={clearData} className="p-1 rounded-sm transition-all hover:text-[#f85149]"
            style={{ color: "#6b7280" }}>
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0 p-2">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Activity className="h-8 w-8" style={{ color: isDark ? "#1c2530" : "#d0d8e4" }} />
            <span className="font-mono text-[10px]" style={{ color: textColor }}>
              Waiting for sensor data...
            </span>
            <span className="font-mono text-[9px]" style={{ color: isDark ? "#3d4450" : "#b0c0d0" }}>
              Format: SENSOR:123  TEMP:28.5  HUM:65
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mergedData} margin={{ top: 4, right: 8, bottom: 4, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="time"
                tick={{ fontFamily: "monospace", fontSize: 8, fill: textColor }}
                tickLine={false}
                axisLine={{ stroke: isDark ? "#1c2530" : "#d0d8e4" }}
                interval="preserveStartEnd" />
              <YAxis
                tick={{ fontFamily: "monospace", fontSize: 8, fill: textColor }}
                tickLine={false}
                axisLine={{ stroke: isDark ? "#1c2530" : "#d0d8e4" }} />
              <Tooltip content={<CustomTooltip isDark={isDark} />} />
              {allKeys.map((key, i) => {
                if (hiddenKeys.includes(key)) return null
                const values = dataMap[key].map(d => d.value)
                const avg = values.reduce((a, b) => a + b, 0) / values.length
                return (
                  <Line key={key} type="monotone" dataKey={key}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={1.5} dot={false}
                    activeDot={{ r: 4, fill: COLORS[i % COLORS.length] }}
                    connectNulls />
                )
              })}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Stats footer */}
      {hasData && (
        <div className="flex items-center gap-4 px-3 h-7 shrink-0 overflow-x-auto"
          style={{ borderTop: "1px solid " + border, background: headerBg }}>
          {allKeys.map((key, i) => {
            const values = dataMap[key].map(d => d.value)
            const latest = values[values.length - 1]
            const min = Math.min(...values).toFixed(1)
            const max = Math.max(...values).toFixed(1)
            const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
            const color = COLORS[i % COLORS.length]
            const isHidden = hiddenKeys.includes(key)
            return (
              <span key={key} className="font-mono text-[9px] shrink-0"
                style={{ color: isHidden ? textColor : color, opacity: isHidden ? 0.4 : 1 }}>
                {key}: <strong>{latest?.toFixed(1)}</strong>
                <span style={{ opacity: 0.7 }}> avg:{avg} min:{min} max:{max}</span>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
