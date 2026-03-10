"use client"

import { useState } from "react"
import { Cpu, Wifi, WifiOff, Sun, Moon } from "lucide-react"
import { useEmbedViz } from "./embedviz-context"

export function Header() {
  const { wsConnected, platform, theme, toggleTheme } = useEmbedViz()
  const isDark = theme === "dark"

  const border = isDark ? "#1c2530" : "#d0d8e4"
  const textMuted = isDark ? "#6b7280" : "#8090a0"

  return (
    <header className="flex items-center justify-between h-10 px-4 shrink-0"
      style={{ background: isDark ? "#0d1117" : "#ffffff", borderBottom: `1px solid ${border}` }}>

      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-[#00e5ff]" />
          <span className="font-mono text-xs font-bold tracking-widest text-[#00e5ff] uppercase">EmbedViz</span>
        </div>
        <div className="h-4 w-px" style={{ background: border }} />
        <span className="font-mono text-[10px] tracking-wider uppercase" style={{ color: textMuted }}>
          Embedded Visualizer v1.0.0
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          <span style={{ color: textMuted }}>Platform:</span>
          <span className="text-[#00e5ff] font-bold">{platform}</span>
        </div>
        <div className="h-4 w-px" style={{ background: border }} />

        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          {wsConnected
            ? <Wifi className="h-3 w-3 text-[#56d364]" />
            : <WifiOff className="h-3 w-3 text-[#f85149]" />}
          <span style={{ color: wsConnected ? "#56d364" : "#f85149" }}>
            {wsConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
        <div className="h-4 w-px" style={{ background: border }} />

        <button onClick={toggleTheme}
          className="flex items-center gap-1 font-mono text-[10px] p-1 rounded hover:text-[#00e5ff] transition-colors"
          style={{ color: textMuted }}>
          {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          <span className="uppercase tracking-wider">{isDark ? "Light" : "Dark"}</span>
        </button>
      </div>
    </header>
  )
}
