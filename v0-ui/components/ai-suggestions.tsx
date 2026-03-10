"use client"

import { useState } from "react"
import { useEmbedViz } from "./embedviz-context"
import { X, Sparkles, Loader2, AlertTriangle, Info, Zap, Shield, Cpu, TrendingUp } from "lucide-react"

interface Suggestion {
  type: string
  message: string
  line?: number | null
}

interface AIResult {
  summary: string
  suggestions: Suggestion[]
  optimizedTips: string[]
  score: number
}

const TYPE_CONFIG: Record<string, { color: string; icon: any }> = {
  ERROR:       { color: "#f85149", icon: AlertTriangle },
  WARNING:     { color: "#ffa657", icon: AlertTriangle },
  PERFORMANCE: { color: "#bc8cff", icon: Zap },
  MEMORY:      { color: "#ffa657", icon: Cpu },
  SECURITY:    { color: "#f85149", icon: Shield },
  INFO:        { color: "#00e5ff", icon: Info },
  ISR_ERROR:   { color: "#f85149", icon: AlertTriangle },
  ISR_WARNING: { color: "#ffa657", icon: AlertTriangle },
  ESP32:       { color: "#56d364", icon: Cpu },
}

function ScoreRing({ score }: { score: number }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const color = score >= 80 ? "#56d364" : score >= 60 ? "#ffa657" : "#f85149"
  return (
    <div className="relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#1c2530" strokeWidth="5" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={circ - fill}
          strokeLinecap="round" transform="rotate(-90 36 36)"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono font-bold text-sm" style={{ color }}>{score}</span>
        <span className="font-mono text-[8px]" style={{ color: "#6b7280" }}>SCORE</span>
      </div>
    </div>
  )
}

