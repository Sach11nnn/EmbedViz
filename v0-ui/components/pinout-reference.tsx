"use client"

import { useState } from "react"
import { useEmbedViz } from "./embedviz-context"
import { X } from "lucide-react"

const PINOUTS: Record<string, any> = {
  arduino_nano: {
    name: "Arduino Nano",
    chip: "ATmega328P",
    voltage: "5V",
    freq: "16 MHz",
    color: "#00e5ff",
    pins: [
      { id: "D0",  label: "D0",  functions: ["RX"],              x: 60,  y: 40,  side: "left" },
      { id: "D1",  label: "D1",  functions: ["TX"],              x: 60,  y: 65,  side: "left" },
      { id: "D2",  label: "D2",  functions: ["INT0"],            x: 60,  y: 90,  side: "left" },
      { id: "D3",  label: "D3",  functions: ["INT1","PWM"],      x: 60,  y: 115, side: "left" },
      { id: "D4",  label: "D4",  functions: ["GPIO"],            x: 60,  y: 140, side: "left" },
      { id: "D5",  label: "D5",  functions: ["PWM"],             x: 60,  y: 165, side: "left" },
      { id: "D6",  label: "D6",  functions: ["PWM"],             x: 60,  y: 190, side: "left" },
      { id: "D7",  label: "D7",  functions: ["GPIO"],            x: 60,  y: 215, side: "left" },
      { id: "D8",  label: "D8",  functions: ["GPIO"],            x: 60,  y: 240, side: "left" },
      { id: "D9",  label: "D9",  functions: ["PWM"],             x: 60,  y: 265, side: "left" },
      { id: "D10", label: "D10", functions: ["PWM","SPI_SS"],    x: 60,  y: 290, side: "left" },
      { id: "D11", label: "D11", functions: ["PWM","SPI_MOSI"], x: 60,  y: 315, side: "left" },
      { id: "D12", label: "D12", functions: ["SPI_MISO"],        x: 60,  y: 340, side: "left" },
      { id: "D13", label: "D13", functions: ["SPI_SCK","LED"],   x: 60,  y: 365, side: "left" },
      { id: "A0",  label: "A0",  functions: ["ADC","GPIO"],      x: 330, y: 40,  side: "right" },
      { id: "A1",  label: "A1",  functions: ["ADC","GPIO"],      x: 330, y: 65,  side: "right" },
      { id: "A2",  label: "A2",  functions: ["ADC","GPIO"],      x: 330, y: 90,  side: "right" },
      { id: "A3",  label: "A3",  functions: ["ADC","GPIO"],      x: 330, y: 115, side: "right" },
      { id: "A4",  label: "A4",  functions: ["ADC","I2C_SDA"],   x: 330, y: 140, side: "right" },
      { id: "A5",  label: "A5",  functions: ["ADC","I2C_SCL"],   x: 330, y: 165, side: "right" },
      { id: "A6",  label: "A6",  functions: ["ADC_ONLY"],        x: 330, y: 190, side: "right" },
      { id: "A7",  label: "A7",  functions: ["ADC_ONLY"],        x: 330, y: 215, side: "right" },
      { id: "5V",  label: "5V",  functions: ["POWER"],           x: 330, y: 265, side: "right" },
      { id: "3V3", label: "3.3V",functions: ["POWER"],           x: 330, y: 290, side: "right" },
      { id: "GND", label: "GND", functions: ["GND"],             x: 330, y: 315, side: "right" },
      { id: "RST", label: "RST", functions: ["RESET"],           x: 330, y: 340, side: "right" },
      { id: "VIN", label: "VIN", functions: ["POWER"],           x: 330, y: 365, side: "right" },
    ]
  },
  esp32: {
    name: "ESP32",
    chip: "Xtensa LX6 Dual Core",
    voltage: "3.3V",
    freq: "240 MHz",
    color: "#56d364",
    pins: [
      { id: "GPIO0",  label: "GPIO0",  functions: ["BOOT","ADC2"],   x: 60,  y: 40,  side: "left" },
      { id: "GPIO2",  label: "GPIO2",  functions: ["LED","ADC2"],    x: 60,  y: 65,  side: "left" },
      { id: "GPIO4",  label: "GPIO4",  functions: ["ADC2","TOUCH"],  x: 60,  y: 90,  side: "left" },
      { id: "GPIO5",  label: "GPIO5",  functions: ["SPI_SS"],        x: 60,  y: 115, side: "left" },
      { id: "GPIO12", label: "GPIO12", functions: ["SPI_MISO","ADC"], x: 60, y: 140, side: "left" },
      { id: "GPIO13", label: "GPIO13", functions: ["SPI_MOSI","ADC"], x: 60, y: 165, side: "left" },
      { id: "GPIO14", label: "GPIO14", functions: ["SPI_CLK","ADC"], x: 60,  y: 190, side: "left" },
      { id: "GPIO15", label: "GPIO15", functions: ["SPI_SS","ADC"],  x: 60,  y: 215, side: "left" },
      { id: "GPIO16", label: "GPIO16", functions: ["UART2_RX"],      x: 60,  y: 240, side: "left" },
      { id: "GPIO17", label: "GPIO17", functions: ["UART2_TX"],      x: 60,  y: 265, side: "left" },
      { id: "GPIO18", label: "GPIO18", functions: ["SPI_SCK"],       x: 60,  y: 290, side: "left" },
      { id: "GPIO19", label: "GPIO19", functions: ["SPI_MISO"],      x: 60,  y: 315, side: "left" },
      { id: "GPIO21", label: "GPIO21", functions: ["I2C_SDA"],       x: 60,  y: 340, side: "left" },
      { id: "GPIO22", label: "GPIO22", functions: ["I2C_SCL"],       x: 60,  y: 365, side: "left" },
      { id: "GPIO23", label: "GPIO23", functions: ["SPI_MOSI"],      x: 60,  y: 390, side: "left" },
      { id: "GPIO34", label: "GPIO34", functions: ["ADC1","INPUT"],  x: 330, y: 40,  side: "right" },
      { id: "GPIO35", label: "GPIO35", functions: ["ADC1","INPUT"],  x: 330, y: 65,  side: "right" },
      { id: "GPIO36", label: "GPIO36", functions: ["ADC1","VP"],     x: 330, y: 90,  side: "right" },
      { id: "GPIO39", label: "GPIO39", functions: ["ADC1","VN"],     x: 330, y: 115, side: "right" },
      { id: "GPIO25", label: "GPIO25", functions: ["DAC1","ADC2"],   x: 330, y: 140, side: "right" },
      { id: "GPIO26", label: "GPIO26", functions: ["DAC2","ADC2"],   x: 330, y: 165, side: "right" },
      { id: "GPIO27", label: "GPIO27", functions: ["ADC2","TOUCH"],  x: 330, y: 190, side: "right" },
      { id: "GPIO32", label: "GPIO32", functions: ["ADC1","TOUCH"],  x: 330, y: 215, side: "right" },
      { id: "GPIO33", label: "GPIO33", functions: ["ADC1","TOUCH"],  x: 330, y: 240, side: "right" },
      { id: "3V3",    label: "3.3V",   functions: ["POWER"],         x: 330, y: 290, side: "right" },
      { id: "GND",    label: "GND",    functions: ["GND"],           x: 330, y: 315, side: "right" },
      { id: "VIN",    label: "VIN",    functions: ["POWER"],         x: 330, y: 340, side: "right" },
      { id: "EN",     label: "EN",     functions: ["RESET"],         x: 330, y: 365, side: "right" },
    ]
  },
  esp8266: {
    name: "ESP8266 (NodeMCU)",
    chip: "ESP8266EX",
    voltage: "3.3V",
    freq: "80/160 MHz",
    color: "#ffa657",
    pins: [
      { id: "D0",  label: "D0 / GPIO16", functions: ["GPIO","WAKE"],      x: 60,  y: 40,  side: "left" },
      { id: "D1",  label: "D1 / GPIO5",  functions: ["GPIO","I2C_SCL"],   x: 60,  y: 65,  side: "left" },
      { id: "D2",  label: "D2 / GPIO4",  functions: ["GPIO","I2C_SDA"],   x: 60,  y: 90,  side: "left" },
      { id: "D3",  label: "D3 / GPIO0",  functions: ["GPIO","BOOT"],      x: 60,  y: 115, side: "left" },
      { id: "D4",  label: "D4 / GPIO2",  functions: ["GPIO","LED","TX1"],  x: 60, y: 140, side: "left" },
      { id: "D5",  label: "D5 / GPIO14", functions: ["GPIO","SPI_CLK"],   x: 60,  y: 165, side: "left" },
      { id: "D6",  label: "D6 / GPIO12", functions: ["GPIO","SPI_MISO"],  x: 60,  y: 190, side: "left" },
      { id: "D7",  label: "D7 / GPIO13", functions: ["GPIO","SPI_MOSI"],  x: 60,  y: 215, side: "left" },
      { id: "D8",  label: "D8 / GPIO15", functions: ["GPIO","SPI_CS"],    x: 60,  y: 240, side: "left" },
      { id: "RX",  label: "RX / GPIO3",  functions: ["UART_RX"],          x: 60,  y: 265, side: "left" },
      { id: "TX",  label: "TX / GPIO1",  functions: ["UART_TX"],          x: 60,  y: 290, side: "left" },
      { id: "A0",  label: "A0",          functions: ["ADC","0-1V"],        x: 330, y: 40,  side: "right" },
      { id: "3V3", label: "3.3V",        functions: ["POWER"],             x: 330, y: 90,  side: "right" },
      { id: "GND", label: "GND",         functions: ["GND"],               x: 330, y: 115, side: "right" },
      { id: "VIN", label: "VIN",         functions: ["POWER","5V"],        x: 330, y: 140, side: "right" },
      { id: "EN",  label: "EN",          functions: ["ENABLE"],            x: 330, y: 165, side: "right" },
      { id: "RST", label: "RST",         functions: ["RESET"],             x: 330, y: 190, side: "right" },
    ]
  }
}

