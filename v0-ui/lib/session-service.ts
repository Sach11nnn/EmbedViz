// session-service.ts — Pure localStorage, NO Firebase

export interface SavedSession {
  id: string
  name: string
  code: string
  platform: string
  createdAt: string
}

const KEY = "embedviz_sessions_local"

export function saveSession(name: string, code: string, platform: string): string {
  const sessions = getSessions()
  const id = "session_" + Date.now()
  sessions.unshift({ id, name, code, platform, createdAt: new Date().toLocaleString() })
  localStorage.setItem(KEY, JSON.stringify(sessions.slice(0, 50)))
  return id
}

export function getSessions(): SavedSession[] {
  try {
    const data = localStorage.getItem(KEY)
    return data ? JSON.parse(data) : []
  } catch { return [] }
}

export function deleteSession(id: string): void {
  const sessions = getSessions().filter(s => s.id !== id)
  localStorage.setItem(KEY, JSON.stringify(sessions))
}

export function autoSave(code: string, platform: string): void {
  try {
    localStorage.setItem("embedviz_autosave", JSON.stringify({
      code, platform, savedAt: new Date().toLocaleString()
    }))
  } catch {}
}

export function loadAutoSave(): { code: string; platform: string; savedAt: string } | null {
  try {
    const data = localStorage.getItem("embedviz_autosave")
    return data ? JSON.parse(data) : null
  } catch { return null }
}
