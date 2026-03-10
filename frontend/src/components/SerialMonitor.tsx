import { useState, useEffect, useRef } from "react";
import { Terminal, Trash2, Pause, Download, ArrowDown } from "lucide-react";

interface LogEntry {
  timestamp: string;
  message: string;
  type: "info" | "warn" | "error" | "data" | "system";
}

const typeColors = {
  info: "#c5cdd8",
  warn: "#ffa657",
  error: "#f85149",
  data: "#00e5ff",
  system: "#6b7280",
};

const typeLabels = {
  info: "INF",
  warn: "WRN",
  error: "ERR",
  data: "DAT",
  system: "SYS",
};

function classifyMessage(msg: string): LogEntry["type"] {
  if (msg.includes("ERROR") || msg.includes("error")) return "error";
  if (msg.includes("WARN") || msg.includes("warn")) return "warn";
  if (msg.includes("SENSOR:") || msg.includes("ADC") || msg.includes("LED:")) return "data";
  if (msg.startsWith("[BOOT]") || msg.startsWith("[SYS]")) return "system";
  return "info";
}

function getTimestamp(): string {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, "0");
  const m = now.getMinutes().toString().padStart(2, "0");
  const s = now.getSeconds().toString().padStart(2, "0");
  const ms = now.getMilliseconds().toString().padStart(3, "0");
  return `${h}:${m}:${s}.${ms}`;
}

interface SerialMonitorProps {
  serialLog: string[];
  isLive: boolean;
  onSendCommand?: (cmd: string) => void;
}

export function SerialMonitor({ serialLog, isLive, onSendCommand }: SerialMonitorProps) {
  const [logs, setLogs] = useState<LogEntry[]>([
    { timestamp: "00:00:00.000", message: "Waiting for device connection...", type: "system" }
  ]);
  const [paused, setPaused] = useState(false);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLogLength = useRef(0);

  // Convert incoming serial strings to LogEntry format
  useEffect(() => {
    if (serialLog.length > prevLogLength.current) {
      const newLines = serialLog.slice(prevLogLength.current);
      prevLogLength.current = serialLog.length;

      if (!paused) {
        const newEntries: LogEntry[] = newLines.map(line => ({
          timestamp: getTimestamp(),
          message: line,
          type: classifyMessage(line)
        }));
        setLogs(prev => [...prev, ...newEntries].slice(-200));
      }
    }
  }, [serialLog, paused]);

  // Reset on new connection
  useEffect(() => {
    if (isLive) {
      setLogs([{ timestamp: getTimestamp(), message: "[SYS] Device connected", type: "system" }]);
      prevLogLength.current = 0;
    } else {
      setLogs([{ timestamp: getTimestamp(), message: "[SYS] Device disconnected", type: "system" }]);
    }
  }, [isLive]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current && !paused) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, paused]);

  const handleSend = () => {
    if (!input.trim()) return;
    setLogs(prev => [...prev, {
      timestamp: getTimestamp(),
      message: `[TX] > ${input}`,
      type: "data"
    }]);
    onSendCommand?.(input);
    setInput("");
  };

  const handleDownload = () => {
    const text = logs.map(l => `${l.timestamp} [${typeLabels[l.type]}] ${l.message}`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "serial_log.txt";
    a.click();
  };

  const filtered = filter
    ? logs.filter(l => l.message.toLowerCase().includes(filter.toLowerCase()))
    : logs;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: "#0a0e14",
      border: "1px solid #1c2530",
      borderRadius: "6px",
      overflow: "hidden"
    }}>
      {/* Toolbar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "32px",
        padding: "0 12px",
        borderBottom: "1px solid #1c2530",
        background: "#0d1117",
        flexShrink: 0
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Terminal size={12} color="#00e5ff" />
          <span style={{ fontFamily: "monospace", fontSize: "10px", fontWeight: "bold", color: "#c5cdd8", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Serial Monitor
          </span>
          <span style={{ fontFamily: "monospace", fontSize: "10px", color: "#6b7280" }}>
            {isLive ? "● LIVE" : "○ OFFLINE"} @ 115200 8N1
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <input
            type="text"
            placeholder="Filter..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{
              background: "#131920", border: "1px solid #1c2530",
              color: "#c5cdd8", padding: "2px 6px", borderRadius: "3px",
              fontFamily: "monospace", fontSize: "10px", width: "80px", outline: "none"
            }}
          />
          <button onClick={() => setPaused(!paused)} title={paused ? "Resume" : "Pause"}
            style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", color: paused ? "#ffa657" : "#6b7280" }}>
            <Pause size={12} />
          </button>
          <button onClick={() => setLogs([])} title="Clear"
            style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>
            <Trash2 size={12} />
          </button>
          <button onClick={handleDownload} title="Download"
            style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>
            <Download size={12} />
          </button>
          <button onClick={() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }}
            style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>
            <ArrowDown size={12} />
          </button>
        </div>
      </div>

      {/* Log output */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "4px 12px", background: "#0a0e14" }}>
        {filtered.map((log, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", padding: "1px 0" }}>
            <span style={{ fontFamily: "monospace", fontSize: "10px", color: "#3d4450", flexShrink: 0, userSelect: "none" }}>
              {log.timestamp}
            </span>
            <span style={{ fontFamily: "monospace", fontSize: "9px", flexShrink: 0, width: "24px", textAlign: "center", color: typeColors[log.type] }}>
              {typeLabels[log.type]}
            </span>
            <span style={{ fontFamily: "monospace", fontSize: "11px", color: typeColors[log.type] }}>
              {log.message}
            </span>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{
        display: "flex", alignItems: "center", height: "28px",
        borderTop: "1px solid #1c2530", background: "#0d1117", flexShrink: 0
      }}>
        <span style={{ padding: "0 8px", fontFamily: "monospace", fontSize: "10px", color: "#00e5ff" }}>{">"}</span>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Send command..."
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            fontFamily: "monospace", fontSize: "11px", color: "#c5cdd8"
          }}
        />
        <button onClick={handleSend} style={{
          padding: "0 12px", background: "none", border: "none", cursor: "pointer",
          fontFamily: "monospace", fontSize: "10px", color: "#00e5ff", height: "100%",
          letterSpacing: "0.1em", textTransform: "uppercase"
        }}>Send</button>
      </div>
    </div>
  );
}