const FUNC_COLORS: Record<string, string> = {
  PWM: "#bc8cff", ADC: "#ffa657", ADC1: "#ffa657", ADC2: "#ffa657", ADC_ONLY: "#ffa657",
  I2C_SDA: "#00e5ff", I2C_SCL: "#00e5ff", SPI_MOSI: "#56d364", SPI_MISO: "#56d364",
  SPI_SCK: "#56d364", SPI_CLK: "#56d364", SPI_SS: "#56d364", SPI_CS: "#56d364",
  UART_RX: "#ffa657", UART_TX: "#ffa657", RX: "#ffa657", TX: "#ffa657",
  UART2_RX: "#ffa657", UART2_TX: "#ffa657",
  POWER: "#f85149", GND: "#6b7280", RESET: "#f85149",
  LED: "#56d364", BOOT: "#ffa657", WAKE: "#ffa657",
  DAC1: "#bc8cff", DAC2: "#bc8cff", TOUCH: "#00e5ff",
  INT0: "#f85149", INT1: "#f85149",
  GPIO: "#c5cdd8", INPUT: "#c5cdd8", ENABLE: "#ffa657",
}

export function PinoutReference({ onClose }: { onClose: () => void }) {
  const { platform } = useEmbedViz()
  const [selectedPin, setSelectedPin] = useState<string | null>(null)
  const [boardKey, setBoardKey] = useState<string>(platform || "arduino_nano")
  const [search, setSearch] = useState("")

  const board = PINOUTS[boardKey] || PINOUTS["arduino_nano"]
  const usedPins = typeof window !== "undefined"
    ? (() => {
        const code = (window as any).__embedviz_code || ""
        const matches = code.match(/\b(\d+|A\d+)\b/g) || []
        return new Set(matches)
      })()
    : new Set()

  const filteredPins = search
    ? board.pins.filter((p: any) =>
        p.label.toLowerCase().includes(search.toLowerCase()) ||
        p.functions.some((f: string) => f.toLowerCase().includes(search.toLowerCase()))
      )
    : board.pins

  const leftPins = filteredPins.filter((p: any) => p.side === "left")
  const rightPins = filteredPins.filter((p: any) => p.side === "right")

  const selectedPinData = board.pins.find((p: any) => p.id === selectedPin)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.88)" }}>
      <div className="flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ width: "800px", maxHeight: "90vh", background: "#0d1117", border: "1px solid #1c2530" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ borderBottom: "1px solid #1c2530", background: "#0a0e14" }}>
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-sm uppercase tracking-widest" style={{ color: board.color }}>
              Pinout Reference
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: board.color + "20", color: board.color, border: "1px solid " + board.color + "40" }}>
              {board.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Board selector */}
            <select value={boardKey} onChange={e => setBoardKey(e.target.value)}
              className="font-mono text-[10px] px-2 py-1 rounded-lg outline-none"
              style={{ background: "#131920", color: "#c5cdd8", border: "1px solid #1c2530" }}>
              <option value="arduino_nano">Arduino Nano</option>
              <option value="esp32">ESP32</option>
              <option value="esp8266">ESP8266</option>
            </select>
            {/* Search */}
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search pin..."
              className="font-mono text-[10px] px-2 py-1 rounded-lg outline-none w-28"
              style={{ background: "#131920", color: "#c5cdd8", border: "1px solid #1c2530" }} />
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-red-500/20 transition-colors">
              <X size={16} color="#f85149" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Pin list — left */}
          <div className="flex flex-col w-[220px] shrink-0 overflow-y-auto"
            style={{ borderRight: "1px solid #1c2530", background: "#0a0e14" }}>
            <div className="px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[#6b7280]"
              style={{ borderBottom: "1px solid #1c2530" }}>
              Left Side
            </div>
            {leftPins.map((pin: any) => (
              <PinRow key={pin.id} pin={pin} selected={selectedPin === pin.id}
                used={usedPins.has(pin.id) || usedPins.has(pin.id.replace('GPIO',''))}
                onClick={() => setSelectedPin(selectedPin === pin.id ? null : pin.id)} />
            ))}
            <div className="px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[#6b7280] mt-2"
              style={{ borderBottom: "1px solid #1c2530", borderTop: "1px solid #1c2530" }}>
              Right Side
            </div>
            {rightPins.map((pin: any) => (
              <PinRow key={pin.id} pin={pin} selected={selectedPin === pin.id}
                used={usedPins.has(pin.id) || usedPins.has(pin.id.replace('GPIO',''))}
                onClick={() => setSelectedPin(selectedPin === pin.id ? null : pin.id)} />
            ))}
          </div>

          {/* Main area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Board info bar */}
            <div className="flex items-center gap-4 px-4 py-2 shrink-0"
              style={{ borderBottom: "1px solid #1c2530", background: "#0d1117" }}>
              {[
                ["Chip", board.chip],
                ["Voltage", board.voltage],
                ["Frequency", board.freq],
                ["Total Pins", board.pins.length + ""],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col">
                  <span className="font-mono text-[8px] text-[#6b7280] uppercase">{k}</span>
                  <span className="font-mono text-[11px] font-bold" style={{ color: board.color }}>{v}</span>
                </div>
              ))}
              <div className="flex flex-col ml-auto">
                <span className="font-mono text-[8px] text-[#6b7280] uppercase">In Your Code</span>
                <span className="font-mono text-[11px] font-bold text-[#ffa657]">{usedPins.size} pins used</span>
              </div>
            </div>

            {/* Visual board diagram */}
            <div className="flex-1 overflow-auto p-4 flex items-start justify-center"
              style={{ background: "#0a0e14" }}>
              <BoardDiagram board={board} selectedPin={selectedPin}
                usedPins={usedPins} onPinClick={setSelectedPin} />
            </div>
          </div>

          {/* Pin detail panel */}
          {selectedPinData && (
            <div className="w-[180px] shrink-0 flex flex-col overflow-y-auto"
              style={{ borderLeft: "1px solid #1c2530", background: "#0d1117" }}>
              <div className="px-3 py-2" style={{ borderBottom: "1px solid #1c2530" }}>
                <p className="font-mono text-[10px] font-bold" style={{ color: board.color }}>{selectedPinData.label}</p>
                <p className="font-mono text-[9px] text-[#6b7280] mt-0.5">Pin Detail</p>
              </div>
              <div className="p-3 flex flex-col gap-2">
                <div>
                  <p className="font-mono text-[9px] text-[#6b7280] uppercase mb-1">Functions</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedPinData.functions.map((f: string) => (
                      <span key={f} className="font-mono text-[9px] px-1.5 py-0.5 rounded"
                        style={{ background: (FUNC_COLORS[f] || "#c5cdd8") + "20", color: FUNC_COLORS[f] || "#c5cdd8", border: "1px solid " + (FUNC_COLORS[f] || "#c5cdd8") + "40" }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-mono text-[9px] text-[#6b7280] uppercase mb-1">Used in Code</p>
                  <span className="font-mono text-[10px]" style={{ color: usedPins.has(selectedPinData.id) ? "#56d364" : "#6b7280" }}>
                    {usedPins.has(selectedPinData.id) ? "Yes" : "No"}
                  </span>
                </div>
                {selectedPinData.functions.includes("PWM") && (
                  <div className="rounded-lg p-2 mt-1" style={{ background: "#bc8cff15", border: "1px solid #bc8cff30" }}>
                    <p className="font-mono text-[9px] text-[#bc8cff]">PWM: analogWrite(pin, 0-255)</p>
                  </div>
                )}
                {selectedPinData.functions.some((f:string) => f.startsWith("ADC")) && (
                  <div className="rounded-lg p-2 mt-1" style={{ background: "#ffa65715", border: "1px solid #ffa65730" }}>
                    <p className="font-mono text-[9px] text-[#ffa657]">ADC: analogRead(pin) → 0-1023</p>
                  </div>
                )}
                {(selectedPinData.functions.includes("INT0") || selectedPinData.functions.includes("INT1")) && (
                  <div className="rounded-lg p-2 mt-1" style={{ background: "#f8514915", border: "1px solid #f8514930" }}>
                    <p className="font-mono text-[9px] text-[#f85149]">Supports attachInterrupt()</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 px-5 py-2 shrink-0 flex-wrap"
          style={{ borderTop: "1px solid #1c2530", background: "#0a0e14" }}>
          {[["PWM","#bc8cff"],["ADC","#ffa657"],["I2C","#00e5ff"],["SPI","#56d364"],["UART","#ffa657"],["POWER","#f85149"],["GND","#6b7280"]].map(([k,c]) => (
            <div key={k} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm" style={{ background: c + "44", border: "1px solid " + c }} />
              <span className="font-mono text-[9px]" style={{ color: c }}>{k}</span>
            </div>
          ))}
          <span className="font-mono text-[9px] ml-auto text-[#6b7280]">Click any pin for details</span>
        </div>
      </div>
    </div>
  )
}

function PinRow({ pin, selected, used, onClick }: any) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 w-full text-left transition-all"
      style={{
        background: selected ? "#00e5ff10" : "transparent",
        borderLeft: selected ? "2px solid #00e5ff" : "2px solid transparent",
        borderBottom: "1px solid #0f1520"
      }}>
      <div className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: used ? "#56d364" : "#1c2530" }} />
      <div className="flex-1 min-w-0">
        <span className="font-mono text-[10px] block truncate" style={{ color: selected ? "#00e5ff" : "#c5cdd8" }}>
          {pin.label}
        </span>
      </div>
      <div className="flex gap-0.5 flex-wrap justify-end max-w-[70px]">
        {pin.functions.slice(0, 2).map((f: string) => (
          <span key={f} className="font-mono text-[7px] px-0.5 rounded"
            style={{ color: FUNC_COLORS[f] || "#6b7280", background: (FUNC_COLORS[f] || "#6b7280") + "15" }}>
            {f}
          </span>
        ))}
      </div>
    </button>
  )
}

function BoardDiagram({ board, selectedPin, usedPins, onPinClick }: any) {
  const leftPins = board.pins.filter((p: any) => p.side === "left")
  const rightPins = board.pins.filter((p: any) => p.side === "right")
  const boardH = Math.max(leftPins.length, rightPins.length) * 25 + 40
  const boardW = 150

  return (
    <svg width={boardW + 240} height={boardH + 20} style={{ fontFamily: "monospace" }}>
      {/* Board body */}
      <rect x={120} y={10} width={boardW} height={boardH} rx={8}
        fill="#0d1117" stroke={board.color + "60"} strokeWidth={1.5} />
      {/* Board name */}
      <text x={120 + boardW/2} y={boardH/2 + 10} textAnchor="middle"
        fill={board.color + "30"} fontSize={10} fontWeight="bold">
        {board.name.split(" ")[0].toUpperCase()}
      </text>

      {/* Left pins */}
      {leftPins.map((pin: any, i: number) => {
        const y = 20 + i * 25
        const isSelected = selectedPin === pin.id
        const isUsed = usedPins.has(pin.id) || usedPins.has(pin.id.replace("GPIO",""))
        const color = isSelected ? "#00e5ff" : isUsed ? "#56d364" : "#3d4450"
        return (
          <g key={pin.id} style={{ cursor: "pointer" }} onClick={() => onPinClick(pin.id)}>
            <line x1={120} y1={y} x2={40} y2={y} stroke={color} strokeWidth={isSelected ? 2 : 1} />
            <circle cx={38} cy={y} r={4} fill={isUsed ? "#56d36430" : "#1c2530"} stroke={color} strokeWidth={1} />
            <text x={34} y={y+4} textAnchor="end" fill={color} fontSize={8}>{pin.label}</text>
            {isSelected && (
              <text x={44} y={y+4} fill="#00e5ff" fontSize={7}>{pin.functions[0]}</text>
            )}
          </g>
        )
      })}

      {/* Right pins */}
      {rightPins.map((pin: any, i: number) => {
        const y = 20 + i * 25
        const isSelected = selectedPin === pin.id
        const isUsed = usedPins.has(pin.id) || usedPins.has(pin.id.replace("GPIO",""))
        const color = isSelected ? "#00e5ff" : isUsed ? "#56d364" : "#3d4450"
        return (
          <g key={pin.id} style={{ cursor: "pointer" }} onClick={() => onPinClick(pin.id)}>
            <line x1={120 + boardW} y1={y} x2={120 + boardW + 80} y2={y} stroke={color} strokeWidth={isSelected ? 2 : 1} />
            <circle cx={120 + boardW + 82} cy={y} r={4} fill={isUsed ? "#56d36430" : "#1c2530"} stroke={color} strokeWidth={1} />
            <text x={120 + boardW + 90} y={y+4} fill={color} fontSize={8}>{pin.label}</text>
          </g>
        )
      })}
    </svg>
  )
}
