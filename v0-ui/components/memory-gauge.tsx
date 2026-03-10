"use client"
import { useEmbedViz } from "./embedviz-context"

function GaugeBar({ label, used, total, color }: { label: string; used: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0
  const isDanger = pct > 75
  const isWarn = pct > 50
  const barColor = isDanger ? "#f85149" : isWarn ? "#ffa657" : color

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: barColor }}>
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold" style={{ color: barColor }}>
            {used}B / {total}B
          </span>
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded"
            style={{ background: barColor + "20", color: barColor, border: "1px solid " + barColor + "40" }}>
            {pct.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="relative h-3 rounded-full overflow-hidden"
        style={{ background: "#1c2530" }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{
            width: pct + "%",
            background: "linear-gradient(90deg, " + barColor + "aa, " + barColor + ")",
            boxShadow: "0 0 8px " + barColor + "66"
          }} />
        {/* Danger threshold line at 75% */}
        <div className="absolute top-0 h-full w-px" style={{ left: "75%", background: "#f8514940" }} />
      </div>
      <div className="flex justify-between font-mono text-[8px]" style={{ color: "#3d4450" }}>
        <span>0B</span>
        <span style={{ marginLeft: "72%" }}>75%</span>
        <span>{(total / 1024).toFixed(1)}KB</span>
      </div>
    </div>
  )
}

export function MemoryGauge() {
  const { vizData, platform, theme } = useEmbedViz()
  const isDark = theme === "dark"
  const memory = (vizData as any).memory
  const memoryWarnings = (vizData as any).memoryWarnings || []

  const bg = isDark ? "#0a0e14" : "#ffffff"
  const border = isDark ? "#1c2530" : "#d0d8e4"
  const headerBg = isDark ? "#0d1117" : "#f8fafc"
  const textMuted = isDark ? "#6b7280" : "#8090a0"

  const sram = memory?.sram || 0
  const sramTotal = memory?.sramTotal || 2048
  const flash = memory?.flash || 0
  const flashTotal = memory?.flashTotal || 32768
  const freeRam = sramTotal - sram

  return (
    <div className="flex flex-col h-full" style={{ background: bg }}>
      {/* Header */}
      <div className="flex items-center justify-between h-8 px-3 shrink-0"
        style={{ borderBottom: "1px solid " + border, background: headerBg }}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#bc8cff]" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: isDark ? "#c5cdd8" : "#2a3a4a" }}>
            Memory Estimate
          </span>
        </div>
        <span className="font-mono text-[10px] font-bold" style={{ color: "#00e5ff" }}>
          {platform || "Arduino Nano"}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 px-3 py-3 flex flex-col gap-3 overflow-auto">
        <GaugeBar label="SRAM (Global Variables)" used={sram} total={sramTotal} color="#00e5ff" />
        <GaugeBar label="Flash (Program Storage)" used={flash} total={flashTotal} color="#56d364" />

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mt-1">
          {[
            { label: 'Free RAM', value: freeRam + 'B', color: freeRam < 512 ? '#f85149' : '#56d364' },
            { label: 'SRAM Used', value: sram + 'B', color: '#00e5ff' },
            { label: 'Flash Used', value: flash + 'B', color: '#bc8cff' },
          ].map(stat => (
            <div key={stat.label} className="flex flex-col items-center gap-0.5 p-2 rounded-lg"
              style={{ background: stat.color + "10", border: "1px solid " + stat.color + "25" }}>
              <span className="font-mono text-[10px] font-bold" style={{ color: stat.color }}>{stat.value}</span>
              <span className="font-mono text-[8px]" style={{ color: textMuted }}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Warnings */}
        {memoryWarnings.length > 0 && (
          <div className="flex flex-col gap-1">
            {memoryWarnings.map((w: any, i: number) => (
              <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded-lg font-mono text-[9px]"
                style={{
                  background: w.severity === 'ERROR' ? "#f8514910" : "#ffa65710",
                  border: "1px solid " + (w.severity === 'ERROR' ? "#f8514930" : "#ffa65730"),
                  color: w.severity === 'ERROR' ? "#f85149" : "#ffa657"
                }}>
                <span>{w.severity === 'ERROR' ? '⚠' : '!'}</span>
                <span>{w.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="h-6 px-3 shrink-0 flex items-center justify-between"
        style={{ borderTop: "1px solid " + border, background: headerBg }}>
        <span className="font-mono text-[9px]" style={{ color: textMuted }}>Static analysis only</span>
        <span className="font-mono text-[9px]" style={{ color: freeRam < 512 ? '#f85149' : '#6b7280' }}>
          Free RAM: ~{freeRam}B
        </span>
      </div>
    </div>
  )
}
