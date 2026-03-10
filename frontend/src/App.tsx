import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Settings, Cpu, Plug } from 'lucide-react';
import { PinDiagram } from './components/PinDiagram';
import { MemoryGauge } from './components/MemoryGauge';
import { FlowDiagram } from './components/FlowDiagram';
import { SerialMonitor } from './components/SerialMonitor';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
const WS_AUTH_TOKEN = import.meta.env.VITE_WS_AUTH_TOKEN || 'embedviz_secret_token_123';

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
`;

function App() {
    const [code, setCode] = useState(DEFAULT_CODE);
    const [status, setStatus] = useState<'connected' | 'disconnected'>('disconnected');
    const [platform, setPlatform] = useState('Detecting...');
    const [vizData, setVizData] = useState({
        pins: [],
        memory: { totalBytes: 0, breakdown: {} },
        flow: { nodes: [], edges: [] }
    });
    const [hwStatus, setHwStatus] = useState<'simulated' | 'connected' | 'error'>('simulated');
    const [ports, setPorts] = useState<{ path: string }[]>([]);
    const [selectedPort, setSelectedPort] = useState('');
    const [baudRate, setBaudRate] = useState('115200');
    const [showConnect, setShowConnect] = useState(false);
    const [serialLog, setSerialLog] = useState<string[]>([]);

    const wsRef = useRef<WebSocket | null>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        connectWs();
        return () => { wsRef.current?.close(); };
    }, []);

    const connectWs = () => {
        try {
            const ws = new WebSocket(`${WS_URL}?token=${WS_AUTH_TOKEN}`);
            ws.onopen = () => {
                setStatus('connected');
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
                } else if (msg.type === 'DEVICE_STATUS' && msg.status === 'connected') {
                    setHwStatus('connected');
                    setShowConnect(false);
                    setSerialLog([]);
                } else if (msg.type === 'DEVICE_STATUS' && msg.status === 'disconnected') {
                    setHwStatus('simulated');
                } else if (msg.type === 'DEVICE_ERROR') {
                    setHwStatus('error');
                    setSerialLog(prev => [...prev, `[ERROR] ${msg.error}`]);
                } else if (msg.type === 'SERIAL_DATA') {
                    setSerialLog(prev => [...prev, msg.data].slice(-200));
                }
            };
            ws.onclose = () => {
                setStatus('disconnected');
                setTimeout(connectWs, 3000);
            };
            wsRef.current = ws;
        } catch (e) {
            console.error('WS Connection error', e);
        }
    };

    const handleEditorChange = (value: string | undefined) => {
        const newCode = value || '';
        setCode(newCode);
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
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
            if (data.length > 0 && !selectedPort) setSelectedPort(data[0].path);
        } catch (e) {
            console.error('Failed to load ports', e);
        }
    };

    const handleConnectDevice = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN && selectedPort) {
            wsRef.current.send(JSON.stringify({ type: 'CONNECT_DEVICE', port: selectedPort, baudRate }));
        }
    };

    const handleDisconnectDevice = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'DISCONNECT_DEVICE' }));
            setHwStatus('simulated');
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 500px', height: '100vh', background: '#0a0e14', overflow: 'hidden' }}>

            {/* ── Editor Pane ── */}
            <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid #1c2530', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.25rem', height: '48px', borderBottom: '1px solid #1c2530', background: '#0d1117', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 600, color: '#00e5ff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        <Cpu size={18} color="#00e5ff" />
                        EmbedViz Editor
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'monospace', fontSize: '0.7rem', padding: '0.3rem 0.75rem', borderRadius: '999px', border: '1px solid', color: status === 'connected' ? '#56d364' : '#f85149', borderColor: status === 'connected' ? 'rgba(86,211,100,0.3)' : 'rgba(248,81,73,0.3)', background: status === 'connected' ? 'rgba(86,211,100,0.05)' : 'rgba(248,81,73,0.05)' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                        {status.toUpperCase()}
                    </div>
                </div>

                {/* Monaco Editor */}
                <div style={{ flex: 1, minHeight: 0 }}>
                    <Editor
                        height="100%"
                        defaultLanguage="cpp"
                        theme="vs-dark"
                        value={code}
                        onChange={handleEditorChange}
                        options={{ minimap: { enabled: false }, fontSize: 14, fontFamily: 'JetBrains Mono, monospace', padding: { top: 16 }, smoothScrolling: true, cursorBlinking: 'smooth' }}
                    />
                </div>
            </div>

            {/* ── Viz Pane ── */}
            <div style={{ display: 'flex', flexDirection: 'column', background: '#0a0e14', overflow: 'hidden' }}>

                {/* Viz Header */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.6rem 1rem', borderBottom: '1px solid #1c2530', background: '#0d1117', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Settings size={14} color="#6b7280" />
                            <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#c5cdd8' }}>Real-time Analysis</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '4px', color: '#00e5ff', background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.25)' }}>{platform}</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '4px', color: hwStatus === 'connected' ? '#56d364' : '#ffa657', background: hwStatus === 'connected' ? 'rgba(86,211,100,0.1)' : 'rgba(255,166,87,0.1)', border: `1px solid ${hwStatus === 'connected' ? 'rgba(86,211,100,0.3)' : 'rgba(255,166,87,0.3)'}` }}>
                                {hwStatus === 'connected' ? 'LIVE' : 'SIM'}
                            </span>
                        </div>
                    </div>

                    {/* Connect Button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', position: 'relative' }}>
                        {hwStatus === 'connected' ? (
                            <button onClick={handleDisconnectDevice} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#0d1117', border: '1px solid #f85149', color: '#f85149', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.72rem' }}>
                                <Plug size={12} /> Disconnect
                            </button>
                        ) : (
                            <button onClick={() => { setShowConnect(!showConnect); loadPorts(); }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#0d1117', border: '1px solid #1c2530', color: '#c5cdd8', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.72rem' }}>
                                <Plug size={12} /> Connect Device
                            </button>
                        )}

                        {showConnect && (
                            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.4rem', background: '#0d1117', border: '1px solid #2a3f5f', padding: '0.75rem', borderRadius: '8px', zIndex: 100, width: '220px', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
                                <div style={{ fontSize: '0.75rem', marginBottom: '0.3rem', color: '#6b7280' }}>Port</div>
                                <select value={selectedPort} onChange={e => setSelectedPort(e.target.value)} style={{ width: '100%', padding: '0.35rem', marginBottom: '0.6rem', background: '#131920', color: 'white', border: '1px solid #1c2530', borderRadius: '4px', fontSize: '0.8rem' }}>
                                    <option value="">Select a port...</option>
                                    {ports.map(p => <option key={p.path} value={p.path}>{p.path}</option>)}
                                </select>
                                <div style={{ fontSize: '0.75rem', marginBottom: '0.3rem', color: '#6b7280' }}>Baud Rate</div>
                                <select value={baudRate} onChange={e => setBaudRate(e.target.value)} style={{ width: '100%', padding: '0.35rem', marginBottom: '0.6rem', background: '#131920', color: 'white', border: '1px solid #1c2530', borderRadius: '4px', fontSize: '0.8rem' }}>
                                    <option value="9600">9600</option>
                                    <option value="115200">115200</option>
                                </select>
                                <button onClick={handleConnectDevice} style={{ width: '100%', padding: '0.4rem', background: '#0099cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.8rem' }}>Connect</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Scrollable Content ── */}
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.75rem' }}>
                    <PinDiagram pins={vizData.pins} />
                    <MemoryGauge memory={vizData.memory} />
                    <div style={{ minHeight: '220px', flexShrink: 0 }}>
                        <SerialMonitor serialLog={serialLog} isLive={hwStatus === 'connected'} />
                    </div>
                    <FlowDiagram flow={vizData.flow} />
                </div>
            </div>
        </div>
    );
}

export default App;
