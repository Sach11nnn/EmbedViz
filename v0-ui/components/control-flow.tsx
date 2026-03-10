"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { useEmbedViz } from "./embedviz-context"
import { WiringDiagram } from "./wiring-diagram"
import { AISuggestions } from "./ai-suggestions"
import { CodeExport } from "./code-export"
import { PinoutReference } from "./pinout-reference"
import { PowerEstimate } from "./power-estimate"
import { ZoomIn, ZoomOut, Maximize2, Minimize2, Move } from "lucide-react"

const NODE_COLORS = {
  start:     { bg: "#f8514933", border: "#f85149", text: "#f85149" },
  end:       { bg: "#f8514933", border: "#f85149", text: "#f85149" },
  process:   { bg: "#131920",   border: "#2a3f5f", text: "#c5cdd8" },
  decision:  { bg: "#ffa65722", border: "#ffa657", text: "#ffa657" },
  interrupt: { bg: "#bc8cff22", border: "#bc8cff", text: "#bc8cff" },
  io:        { bg: "#00e5ff15", border: "#00e5ff55", text: "#00e5ff" },
  delay:     { bg: "#f8514920", border: "#f85149aa", text: "#f85149" },
}
const ACTIVE = { bg: "#00e5ff22", border: "#00e5ff", text: "#00e5ff", glow: "0 0 12px #00e5ff44" }

