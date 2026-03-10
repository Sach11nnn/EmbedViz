"use client"

import { useState, useEffect } from "react"
import { Save, FolderOpen, Trash2, X, Clock, AlertTriangle, HardDrive, Copy, Check } from "lucide-react"
import { saveSession, getSessions, deleteSession, SavedSession } from "@/lib/session-service"
import { useEmbedViz } from "./embedviz-context"

interface SessionsPanelProps {
  currentCode: string
  onLoadSession: (code: string) => void
  onClose: () => void
}

export function SessionsPanel({ currentCode, onLoadSession, onClose }: SessionsPanelProps) {
  const { platform, theme } = useEmbedViz()
  const isDark = theme === "dark"
  const [sessions, setSessions] = useState<SavedSession[]>([])
  const [saveName, setSaveName] = useState("")
  const [saveMsg, setSaveMsg] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const bg = isDark ? "#0a0e14" : "#ffffff"
  const border = isDark ? "#1c2530" : "#d0d8e4"
  const headerBg = isDark ? "#0d1117" : "#f8fafc"
  const textPrimary = isDark ? "#c5cdd8" : "#2a3a4a"
  const textMuted = isDark ? "#6b7280" : "#8090a0"

  useEffect(() => { setSessions(getSessions()) }, [])

  const handleSave = () => {
    if (!saveName.trim()) { setSaveMsg("Enter a name first!"); return }
    saveSession(saveName.trim(), currentCode, platform)
    setSessions(getSessions())
    setSaveName("")
    setSaveMsg("✓ Saved!")
    setTimeout(() => setSaveMsg(""), 2000)
  }

  const handleDeleteConfirm = (id: string) => {
    deleteSession(id)
    setSessions(getSessions())
    setDeleteConfirm(null)
  }

  const handleExport = () => {
    const data = JSON.stringify(getSessions(), null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "embedviz_sessions_" + new Date().toISOString().split("T")[0] + ".json"
    a.click()
  }

  const handleImport = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = (e: any) => {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev: any) => {
        try {
          const imported: SavedSession[] = JSON.parse(ev.target.result)
          const existing = getSessions()
          const merged = [...imported, ...existing].filter(
            (s, i, arr) => arr.findIndex(x => x.id === s.id) === i
          ).slice(0, 50)
          localStorage.setItem("embedviz_sessions_local", JSON.stringify(merged))
          setSessions(getSessions())
          setSaveMsg("✓ Imported " + imported.length + " sessions!")
          setTimeout(() => setSaveMsg(""), 3000)
        } catch { setSaveMsg("Invalid file!") }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
        <div className="relative w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[85vh]"
          style={{ background: bg, border: "1px solid " + border }}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 shrink-0"
            style={{ borderBottom: "1px solid " + border, background: headerBg, borderRadius: "16px 16px 0 0" }}>
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-[#00e5ff]" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider" style={{ color: textPrimary }}>
                My Sessions
              </span>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded"
                style={{ background: "rgba(0,229,255,0.1)", color: "#00e5ff", border: "1px solid rgba(0,229,255,0.2)" }}>
                {sessions.length} saved
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={handleExport}
                className="flex items-center gap-1 px-2 py-1 rounded font-mono text-[9px] transition-all hover:opacity-80"
                style={{ color: "#56d364", background: "rgba(86,211,100,0.08)", border: "1px solid rgba(86,211,100,0.2)" }}>
                <Save className="h-3 w-3" /> Export
              </button>
              <button onClick={handleImport}
                className="flex items-center gap-1 px-2 py-1 rounded font-mono text-[9px] transition-all hover:opacity-80"
                style={{ color: "#ffa657", background: "rgba(255,166,87,0.08)", border: "1px solid rgba(255,166,87,0.2)" }}>
                <HardDrive className="h-3 w-3" /> Import
              </button>
              <button onClick={onClose} className="p-1 rounded hover:bg-white/10 transition-colors" style={{ color: textMuted }}>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Save new */}
          <div className="px-5 py-3 shrink-0" style={{ borderBottom: "1px solid " + border }}>
            <div className="flex gap-2">
              <input
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSave()}
                placeholder="Session name (e.g. LED Blink v1)"
                className="flex-1 px-3 py-2 rounded-lg font-mono text-[11px] outline-none transition-all"
                style={{ background: isDark ? "#131920" : "#f0f4f8", border: "1px solid " + border, color: textPrimary }}
              />
              <button onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-mono text-[11px] font-bold transition-all hover:opacity-80"
                style={{ background: "rgba(0,229,255,0.12)", color: "#00e5ff", border: "1px solid rgba(0,229,255,0.3)" }}>
                <Save className="h-3.5 w-3.5" /> Save
              </button>
            </div>
            {saveMsg && (
              <div className="mt-1.5 font-mono text-[10px]"
                style={{ color: saveMsg.startsWith("✓") ? "#56d364" : "#f85149" }}>
                {saveMsg}
              </div>
            )}
          </div>

          {/* Sessions list */}
          <div className="flex-1 overflow-auto">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: isDark ? "#131920" : "#f0f4f8" }}>
                  <FolderOpen className="h-6 w-6" style={{ color: isDark ? "#2a3f5f" : "#d0d8e4" }} />
                </div>
                <span className="font-mono text-[11px]" style={{ color: textMuted }}>No saved sessions yet</span>
                <span className="font-mono text-[10px]" style={{ color: isDark ? "#3d4450" : "#b0c0d0" }}>
                  Type a name above and press Enter
                </span>
              </div>
            ) : (
              sessions.map((session) => (
                <div key={session.id}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/5"
                  style={{ borderBottom: "1px solid " + (isDark ? "#0f1520" : "#f0f4f8") }}>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { onLoadSession(session.code); onClose() }}>
                    <div className="font-mono text-[11px] font-medium truncate" style={{ color: textPrimary }}>
                      {session.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded"
                        style={{ color: "#00e5ff", background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.15)" }}>
                        {session.platform}
                      </span>
                      <span className="font-mono text-[9px] flex items-center gap-1" style={{ color: textMuted }}>
                        <Clock className="h-2.5 w-2.5" />{session.createdAt}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => { onLoadSession(session.code); onClose() }}
                      className="flex items-center gap-1 px-2 py-1 rounded font-mono text-[9px] transition-all hover:opacity-80"
                      style={{ color: "#00e5ff", background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)" }}>
                      <FolderOpen className="h-3 w-3" /> Load
                    </button>
                    <button onClick={() => setDeleteConfirm(session.id)}
                      className="p-1 rounded transition-all hover:text-[#f85149] hover:bg-red-500/10"
                      style={{ color: textMuted }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-2 shrink-0 font-mono text-[9px] flex items-center gap-1.5"
            style={{ borderTop: "1px solid " + border, color: textMuted, background: headerBg, borderRadius: "0 0 16px 16px" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-[#56d364]" />
            All sessions saved locally on your PC — never uploaded to cloud
          </div>
        </div>
      </div>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-xs rounded-2xl p-5 shadow-2xl"
            style={{ background: "#0d1117", border: "1px solid #2a3f5f" }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-[#ffa657]" />
              <span className="font-mono text-[11px] font-bold text-[#c5cdd8]">Delete Session?</span>
            </div>
            <p className="font-mono text-[10px] text-[#6b7280] mb-4">
              This will permanently delete this session. Cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 rounded-lg font-mono text-[11px] transition-all hover:opacity-80"
                style={{ background: "#131920", color: "#6b7280", border: "1px solid #1c2530" }}>
                Cancel
              </button>
              <button onClick={() => handleDeleteConfirm(deleteConfirm)}
                className="flex-1 py-2 rounded-lg font-mono text-[11px] font-bold transition-all hover:opacity-80"
                style={{ background: "rgba(248,81,73,0.12)", color: "#f85149", border: "1px solid rgba(248,81,73,0.3)" }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
