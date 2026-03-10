"use client"

import { useState } from "react"
import { useEmbedViz } from "./embedviz-context"
import { X, Download, GitCompare, Check, Copy } from "lucide-react"

function applyOptimizations(code: string, suggestions: any[]): { optimized: string; changes: string[] } {
  let optimized = code
  const changes: string[] = []

  // 1. Add volatile to ISR variables if missing
  if (suggestions.some((s: any) => s.type === 'ISR_WARNING' && s.message.includes('volatile'))) {
    const boolVarMatch = code.match(/bool\s+(\w*[Tt]riggered\w*)\s*=/)
    if (boolVarMatch && !code.includes('volatile bool ' + boolVarMatch[1])) {
      optimized = optimized.replace('bool ' + boolVarMatch[1], 'volatile bool ' + boolVarMatch[1])
      changes.push('Added volatile to ' + boolVarMatch[1])
    }
  }

  // 2. Replace delay() with millis() pattern comment
  if (suggestions.some((s: any) => s.type === 'PERFORMANCE')) {
    const delayMatches = optimized.match(/delay\s*\(\s*(\d+)\s*\)/g)
    if (delayMatches) {
      delayMatches.forEach(d => {
        const ms = d.match(/\d+/)?.[0]
        optimized = optimized.replace(d, d + ' /* TODO: replace with millis() for non-blocking — ' + ms + 'ms */')
      })
      changes.push('Added millis() TODO comments for ' + delayMatches.length + ' delay() calls')
    }
  }

  // 3. Replace int with byte for small pin numbers
  if (suggestions.some((s: any) => s.type === 'MEMORY')) {
    const intPinMatches = optimized.match(/int\s+(\w+Pin)\s*=\s*(\d+)\s*;/g)
    if (intPinMatches) {
      intPinMatches.forEach(m => {
        const val = parseInt(m.match(/=\s*(\d+)/)?.[1] || '999')
        if (val <= 255) {
          optimized = optimized.replace(m, m.replace('int ', 'const uint8_t '))
          changes.push('int → const uint8_t for pin variable (saves 1B each)')
        }
      })
    }
  }

  // 4. Add Serial.begin if missing
  if (suggestions.some((s: any) => s.type === 'BUG' && s.message.includes('Serial.begin'))) {
    if (!optimized.includes('Serial.begin') && optimized.includes('void setup()')) {
      optimized = optimized.replace('void setup() {', 'void setup() {\n  Serial.begin(9600); // Added by EmbedViz')
      changes.push('Added missing Serial.begin(9600) in setup()')
    }
  }

  // 5. Add header comment
  const header = `// ============================================
// Optimized by EmbedViz — Embedded Visualizer
// Generated: ${new Date().toLocaleString()}
// Changes applied: ${changes.length}
// ============================================\n\n`
  optimized = header + optimized

  return { optimized, changes }
}

// Diff computation — line by line
function computeDiff(original: string, optimized: string): { type: 'same' | 'add' | 'remove'; text: string }[] {
  const origLines = original.split('\n')
  const optLines = optimized.split('\n')
  const result: { type: 'same' | 'add' | 'remove'; text: string }[] = []

  const maxLen = Math.max(origLines.length, optLines.length)
  for (let i = 0; i < maxLen; i++) {
    const o = origLines[i]
    const n = optLines[i]
    if (o === undefined) {
      result.push({ type: 'add', text: n })
    } else if (n === undefined) {
      result.push({ type: 'remove', text: o })
    } else if (o !== n) {
      result.push({ type: 'remove', text: o })
      result.push({ type: 'add', text: n })
    } else {
      result.push({ type: 'same', text: o })
    }
  }
  return result
}