export function AISuggestions({ onClose }: { onClose: () => void }) {
  const { vizData, platform, theme } = useEmbedViz()
  const isDark = theme === "dark"
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AIResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const data = vizData as any
  const code = (window as any).__embedviz_code || ""

  const bg = isDark ? "#0d1117" : "#ffffff"
  const border = isDark ? "#1c2530" : "#d0d8e4"
  const headerBg = isDark ? "#0a0e14" : "#f8fafc"
  const textPrimary = isDark ? "#c5cdd8" : "#2a3a4a"
  const textMuted = isDark ? "#6b7280" : "#8090a0"

  const analyze = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const response = await fetch("http://localhost:8080/api/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          platform,
          conflicts: data.conflicts || [],
          timingIssues: data.timingIssues || [],
          memoryWarnings: data.memoryWarnings || []
        })
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "AI request failed")
      }
      const res = await response.json()
      setResult(res)
    } catch (e: any) {
      setError(e.message || "Failed to get AI suggestions")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.88)" }}>
      <div className="flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ width: "680px", maxHeight: "85vh", background: bg, border: "1px solid " + border }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ borderBottom: "1px solid " + border, background: headerBg }}>
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-[#bc8cff]" />
            <span className="font-mono font-bold text-sm uppercase tracking-widest"
              style={{ color: "#bc8cff" }}>AI Code Analysis</span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: "#bc8cff15", color: "#bc8cff", border: "1px solid #bc8cff30" }}>
              Powered by Groq
            </span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-red-500/20 transition-colors">
            <X size={18} color="#f85149" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">
          {!result && !loading && !error && (
            <div className="flex flex-col items-center justify-center gap-5 py-10">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "#bc8cff15", border: "1px solid #bc8cff30" }}>
                <Sparkles className="h-8 w-8 text-[#bc8cff]" />
              </div>
              <div className="text-center">
                <p className="font-mono font-bold text-sm" style={{ color: textPrimary }}>
                  AI-Powered Code Analysis
                </p>
                <p className="font-mono text-[11px] mt-1" style={{ color: textMuted }}>
                  Get intelligent suggestions, security checks, and optimization tips
                </p>
              </div>
              <div className="flex flex-col gap-2 text-left w-full max-w-sm">
                {[
                  "Memory optimization suggestions",
                  "ISR & timing best practices",
                  "Security vulnerability checks",
                  "Code quality score"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 font-mono text-[11px]"
                    style={{ color: textMuted }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#bc8cff]" />
                    {item}
                  </div>
                ))}
              </div>
              <button onClick={analyze}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-mono text-sm font-bold transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #bc8cff22, #00e5ff22)", color: "#bc8cff", border: "1px solid #bc8cff40" }}>
                <Sparkles className="h-4 w-4" />
                Analyze with Groq AI
              </button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <Loader2 className="h-10 w-10 animate-spin text-[#bc8cff]" />
              <p className="font-mono text-sm" style={{ color: textMuted }}>Analyzing your code...</p>
              <p className="font-mono text-[10px]" style={{ color: isDark ? "#3d4450" : "#b0c0d0" }}>
                Claude is reviewing for issues, optimizations & security
              </p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="p-3 rounded-xl" style={{ background: "#f8514915", border: "1px solid #f8514930" }}>
                <AlertTriangle className="h-8 w-8 text-[#f85149]" />
              </div>
              <p className="font-mono text-sm text-[#f85149]">{error}</p>
              <p className="font-mono text-[10px]" style={{ color: textMuted }}>
                Check backend is running and ANTHROPIC_API_KEY is set in .env
              </p>
              <button onClick={analyze}
                className="font-mono text-[11px] px-4 py-1.5 rounded-lg transition-colors"
                style={{ background: "#f8514915", color: "#f85149", border: "1px solid #f8514930" }}>
                Try Again
              </button>
            </div>
          )}

          {result && (
            <div className="flex flex-col gap-4">
              {/* Summary + Score */}
              <div className="flex items-center gap-4 p-4 rounded-xl"
                style={{ background: isDark ? "#161b22" : "#f1f5f9", border: "1px solid " + border }}>
                <ScoreRing score={result.score || 0} />
                <div className="flex-1">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: "#bc8cff" }}>AI Summary</p>
                  <p className="font-mono text-[12px]" style={{ color: textPrimary }}>{result.summary}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="font-mono text-[9px]" style={{ color: textMuted }}>
                      {result.suggestions?.length || 0} suggestions
                    </span>
                    <span className="font-mono text-[9px]" style={{ color: textMuted }}>â€¢</span>
                    <span className="font-mono text-[9px]" style={{ color: textMuted }}>
                      {result.optimizedTips?.length || 0} tips
                    </span>
                  </div>
                </div>
                <button onClick={analyze}
                  className="font-mono text-[9px] px-2 py-1 rounded-lg transition-colors"
                  style={{ background: "#bc8cff15", color: "#bc8cff", border: "1px solid #bc8cff30" }}>
                  Re-analyze
                </button>
              </div>

              {/* Suggestions */}
              {result.suggestions?.length > 0 && (
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider mb-2"
                    style={{ color: textMuted }}>Issues & Suggestions</p>
                  <div className="flex flex-col gap-2">
                    {result.suggestions.map((s, i) => {
                      const cfg = TYPE_CONFIG[s.type] || TYPE_CONFIG["INFO"]
                      const Icon = cfg.icon
                      return (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg"
                          style={{ background: cfg.color + "10", border: "1px solid " + cfg.color + "25" }}>
                          <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: cfg.color }} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-mono text-[9px] font-bold px-1 rounded"
                                style={{ color: cfg.color, background: cfg.color + "20" }}>{s.type}</span>
                              {s.line && <span className="font-mono text-[9px]" style={{ color: textMuted }}>Line {s.line}</span>}
                            </div>
                            <p className="font-mono text-[11px]" style={{ color: textPrimary }}>{s.message}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Optimization Tips */}
              {result.optimizedTips?.length > 0 && (
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider mb-2"
                    style={{ color: textMuted }}>Optimization Tips</p>
                  <div className="flex flex-col gap-1.5">
                    {result.optimizedTips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg"
                        style={{ background: "#56d36410", border: "1px solid #56d36425" }}>
                        <TrendingUp className="h-3 w-3 shrink-0 mt-0.5 text-[#56d364]" />
                        <p className="font-mono text-[11px]" style={{ color: textPrimary }}>{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