export function ControlFlow() {
  const { vizData } = useEmbedViz()
  const [showWiring,  setShowWiring]  = useState(false)
  const [showAI,      setShowAI]      = useState(false)
  const [showExport,  setShowExport]  = useState(false)
  const [showPinout,  setShowPinout]  = useState(false)
  const [showPower,   setShowPower]   = useState(false)
  const [activeId,    setActiveId]    = useState<string>('')
  const [zoom,        setZoom]        = useState(1)
  const [pan,         setPan]         = useState({ x: 0, y: 0 })
  const [isPanning,   setIsPanning]   = useState(false)
  const [fullscreen,  setFullscreen]  = useState(false)
  const panStart = useRef({ x: 0, y: 0 })
  const animRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  const flowData = (vizData as any).flow
  const nodes: any[] = flowData?.nodes || []
  const edges: any[] = flowData?.edges || []

  useEffect(() => {
    if (animRef.current) clearInterval(animRef.current)
    if (nodes.length === 0) return
    const animated = nodes.filter(n => n.type === 'process' || n.type === 'io' || n.type === 'delay')
    if (!animated.length) return
    let idx = 0
    animRef.current = setInterval(() => {
      setActiveId(animated[idx % animated.length].id)
      idx++
    }, 1200)
    return () => { if (animRef.current) clearInterval(animRef.current) }
  }, [nodes.length])

  useEffect(() => {
    if (nodes.length === 0) return
    setZoom(0.9)
    setPan({ x: 10, y: 10 })
  }, [nodes.length])

  const maxY = nodes.length ? Math.max(...nodes.map(n => n.y + 60), 400) : 400

  const handleZoomIn  = () => setZoom(z => Math.min(z + 0.2, 3))
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.3))
  const handleFit     = () => { setZoom(0.85); setPan({ x: 10, y: 10 }) }

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsPanning(true)
    panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
  }
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return
    setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y })
  }, [isPanning])
  const onMouseUp = () => setIsPanning(false)
  const onWheel   = (e: React.WheelEvent) => {
    e.preventDefault()
    setZoom(z => Math.min(Math.max(z - e.deltaY * 0.001, 0.3), 3))
  }

  const renderNode = (node: any) => {
    const isActive = node.id === activeId
    const colors   = isActive ? ACTIVE : (NODE_COLORS[node.type as keyof typeof NODE_COLORS] || NODE_COLORS.process)
    const w = 120, h = 30

    if (node.type === 'decision') {
      const cx = node.x, cy = node.y + 15, rx = 56, ry = 20
      return (
        <g key={node.id}>
          <polygon points={cx+","+(cy-ry)+" "+(cx+rx)+","+cy+" "+cx+","+(cy+ry)+" "+(cx-rx)+","+cy}
            fill={colors.bg} stroke={colors.border} strokeWidth={isActive?2:1}
            style={{ filter: isActive ? "drop-shadow("+ACTIVE.glow+")" : undefined }} />
          <text x={cx} y={cy+4} textAnchor="middle" fill={colors.text} fontSize={8} fontFamily="monospace">
            {node.label.length > 14 ? node.label.substring(0,14)+'…' : node.label}
          </text>
        </g>
      )
    }
    if (node.type === 'interrupt') {
      return (
        <g key={node.id}>
          <rect x={node.x-w/2} y={node.y} width={w} height={h} rx={2}
            fill={colors.bg} stroke={colors.border} strokeWidth={1} strokeDasharray="4 2" />
          <text x={node.x} y={node.y+h/2+4} textAnchor="middle" fill={colors.text} fontSize={8} fontFamily="monospace">
            {node.label.length > 18 ? node.label.substring(0,18)+'…' : node.label}
          </text>
        </g>
      )
    }
    const rx = node.type === 'start' || node.type === 'end' ? 15 : node.type === 'delay' ? 6 : 3
    return (
      <g key={node.id}>
        <rect x={node.x-w/2} y={node.y} width={w} height={h} rx={rx}
          fill={colors.bg} stroke={colors.border} strokeWidth={isActive?2:1}
          style={{ filter: isActive ? "drop-shadow("+ACTIVE.glow+")" : undefined }} />
        <text x={node.x} y={node.y+h/2+4} textAnchor="middle" fill={colors.text} fontSize={8} fontFamily="monospace">
          {node.label.length > 18 ? node.label.substring(0,18)+'…' : node.label}
        </text>
      </g>
    )
  }

  const renderEdge = (edge: any, i: number) => {
    const fromNode = nodes.find(n => n.id === edge.from)
    const toNode   = nodes.find(n => n.id === edge.to)
    if (!fromNode || !toNode) return null
    const x1 = fromNode.x, y1 = fromNode.y + 30
    const x2 = toNode.x,   y2 = toNode.y

    if (y1 > y2 && edge.label === '↺') {
      const path = "M "+x1+" "+y1+" L "+x1+" "+(y1+20)+" L "+(x1+100)+" "+(y1+20)+" L "+(x1+100)+" "+(y2-10)+" L "+x2+" "+(y2-10)+" L "+x2+" "+y2
      return (
        <g key={i}>
          <path d={path} fill="none" stroke="#00e5ff55" strokeWidth={1.5} strokeDasharray="6,3" markerEnd="url(#arrow)" />
          <text x={x1+105} y={(y1+y2)/2} fill="#00e5ff66" fontSize={8} fontFamily="monospace">loop</text>
        </g>
      )
    }
    const path = Math.abs(x1-x2) < 5
      ? "M "+x1+" "+y1+" L "+x2+" "+y2
      : "M "+x1+" "+y1+" L "+x1+" "+(y1+(y2-y1)*0.5)+" L "+x2+" "+(y1+(y2-y1)*0.5)+" L "+x2+" "+y2
    return (
      <g key={i}>
        <path d={path} fill="none" stroke="#2a3f5f" strokeWidth={1} markerEnd="url(#arrow)" />
        {edge.label && edge.label !== '↺' && (
          <text x={(x1+x2)/2+6} y={(y1+y2)/2} fill="#6b7280" fontSize={7} fontFamily="monospace">{edge.label}</text>
        )}
      </g>
    )
  }

  const containerClass = fullscreen ? "fixed inset-0 z-50 flex flex-col bg-[#0a0e14]" : "flex flex-col h-full"

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="flex items-center justify-between h-8 px-3 border-b border-[#1c2530] bg-[#0d1117] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-pulse" />
          <span className="font-mono text-[10px] font-bold text-[#c5cdd8] uppercase tracking-wider">Control Flow</span>
          {nodes.length > 0 && <span className="font-mono text-[9px] text-[#6b7280]">{nodes.length} nodes</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={handleZoomOut} className="p-0.5 rounded hover:bg-white/10 transition-colors">
            <ZoomOut className="h-3 w-3 text-[#6b7280]" />
          </button>
          <span className="font-mono text-[9px] text-[#6b7280] w-8 text-center">{Math.round(zoom*100)}%</span>
          <button onClick={handleZoomIn} className="p-0.5 rounded hover:bg-white/10 transition-colors">
            <ZoomIn className="h-3 w-3 text-[#6b7280]" />
          </button>
          <button onClick={handleFit} className="p-0.5 rounded hover:bg-white/10 transition-colors">
            <Move className="h-3 w-3 text-[#6b7280]" />
          </button>
          <div className="w-px h-3 bg-[#1c2530]" />
          {[
            { label: "AI",     color: "#bc8cff", fn: () => setShowAI(true)     },
            { label: "WIRE",   color: "#00e5ff", fn: () => setShowWiring(true) },
            { label: "PIN",    color: "#ffa657", fn: () => setShowPinout(true) },
            { label: "PWR",    color: "#f85149", fn: () => setShowPower(true)  },
            { label: "EXPORT", color: "#56d364", fn: () => setShowExport(true) },
          ].map(({ label, color, fn }) => (
            <button key={label} onClick={fn}
              className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider transition-all hover:opacity-80 whitespace-nowrap"
              style={{ background: color + "20", color, border: "1px solid " + color + "40" }}>
              {label}
            </button>
          ))}
          <button onClick={() => setFullscreen(f => !f)} className="p-0.5 rounded hover:bg-white/10 transition-colors">
            {fullscreen ? <Minimize2 className="h-3 w-3 text-[#6b7280]" /> : <Maximize2 className="h-3 w-3 text-[#6b7280]" />}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden relative"
        style={{ cursor: isPanning ? 'grabbing' : 'grab', background: "#0a0e14" }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp} onWheel={onWheel}>

        {nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="font-mono text-[11px] text-[#3d4450]">Write code to see flow diagram</span>
          </div>
        ) : (
          <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="#3d4450" />
              </marker>
              <pattern id="cf-grid" width="20" height="20" patternUnits="userSpaceOnUse"
                patternTransform={"translate("+pan.x+","+pan.y+") scale("+zoom+")"}>
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1c253020" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cf-grid)" />
            <g transform={"translate("+pan.x+","+pan.y+") scale("+zoom+")"}>
              {edges.map(renderEdge)}
              {nodes.map(renderNode)}
              <g transform={"translate(8,"+(maxY+15)+")"}>
                {[['start','#f85149'],['process','#c5cdd8'],['decision','#ffa657'],['interrupt','#bc8cff'],['io','#00e5ff'],['delay','#f85149']].map(([type, color], i) => (
                  <g key={type} transform={"translate("+(i*75)+",0)"}>
                    <rect x={0} y={-5} width={8} height={8} rx={1} fill={color+"22"} stroke={color} strokeWidth={0.5} />
                    <text x={12} y={4} fill="#6b7280" fontSize={7} fontFamily="monospace">{type}</text>
                  </g>
                ))}
              </g>
            </g>
          </svg>
        )}
        <div className="absolute bottom-2 left-2 font-mono text-[8px] text-[#2d3748] pointer-events-none">
          Scroll to zoom • Drag to pan
        </div>
      </div>

      {showWiring  && <WiringDiagram    onClose={() => setShowWiring(false)}  />}
      {showAI      && <AISuggestions    onClose={() => setShowAI(false)}      />}
      {showExport  && <CodeExport       onClose={() => setShowExport(false)}  />}
      {showPinout  && <PinoutReference  onClose={() => setShowPinout(false)}  />}
      {showPower   && <PowerEstimate    onClose={() => setShowPower(false)}   />}
    </div>
  )
}
