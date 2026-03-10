"use client"

import { useState, useEffect, useRef } from "react"
import { File, Play, Square, RotateCcw, FolderOpen, Plus, X, Upload, Download, FileCode } from "lucide-react"
import dynamic from "next/dynamic"
import { useEmbedViz } from "./embedviz-context"
import { autoSave, loadAutoSave } from "@/lib/session-service"
import { auth } from "@/lib/firebase"
import { SessionsPanel } from "./sessions-panel"

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false })

const DEFAULT_CODE = `#include <Arduino.h>

int ledPin = 13;
int sensorValue = 0;

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(115200);
}

void loop() {
  sensorValue = analogRead(A0);
  Serial.print("SENSOR:");
  Serial.println(sensorValue);

  if (sensorValue > 512) {
    digitalWrite(ledPin, HIGH);
    Serial.println("LED:HIGH");
  } else {
    digitalWrite(ledPin, LOW);
    Serial.println("LED:LOW");
  }
  delay(500);
}
`

interface TabFile {
  id: string
  name: string
  code: string
}

export function CodeEditor() {
  const { sendMessage, theme, platform } = useEmbedViz()
  const isDark = theme === "dark"
  const [files, setFiles] = useState<TabFile[]>([{ id: "main", name: "sketch.ino", code: DEFAULT_CODE }])
  const [activeId, setActiveId] = useState("main")
  const [isRunning, setIsRunning] = useState(true)
  const [activeLine, setActiveLine] = useState(1)
  const [showSessions, setShowSessions] = useState(false)
  const [saveIndicator, setSaveIndicator] = useState("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeFile = files.find(f => f.id === activeId) || files[0]
  const code = activeFile?.code || ""

  const getMergedCode = (allFiles = files) =>
    allFiles.map(f => `// === ${f.name} ===\n${f.code}`).join("\n\n")

  // Load autosave on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = loadAutoSave()
      const initialCode = saved?.code || DEFAULT_CODE
      if (saved) {
        setFiles([{ id: "main", name: "sketch.ino", code: initialCode }])
        setSaveIndicator("Auto-restored: " + saved.savedAt)
        setTimeout(() => setSaveIndicator(""), 3000)
      }
      ;(window as any).__embedviz_code = initialCode
      sendMessage({ type: "PARSE", code: initialCode })
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  const handleCodeChange = (value: string | undefined, allFiles?: TabFile[]) => {
    const newCode = value || ""
    const updatedFiles = allFiles || files.map(f => f.id === activeId ? { ...f, code: newCode } : f)
    const merged = getMergedCode(updatedFiles)
    ;(window as any).__embedviz_code = merged

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      sendMessage({ type: "PARSE", code: merged })
    }, 300)

    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(() => {
      if (auth.currentUser) {
        autoSave(merged, platform)
        setSaveIndicator("Auto-saved")
        setTimeout(() => setSaveIndicator(""), 1500)
      }
    }, 2000)
  }

  const updateActiveCode = (value: string | undefined) => {
    const newCode = value || ""
    const updated = files.map(f => f.id === activeId ? { ...f, code: newCode } : f)
    setFiles(updated)
    handleCodeChange(newCode, updated)
  }

  const addFile = () => {
    const name = prompt("File name (e.g. helpers.ino):")
    if (!name) return
    const id = "file_" + Date.now()
    const finalName = name.endsWith(".ino") || name.endsWith(".h") || name.endsWith(".cpp") ? name : name + ".ino"
    const newFile = { id, name: finalName, code: `// ${finalName}\n\n` }
    const updated = [...files, newFile]
    setFiles(updated)
    setActiveId(id)
    handleCodeChange(newFile.code, updated)
  }

  const removeFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (files.length === 1) return
    const idx = files.findIndex(f => f.id === id)
    const updated = files.filter(f => f.id !== id)
    if (activeId === id) setActiveId(updated[Math.max(0, idx - 1)].id)
    setFiles(updated)
    handleCodeChange(undefined, updated)
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files
    if (!uploadedFiles) return
    let updated = [...files]
    Array.from(uploadedFiles).forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => {
        const fileCode = ev.target?.result as string
        const id = "file_" + Date.now() + Math.random()
        const newFile = { id, name: file.name, code: fileCode }
        updated = [...updated, newFile]
        setFiles(updated)
        setActiveId(id)
        handleCodeChange(fileCode, updated)
      }
      reader.readAsText(file)
    })
    e.target.value = ""
  }

  const downloadMerged = () => {
    const blob = new Blob([getMergedCode()], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "project_merged.ino"
    a.click()
    URL.revokeObjectURL(url)
  }

  const bg = isDark ? "#0d1117" : "#ffffff"
  const border = isDark ? "#1c2530" : "#d0d8e4"
  const headerBg = isDark ? "#0a0e14" : "#f8fafc"
  const textMuted = isDark ? "#6b7280" : "#8090a0"
  const textPrimary = isDark ? "#c5cdd8" : "#2a3a4a"

  return (
    <>
      <div className="flex flex-col h-full" style={{ background: bg }}>

        {/* File tabs */}
        <div className="flex items-center h-8 shrink-0 overflow-x-auto"
          style={{ borderBottom: "1px solid " + border, background: headerBg }}>
          <div className="flex items-center flex-1 min-w-0 overflow-x-auto">
            {files.map(file => (
              <div key={file.id} onClick={() => setActiveId(file.id)}
                className="flex items-center gap-1.5 px-3 h-full shrink-0 cursor-pointer transition-all group"
                style={{
                  borderRight: "1px solid " + border,
                  background: file.id === activeId ? bg : "transparent",
                  borderBottom: file.id === activeId ? "2px solid #00e5ff" : "2px solid transparent",
                }}>
                <FileCode className="h-3 w-3 shrink-0" style={{ color: file.id === activeId ? "#00e5ff" : textMuted }} />
                <span className="font-mono text-[10px] font-bold whitespace-nowrap max-w-[90px] truncate"
                  style={{ color: file.id === activeId ? textPrimary : textMuted }}>
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

          {/* Tab toolbar */}
          <div className="flex items-center gap-1 px-2 shrink-0" style={{ borderLeft: "1px solid " + border }}>
            <button onClick={addFile} title="New file" className="p-1 rounded hover:bg-white/10 transition-colors">
              <Plus className="h-3.5 w-3.5" style={{ color: textMuted }} />
            </button>
            <button onClick={() => fileInputRef.current?.click()} title="Upload .ino"
              className="p-1 rounded hover:bg-white/10 transition-colors">
              <Upload className="h-3.5 w-3.5" style={{ color: textMuted }} />
            </button>
            <input ref={fileInputRef} type="file" accept=".ino,.cpp,.c,.h" multiple
              className="hidden" onChange={handleUpload} />
            {files.length > 1 && (
              <button onClick={downloadMerged} title="Download merged"
                className="flex items-center gap-1 font-mono text-[9px] font-bold px-2 py-0.5 rounded transition-all hover:opacity-80"
                style={{ background: "#56d36420", color: "#56d364", border: "1px solid #56d36440" }}>
                <Download className="h-3 w-3" /> MERGE
              </button>
            )}
          </div>
        </div>

        {/* Action toolbar */}
        <div className="flex items-center justify-between h-7 px-3 shrink-0"
          style={{ borderBottom: "1px solid " + border, background: bg }}>
          <div className="flex items-center gap-2">
            <File className="h-3 w-3 text-[#00e5ff]" />
            <span className="font-mono text-[10px]" style={{ color: textPrimary }}>{activeFile?.name}</span>
            {saveIndicator && (
              <span className="font-mono text-[9px]" style={{ color: "#56d364" }}>✓ {saveIndicator}</span>
            )}
            {files.length > 1 && (
              <span className="font-mono text-[9px]" style={{ color: "#00e5ff" }}>
                {files.length} files · {files.reduce((a, f) => a + f.code.split('\n').length, 0)} total lines
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowSessions(true)}
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-sm hover:opacity-80 transition-all"
              style={{ color: "#00e5ff" }}>
              <FolderOpen className="h-3 w-3" />
              <span>Sessions</span>
            </button>
            <button onClick={() => setIsRunning(!isRunning)}
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-sm hover:opacity-80">
              {isRunning
                ? <><Square className="h-3 w-3 text-[#f85149]" /><span className="text-[#f85149]">Stop</span></>
                : <><Play className="h-3 w-3 text-[#56d364]" /><span className="text-[#56d364]">Run</span></>}
            </button>
            <button onClick={() => { const updated = files.map(f => f.id === activeId ? { ...f, code: DEFAULT_CODE } : f); setFiles(updated); handleCodeChange(DEFAULT_CODE, updated) }}
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-sm hover:opacity-80"
              style={{ color: textMuted }}>
              <RotateCcw className="h-3 w-3" /><span>Reset</span>
            </button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1 min-h-0">
          <MonacoEditor
            key={activeId}
            height="100%"
            defaultLanguage="cpp"
            theme={isDark ? "vs-dark" : "light"}
            value={code}
            onChange={updateActiveCode}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "JetBrains Mono, monospace",
              padding: { top: 12 },
              smoothScrolling: true,
              cursorBlinking: "smooth",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
            }}
            onMount={(editor) => {
              editor.onDidChangeCursorPosition((e) => setActiveLine(e.position.lineNumber))
            }}
          />
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between h-6 px-3 shrink-0"
          style={{ borderTop: "1px solid " + border, background: headerBg }}>
          <div className="flex items-center gap-3 font-mono text-[10px]" style={{ color: textMuted }}>
            <span>Ln {activeLine}</span>
            <span>C/C++</span>
            <span>UTF-8</span>
          </div>
          <span className="flex items-center gap-1 font-mono text-[10px] text-[#56d364]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#56d364] animate-pulse" />
            {isRunning ? "LIVE ANALYSIS" : "PAUSED"}
          </span>
        </div>
      </div>

      {showSessions && (
        <SessionsPanel
          currentCode={getMergedCode()}
          onLoadSession={(c) => {
            const updated = [{ id: "main", name: "sketch.ino", code: c }]
            setFiles(updated)
            setActiveId("main")
            handleCodeChange(c, updated)
          }}
          onClose={() => setShowSessions(false)}
        />
      )}
    </>
  )
}