export function CodeExport({ onClose }: { onClose: () => void }) {
  const { vizData, platform, theme } = useEmbedViz()
  const isDark = theme === "dark"
  const suggestions = (vizData as any).suggestions || []
  const originalCode = typeof window !== "undefined" ? (window as any).__embedviz_code || "" : ""

  const [tab, setTab] = useState<"export" | "diff">("export")
  const [copied, setCopied] = useState(false)

  const { optimized, changes } = applyOptimizations(originalCode, suggestions)
  const diff = computeDiff(originalCode, optimized)

  const bg = isDark ? "#0d1117" : "#ffffff"
  const border = isDark ? "#1c2530" : "#d0d8e4"
  const headerBg = isDark ? "#0a0e14" : "#f8fafc"
  const textPrimary = isDark ? "#c5cdd8" : "#2a3a4a"
  const textMuted = isDark ? "#6b7280" : "#8090a0"
  const codeBg = isDark ? "#0a0e14" : "#f8fafc"

  const handleDownload = () => {
    const blob = new Blob([optimized], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sketch_optimized.ino'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(optimized)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.88)" }}>
      <div className="flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ width: "780px", height: "85vh", background: bg, border: "1px solid " + border }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ borderBottom: "1px solid " + border, background: headerBg }}>
          <div className="flex items-center gap-3">
            <Download className="h-4 w-4 text-[#56d364]" />
            <span className="font-mono font-bold text-sm uppercase tracking-widest text-[#56d364]">
              Code Export
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: "#56d36415", color: "#56d364", border: "1px solid #56d36430" }}>
              {changes.length} optimizations
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Tabs */}
            <button onClick={() => setTab("export")}
              className="font-mono text-[10px] font-bold px-3 py-1 rounded-lg transition-all"
              style={{ background: tab === "export" ? "#56d36420" : "transparent", color: tab === "export" ? "#56d364" : textMuted, border: "1px solid " + (tab === "export" ? "#56d36440" : "transparent") }}>
              Export
            </button>
            <button onClick={() => setTab("diff")}
              className="font-mono text-[10px] font-bold px-3 py-1 rounded-lg transition-all"
              style={{ background: tab === "diff" ? "#00e5ff20" : "transparent", color: tab === "diff" ? "#00e5ff" : textMuted, border: "1px solid " + (tab === "diff" ? "#00e5ff40" : "transparent") }}>
              Diff View
            </button>
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-red-500/20 transition-colors">
              <X size={18} color="#f85149" />
            </button>
          </div>
        </div>

        {/* Export Tab */}
        {tab === "export" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Changes list */}
            {changes.length > 0 && (
              <div className="px-5 py-3 shrink-0" style={{ borderBottom: "1px solid " + border }}>
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: textMuted }}>
                  Applied Optimizations
                </p>
                <div className="flex flex-col gap-1">
                  {changes.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 font-mono text-[10px]">
                      <Check className="h-3 w-3 text-[#56d364] shrink-0" />
                      <span style={{ color: textPrimary }}>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Code preview */}
            <div className="flex-1 overflow-auto p-4" style={{ background: codeBg }}>
              <pre className="font-mono text-[10px] leading-5 whitespace-pre-wrap"
                style={{ color: isDark ? "#c5cdd8" : "#2a3a4a" }}>
                {optimized}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 px-5 py-3 shrink-0"
              style={{ borderTop: "1px solid " + border, background: headerBg }}>
              <button onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-bold transition-all hover:scale-105"
                style={{ background: "#56d36420", color: "#56d364", border: "1px solid #56d36440" }}>
                <Download className="h-4 w-4" />
                Download sketch_optimized.ino
              </button>
              <button onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-2 rounded-xl font-mono text-[11px] transition-all hover:opacity-80"
                style={{ background: "#00e5ff15", color: "#00e5ff", border: "1px solid #00e5ff30" }}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>
              <span className="font-mono text-[10px] ml-auto" style={{ color: textMuted }}>
                Platform: {platform || "Arduino Nano"}
              </span>
            </div>
          </div>
        )}

        {/* Diff Tab */}
        {tab === "diff" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Legend */}
            <div className="flex items-center gap-4 px-5 py-2 shrink-0"
              style={{ borderBottom: "1px solid " + border }}>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: "#f8514920", border: "1px solid #f8514950" }} />
                <span className="font-mono text-[10px]" style={{ color: "#f85149" }}>Removed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: "#56d36420", border: "1px solid #56d36450" }} />
                <span className="font-mono text-[10px]" style={{ color: "#56d364" }}>Added</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: isDark ? "#1c2530" : "#e2e8f0" }} />
                <span className="font-mono text-[10px]" style={{ color: textMuted }}>Unchanged</span>
              </div>
              <span className="ml-auto font-mono text-[10px]" style={{ color: textMuted }}>
                {diff.filter(d => d.type !== 'same').length} changed lines
              </span>
            </div>

            {/* Diff view */}
            <div className="flex-1 overflow-auto p-4" style={{ background: codeBg }}>
              {diff.map((line, i) => (
                <div key={i} className="flex items-start font-mono text-[10px] leading-5 rounded px-2"
                  style={{
                    background: line.type === 'add' ? "#56d36415" : line.type === 'remove' ? "#f8514915" : "transparent",
                    borderLeft: line.type === 'add' ? "2px solid #56d364" : line.type === 'remove' ? "2px solid #f85149" : "2px solid transparent"
                  }}>
                  <span className="w-4 shrink-0 select-none mr-2" style={{
                    color: line.type === 'add' ? "#56d364" : line.type === 'remove' ? "#f85149" : "#3d4450"
                  }}>
                    {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                  </span>
                  <span style={{ color: line.type === 'add' ? "#56d364" : line.type === 'remove' ? "#f85149aa" : textPrimary }}>
                    {line.text || ' '}
                  </span>
                </div>
              ))}
            </div>

            {/* Download from diff tab too */}
            <div className="flex items-center gap-3 px-5 py-3 shrink-0"
              style={{ borderTop: "1px solid " + border, background: headerBg }}>
              <button onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-bold transition-all hover:scale-105"
                style={{ background: "#56d36420", color: "#56d364", border: "1px solid #56d36440" }}>
                <Download className="h-4 w-4" />
                Download Optimized .ino
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
