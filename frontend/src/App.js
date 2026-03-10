import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Settings, Cpu, ChevronRight, Plug, Activity } from 'lucide-react';
import { PinDiagram } from './components/PinDiagram';
import { MemoryGauge } from './components/MemoryGauge';
import { FlowDiagram } from './components/FlowDiagram';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
const WS_AUTH_TOKEN = import.meta.env.VITE_WS_AUTH_TOKEN || 'embedviz_secret_token_123';
const DEFAULT_CODE = `// Example ESP32 / Arduino Code
#include <Arduino.h>

int ledPin = 13;
float temperature = 0.0;

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(115200);
}

void loop() {
  temperature = readTemp();
  
  if (temperature > 30.5) {
    digitalWrite(ledPin, HIGH);
  } else {
    digitalWrite(ledPin, LOW);
  }
}
`;
function App() {
    const [code, setCode] = useState(DEFAULT_CODE);
    const [status, setStatus] = useState('disconnected');
    const [platform, setPlatform] = useState('Detecting...');
    const [vizData, setVizData] = useState({
        pins: [],
        memory: { totalBytes: 0, breakdown: {} },
        flow: { nodes: [], edges: [] }
    });
    // Hardware Connection States
    const [hwStatus, setHwStatus] = useState('simulated');
    const [ports, setPorts] = useState([]);
    const [selectedPort, setSelectedPort] = useState('');
    const [baudRate, setBaudRate] = useState('115200');
    const [showConnect, setShowConnect] = useState(false);
    const wsRef = useRef(null);
    const debounceTimerRef = useRef(null);
    useEffect(() => {
        connectWs();
        return () => {
            wsRef.current?.close();
        };
    }, []);
    const connectWs = () => {
        try {
            const ws = new WebSocket(`${WS_URL}?token=${WS_AUTH_TOKEN}`);
            ws.onopen = () => {
                setStatus('connected');
                // Trigger initial parse
                ws.send(JSON.stringify({ type: 'PARSE', code: DEFAULT_CODE }));
            };
            ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                if (msg.type === 'RESULT' && msg.data.status === 'success') {
                    setPlatform(msg.data.platform);
                    setVizData({
                        pins: msg.data.hardwareStates || [],
                        memory: msg.data.memory || { totalBytes: 0, breakdown: {} },
                        flow: msg.data.flow || { nodes: [], edges: [] }
                    });
                }
                else if (msg.type === 'DEVICE_STATUS' && msg.status === 'connected') {
                    setHwStatus('connected');
                    setShowConnect(false);
                }
                else if (msg.type === 'DEVICE_ERROR') {
                    setHwStatus('error');
                    console.error('Device error:', msg.error);
                }
                else if (msg.type === 'SERIAL_DATA') {
                    // For now, just logging it. Can be expanded to a serial terminal component later.
                    console.log(`[SERIAL]: ${msg.data}`);
                }
            };
            ws.onclose = () => {
                setStatus('disconnected');
                setTimeout(connectWs, 3000); // Reconnect loop
            };
            wsRef.current = ws;
        }
        catch (e) {
            console.error('WS Connection error', e);
        }
    };
    const handleEditorChange = (value) => {
        const newCode = value || '';
        setCode(newCode);
        // 300ms Debounce logic
        if (debounceTimerRef.current)
            clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'PARSE', code: newCode }));
            }
        }, 300);
    };
    const loadPorts = async () => {
        try {
            const res = await fetch(`${API_URL}/api/ports`);
            const data = await res.json();
            setPorts(data);
            if (data.length > 0 && !selectedPort) {
                setSelectedPort(data[0].path);
            }
        }
        catch (e) {
            console.error('Failed to load ports', e);
        }
    };
    const handleConnectDevice = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN && selectedPort) {
            wsRef.current.send(JSON.stringify({
                type: 'CONNECT_DEVICE',
                port: selectedPort,
                baudRate
            }));
        }
    };
    const handleDisconnectDevice = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'DISCONNECT_DEVICE'
            }));
            setHwStatus('simulated');
        }
    };
    return (_jsxs("div", { className: "app-container", children: [_jsxs("div", { className: "editor-pane", children: [_jsxs("div", { className: "editor-header", children: [_jsxs("div", { className: "editor-title", children: [_jsx(Cpu, { size: 20, color: "var(--accent-primary)" }), "EmbedViz Editor"] }), _jsxs("div", { className: `status-badge ${status}`, children: [_jsx("div", { className: "status-indicator" }), status.toUpperCase()] })] }), _jsx("div", { style: { flex: 1 }, children: _jsx(Editor, { height: "100%", defaultLanguage: "cpp", theme: "vs-dark", value: code, onChange: handleEditorChange, options: {
                                minimap: { enabled: false },
                                fontSize: 14,
                                fontFamily: 'JetBrains Mono, monospace',
                                padding: { top: 16 },
                                smoothScrolling: true,
                                cursorBlinking: 'smooth',
                            } }) })] }), _jsxs("div", { className: "viz-pane", children: [_jsxs("div", { className: "viz-header", children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }, children: [_jsx(Settings, { size: 18, color: "var(--text-secondary)" }), "Real-time Analysis", _jsx("div", { className: `platform-badge`, style: { marginLeft: '0.5rem', background: hwStatus === 'connected' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 208, 96, 0.1)', color: hwStatus === 'connected' ? 'var(--accent-green)' : 'var(--accent-yellow)', borderColor: hwStatus === 'connected' ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 208, 96, 0.3)' }, children: hwStatus === 'connected' ? 'LIVE' : 'SIMULATED' })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem' }, children: [_jsx("span", { style: { fontSize: '0.85rem', color: 'var(--text-secondary)' }, children: "Detected Platform:" }), _jsx("div", { className: "platform-badge", children: platform }), _jsxs("div", { style: { position: 'relative' }, children: [hwStatus === 'connected' ? (_jsxs("button", { onClick: handleDisconnectDevice, style: {
                                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                    background: 'var(--bg-card)', border: '1px solid var(--accent-red)',
                                                    color: 'var(--accent-red)', padding: '0.3rem 0.8rem',
                                                    borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.75rem'
                                                }, children: [_jsx(Plug, { size: 14 }), " Disconnect"] })) : (_jsxs("button", { onClick: () => { setShowConnect(!showConnect); loadPorts(); }, style: {
                                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                                                    color: 'var(--text-primary)', padding: '0.3rem 0.8rem',
                                                    borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.75rem'
                                                }, children: [_jsx(Plug, { size: 14 }), " Connect Device"] })), showConnect && (_jsxs("div", { style: {
                                                    position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem',
                                                    background: 'var(--bg-card)', border: '1px solid var(--border-bright)',
                                                    padding: '1rem', borderRadius: '8px', zIndex: 100, width: '250px',
                                                    boxShadow: 'var(--shadow-card)'
                                                }, children: [_jsx("div", { style: { fontSize: '0.8rem', marginBottom: '0.5rem' }, children: "Port" }), _jsxs("select", { value: selectedPort, onChange: e => setSelectedPort(e.target.value), style: { width: '100%', padding: '0.4rem', marginBottom: '0.8rem', background: 'var(--bg-secondary)', color: 'white', border: '1px solid var(--border)' }, children: [_jsx("option", { value: "", children: "Select a port..." }), ports.map(p => _jsx("option", { value: p.path, children: p.path }, p.path))] }), _jsx("div", { style: { fontSize: '0.8rem', marginBottom: '0.5rem' }, children: "Baud Rate" }), _jsxs("select", { value: baudRate, onChange: e => setBaudRate(e.target.value), style: { width: '100%', padding: '0.4rem', marginBottom: '1rem', background: 'var(--bg-secondary)', color: 'white', border: '1px solid var(--border)' }, children: [_jsx("option", { value: "9600", children: "9600" }), _jsx("option", { value: "115200", children: "115200" })] }), _jsx("button", { onClick: handleConnectDevice, style: {
                                                            width: '100%', padding: '0.5rem', background: 'var(--accent-secondary)',
                                                            color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer',
                                                            fontFamily: 'var(--font-mono)', fontWeight: 'bold'
                                                        }, children: "Connect" })] }))] })] })] }), _jsxs("div", { className: "viz-grid", children: [_jsx(PinDiagram, { pins: vizData.pins }), _jsx(MemoryGauge, { memory: vizData.memory }), _jsx(FlowDiagram, { flow: vizData.flow })] })] })] }));
}
export default App;
//# sourceMappingURL=App.js.map