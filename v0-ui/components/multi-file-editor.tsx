"use client"

import { useState, useRef, useEffect } from "react"
import { useEmbedViz } from "./embedviz-context"
import { Plus, X, Upload, FileCode, Download } from "lucide-react"

interface TabFile {
  id: string
  name: string
  code: string
  active: boolean
}

const DEFAULT_CODE = `// sketch.ino
// EmbedViz — Embedded Visualizer

void setup() {
  Serial.begin(9600);
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}
`

export function MultiFileEditor() {
  const { theme, sendCode } = useEmbedViz() as any
  const isDark = theme === "dark"
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [files, setFiles] = useState<TabFile[]>([
    { id: "main", name: "sketch.ino", code: DEFAULT_CODE, active: true }
  ])

  const bg = isDark ? "#0d1117" : "#ffffff"
  const border = isDark ? "#1c2530" : "#d0d8e4"
  const headerBg = isDark ? "#0a0e14" : "#f8fafc"
  const textMuted = isDark ? "#6b7280" : "#8090a0"
  const textPrimary = isDark ? "#c5cdd8" : "#2a3a4a"
  const codeBg = isDark ? "#0a0e14" : "#f8fafc"

  const activeFile = files.find(f => f.active) || files[0]

  // Sync merged code to global window var whenever files change
  useEffect(() => {
    const merged = files.map(f => `// === ${f.name} ===\n${f.code}`).join("\n\n")
    if (typeof window !== "undefined") (window as any).__embedviz_code = merged
  }, [files])

  const setActive = (id: string) => {
    setFiles(prev => prev.map(f => ({ ...f, active: f.id === id })))
  }

  const addFile = () => {
    const name = prompt("File name (e.g. helpers.ino):")
    if (!name) return
    const id = "file_" + Date.now()
    setFiles(prev => [
      ...prev.map(f => ({ ...f, active: false })),
      { id, name: name.endsWith(".ino") || name.endsWith(".h") || name.endsWith(".cpp") ? name : name + ".ino", code: `// ${name}\n\n`, active: true }
    ])
  }

  const removeFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (files.length === 1) return
    setFiles(prev => {
      const idx = prev.findIndex(f => f.id === id)
      const filtered = prev.filter(f => f.id !== id)
      if (prev[idx]?.active && filtered.length > 0) filtered[Math.max(0, idx - 1)].active = true
      return filtered
    })
  }

  const updateCode = (code: string) => {
    setFiles(prev => prev.map(f => f.active ? { ...f, code } : f))
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files
    if (!uploadedFiles) return
    Array.from(uploadedFiles).forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => {
        const code = ev.target?.result as string
        const id = "file_" + Date.now() + Math.random()
        setFiles(prev => [
          ...prev.map(f => ({ ...f, active: false })),
          { id, name: file.name, code, active: true }
        ])
      }
      reader.readAsText(file)
    })
    e.target.value = ""
  }

  const downloadMerged = () => {
    const merged = files.map(f => `// === ${f.name} ===\n${f.code}`).join("\n\n")
    const blob = new Blob([merged], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "project_merged.ino"
    a.click()
    URL.revokeObjectURL(url)
  }

  // Tab key support
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault()
      const ta = textareaRef.current
      if (!ta) return
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const newCode = activeFile.code.substring(0, start) + "  " + activeFile.code.substring(end)
      updateCode(newCode)
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 2 }, 0)
    }
  }

  const lineCount = (activeFile?.code || "").split('\n').length

  return (
    <div className="flex flex-col h-full" style={{ background: bg }}>

      {/* Tab bar */}
      <div className="flex items-center h-8 shrink-0 overflow-x-auto"
        style={{ borderBottom: "1px solid " + border, background: headerBg }}>
        <div className="flex items-center flex-1 min-w-0 overflow-x-auto">
          {files.map(file => (
            <div key={file.id} onClick={() => setActive(file.id)}
              className="flex items-center gap-1.5 px-3 h-full shrink-0 cursor-pointer transition-all group"
              style={{
                borderRight: "1px solid " + border,
                background: file.active ? bg : "transparent",
                borderBottom: file.active ? "2px solid #00e5ff" : "2px solid transparent",
              }}>
              <FileCode className="h-3 w-3 shrink-0" style={{ color: file.active ? "#00e5ff" : textMuted }} />
              <span className="font-mono text-[10px] font-bold whitespace-nowrap max-w-[90px] truncate"
                style={{ color: file.active ? textPrimary : textMuted }}>
                {file.name}
              </span>
              {files.length > 1 && (
                <button onClick={e => removeFile(file.id, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 hover:bg-red-500/20 ml-0.5">
                  <X size={9} color="#f85149" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1 px-2 shrink-0" style={{ borderLeft: "1px solid " + border }}>
          <button onClick={addFile} title="New file"
            className="p-1 rounded hover:bg-white/10 transition-colors">
            <Plus className="h-3.5 w-3.5" style={{ color: textMuted }} />
          </button>
          <button onClick={() => fileInputRef.current?.click()} title="Upload .ino file"
            className="p-1 rounded hover:bg-white/10 transition-colors">
            <Upload className="h-3.5 w-3.5" style={{ color: textMuted }} />
          </button>
          <input ref={fileInputRef} type="file" accept=".ino,.cpp,.c,.h" multiple
            className="hidden" onChange={handleUpload} />
          {files.length > 1 && (
            <button onClick={downloadMerged} title="Download merged file"
              className="flex items-center gap-1 font-mono text-[9px] font-bold px-2 py-0.5 rounded transition-all hover:opacity-80"
              style={{ background: "#56d36420", color: "#56d364", border: "1px solid #56d36440" }}>
              <Download className="h-3 w-3" />
              MERGE
            </button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-2 px-3 h-5 shrink-0"
        style={{ borderBottom: "1px solid " + border + "60", background: headerBg }}>
        <span className="font-mono text-[9px]" style={{ color: textMuted }}>{activeFile?.name}</span>
        <span style={{ color: border }}>·</span>
        <span className="font-mono text-[9px]" style={{ color: textMuted }}>{lineCount} lines</span>
        {files.length > 1 && (
          <>
            <span style={{ color: border }}>·</span>
            <span className="font-mono text-[9px]" style={{ color: "#00e5ff" }}>
              {files.length} files · {files.reduce((a, f) => a + f.code.split('\n').length, 0)} total lines
            </span>
          </>
        )}
        <span className="ml-auto font-mono text-[9px]" style={{ color: textMuted }}>Arduino C/C++</span>
      </div>

      {/* Editor */}
      <div className="flex flex-1 overflow-hidden">
        {/* Line numbers */}
        <div className="select-none shrink-0 pt-2 px-2 overflow-hidden text-right"
          style={{ background: codeBg, borderRight: "1px solid " + border, minWidth: "34px" }}>
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="font-mono leading-5"
              style={{ fontSize: "10px", color: textMuted, lineHeight: "20px" }}>
              {i + 1}
            </div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={activeFile?.code || ""}
          onChange={e => updateCode(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 p-2 font-mono resize-none outline-none leading-5"
          style={{
            background: codeBg,
            color: textPrimary,
            caretColor: "#00e5ff",
            fontSize: "11px",
            lineHeight: "20px",
            tabSize: 2,
          }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between h-5 px-3 shrink-0"
        style={{ borderTop: "1px solid " + border, background: headerBg }}>
        <span className="font-mono text-[9px]" style={{ color: textMuted }}>
          {files.length} {files.length === 1 ? "file" : "files"} open
        </span>
        <span className="font-mono text-[9px]" style={{ color: "#00e5ff" }}>
          {(activeFile?.code || "").length} chars
        </span>
      </div>
    </div>
  )
}
