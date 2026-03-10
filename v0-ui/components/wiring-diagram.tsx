"use client"
import { useEmbedViz } from "./embedviz-context"
import { X } from "lucide-react"

const PIN_COLORS: Record<string, string> = {
  OUTPUT: "#56d364", INPUT: "#00e5ff", ADC: "#ffa657",
  ANALOG: "#ffa657", PWM: "#bc8cff", UART: "#ffa657",
  I2C: "#00e5ff", SPI: "#bc8cff", WiFi: "#56d364",
  Bluetooth: "#bc8cff", DAC: "#f85149", TOUCH: "#00e5ff",
  LEDC: "#bc8cff", GPIO: "#56d364",
}

// Detect actual component from variable name
function detectComponent(pinName: string, code: string): { label: string; icon: string; color: string } {
  const n = pinName.toString().toLowerCase()
  
  // Search variable declarations in code like: int ledPin = 13;
  // Find what variable name is assigned this pin
  const varMatch = code.match(new RegExp('(\\w+)\\s*=\\s*' + pinName + '[^\\d]'))
  const varName = varMatch ? varMatch[1].toLowerCase() : n

  // LED
  if (/led|light|lamp|bulb|diode/.test(varName)) return { label: 'LED', icon: 'ðŸ’¡', color: '#56d364' }
  // Buzzer
  if (/buzz|beep|piezo|speaker|tone/.test(varName)) return { label: 'Buzzer', icon: 'ðŸ””', color: '#ffa657' }
  // Servo
  if (/servo|motor|actuator/.test(varName)) return { label: 'Servo', icon: 'âš™ï¸', color: '#bc8cff' }
  // Button/Switch
  if (/btn|button|switch|sw|key|push/.test(varName)) return { label: 'Button', icon: 'ðŸ”˜', color: '#00e5ff' }
  // Sensor (generic)
  if (/sensor|sens|detect|measure/.test(varName)) return { label: 'Sensor', icon: 'ðŸ“¡', color: '#ffa657' }
  // Temperature
  if (/temp|dht|thermistor|ds18/.test(varName)) return { label: 'Temp', icon: 'ðŸŒ¡ï¸', color: '#f85149' }
  // Relay
  if (/relay|rl|contactor/.test(varName)) return { label: 'Relay', icon: 'âš¡', color: '#ffa657' }
  // Potentiometer
  if (/pot|potent|knob|dial|trim/.test(varName)) return { label: 'Pot', icon: 'ðŸŽ›ï¸', color: '#ffa657' }
  // Ultrasonic
  if (/trig|echo|ultrasonic|hcsr|sonar/.test(varName)) return { label: 'Ultrasonic', icon: 'ðŸ“¶', color: '#00e5ff' }
  // IR
  if (/ir|infrared/.test(varName)) return { label: 'IR', icon: 'ðŸ‘ï¸', color: '#bc8cff' }
  // Display
  if (/lcd|oled|display|tft|screen/.test(varName)) return { label: 'Display', icon: 'ðŸ–¥ï¸', color: '#00e5ff' }
  // Fan
  if (/fan|cooler|blower/.test(varName)) return { label: 'Fan', icon: 'ðŸŒ€', color: '#56d364' }

  return { label: '', icon: '', color: '' }
}

function getPinInfo(pin: any, code: string) {
  const mode = pin.mode || pin.type || 'GPIO'
  const color = PIN_COLORS[mode] || '#00e5ff'
  const pinName = (pin.pin || pin.name || '?').toString()

  // Try to detect actual component
  const detected = detectComponent(pinName, code)

  // Also scan code for variable assigned to this pin number
  const varScan = code.match(new RegExp('int\\s+(\\w+)\\s*=\\s*' + pinName + '\\s*;'))
  const varName = varScan ? varScan[1].toLowerCase() : ''
  const detectedFromVar = varName ? detectComponent(varName, code) : null

  const comp = (detectedFromVar?.label ? detectedFromVar : detected)

  const modeIcons: Record<string, string> = {
    OUTPUT: 'ðŸ’¡', INPUT: 'ðŸ“˜', ADC: 'ðŸ“Š', ANALOG: 'ðŸ“Š',
    PWM: 'ã€°', UART: 'ðŸ“¡', I2C: 'ðŸ”—', SPI: 'âš¡',
    WiFi: 'ðŸ“¶', Bluetooth: 'ðŸ“µ', DAC: 'ðŸ“Š', TOUCH: 'ðŸ‘†', GPIO: 'ðŸ”Œ',
  }
  const modeNames: Record<string, string> = {
    OUTPUT: 'Output', INPUT: 'Input', ADC: 'ADC', ANALOG: 'Analog',
    PWM: 'PWM', UART: 'Serial', I2C: 'I2C', SPI: 'SPI',
    WiFi: 'WiFi', Bluetooth: 'BT', DAC: 'DAC', TOUCH: 'Touch', GPIO: 'GPIO',
  }

  return {
    color: comp.color || color,
    icon: comp.icon || modeIcons[mode] || 'ðŸ”Œ',
    label: comp.label || modeNames[mode] || mode,
    pinName,
    mode,
    line: pin.line,
    varName: varScan?.[1] || '',
  }
}

export function WiringDiagram({ onClose }: { onClose: () => void }) {
  const { vizData, platform, theme } = useEmbedViz()
  const isDark = theme === "dark"
  const pins: any[] = vizData.pins || []
  const code = (window as any).__embedviz_code || ''
  const isESP32 = platform === "ESP32" || platform === "ESP32-WROOM-32"

  const bg = isDark ? "#0a0e14" : "#f0f4f8"
  const boardBg = isDark ? "#161b22" : "#e2ecf8"
  const textMuted = isDark ? "#6b7280" : "#94a3b8"
  const borderCol = isDark ? "#1c2530" : "#d0d8e4"

  const leftPins = pins.filter((_: any, i: number) => i % 2 === 0)
  const rightPins = pins.filter((_: any, i: number) => i % 2 !== 0)
  const maxRows = Math.max(leftPins.length, rightPins.length, 3)

  const ROW_H = 65
  const PADDING_TOP = 20
  const BOARD_INNER_H = maxRows * ROW_H
  const BOARD_HEADER_H = 58
  const BOARD_FOOTER_H = 36
  const BOARD_H = BOARD_HEADER_H + BOARD_INNER_H + BOARD_FOOTER_H

  const SVG_W = 920
  const SVG_H = BOARD_H + PADDING_TOP * 2
  const BOARD_W = 260
  const BOARD_X = (SVG_W - BOARD_W) / 2
  const BOARD_Y = PADDING_TOP

  const PIN_START_Y = BOARD_Y + BOARD_HEADER_H + ROW_H / 2 - 10

  const COMP_L_X = 80
  const COMP_R_X = SVG_W - 80
  const COMP_R = 26

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.92)" }}>
      <div className="flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ width: "92vw", height: "88vh", background: isDark ? "#0d1117" : "#fff", border: "1px solid " + borderCol }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ borderBottom: "1px solid " + borderCol, background: isDark ? "#0a0e14" : "#f1f5f9" }}>
          <div className="flex items-center gap-3">
            <span className="text-lg">ðŸ”Œ</span>
            <span className="font-mono font-bold text-[#00e5ff] text-sm uppercase tracking-widest">Wiring Diagram</span>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: "#00e5ff15", color: "#00e5ff", border: "1px solid #00e5ff30" }}>
              {isESP32 ? "ESP32" : "Arduino Nano"}
            </span>
            <span className="font-mono text-[10px]" style={{ color: textMuted }}>{pins.length} connections</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-red-500/20">
            <X size={18} color="#f85149" />
          </button>
        </div>

        {/* SVG */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4" style={{ background: bg }}>
          <svg viewBox={"0 0 " + SVG_W + " " + SVG_H}
            style={{ width: "100%", maxHeight: "100%", overflow: "visible" }}
            preserveAspectRatio="xMidYMid meet">
            <defs>
              <pattern id="wd-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke={isDark ? "#ffffff06" : "#00000006"} strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width={SVG_W} height={SVG_H} fill="url(#wd-grid)" />

            {/* Board shadow */}
            <rect x={BOARD_X+5} y={BOARD_Y+5} width={BOARD_W} height={BOARD_H} rx="14" fill="rgba(0,229,255,0.05)" />

            {/* Board body */}
            <rect x={BOARD_X} y={BOARD_Y} width={BOARD_W} height={BOARD_H} rx="14"
              fill={boardBg} stroke="#00e5ff" strokeWidth="1.5" />

            {/* Header strip */}
            <rect x={BOARD_X} y={BOARD_Y} width={BOARD_W} height={BOARD_HEADER_H} rx="14"
              fill={isDark ? "#0d1117" : "#c7ddf5"} />
            <rect x={BOARD_X} y={BOARD_Y+BOARD_HEADER_H-14} width={BOARD_W} height={14}
              fill={isDark ? "#0d1117" : "#c7ddf5"} />

            {/* Board name */}
            <text x={BOARD_X+BOARD_W/2} y={BOARD_Y+24} textAnchor="middle"
              fill="#00e5ff" fontSize="13" fontFamily="monospace" fontWeight="bold">
              {isESP32 ? "ESP32-WROOM-32" : "Arduino Nano"}
            </text>
            <text x={BOARD_X+BOARD_W/2} y={BOARD_Y+42} textAnchor="middle"
              fill={textMuted} fontSize="7.5" fontFamily="monospace">
              {isESP32 ? "Xtensa LX6 â€¢ 240MHz â€¢ 520KB SRAM" : "ATmega328P â€¢ 16MHz â€¢ 2KB SRAM"}
            </text>

            {/* Chip */}
            <rect x={BOARD_X+75} y={BOARD_Y+BOARD_HEADER_H+BOARD_INNER_H/2-36} width={110} height={72} rx="5"
              fill={isDark ? "#0a0e14" : "#1e293b"} stroke={isDark ? "#30363d" : "#475569"} strokeWidth="1" />
            <text x={BOARD_X+BOARD_W/2} y={BOARD_Y+BOARD_HEADER_H+BOARD_INNER_H/2-4}
              textAnchor="middle" fill="#4a5568" fontSize="9" fontFamily="monospace">
              {isESP32 ? "ESP32" : "ATMEGA328P"}
            </text>
            <text x={BOARD_X+BOARD_W/2} y={BOARD_Y+BOARD_HEADER_H+BOARD_INNER_H/2+10}
              textAnchor="middle" fill="#374151" fontSize="7" fontFamily="monospace">
              {isESP32 ? "WROOM-32" : "16MHz"}
            </text>

            {/* USB */}
            <rect x={BOARD_X+95} y={BOARD_Y+BOARD_H-28} width={70} height={20} rx="4"
              fill={isDark ? "#1c2530" : "#94a3b8"} stroke={isDark ? "#30363d" : "#64748b"} strokeWidth="1" />
            <text x={BOARD_X+BOARD_W/2} y={BOARD_Y+BOARD_H-14}
              textAnchor="middle" fill="#6b7280" fontSize="8" fontFamily="monospace">USB</text>

            {/* LEFT PINS */}
            {leftPins.map((pin: any, i: number) => {
              const py = PIN_START_Y + i * ROW_H
              const info = getPinInfo(pin, code)
              return (
                <g key={"L"+i}>
                  {/* Wire with gradient feel */}
                  <line x1={BOARD_X-2} y1={py} x2={COMP_L_X+COMP_R} y2={py}
                    stroke={info.color} strokeWidth="2" strokeOpacity="0.8" />
                  {/* Solder dots */}
                  <circle cx={BOARD_X} cy={py} r="4.5" fill={info.color} />
                  <circle cx={COMP_L_X+COMP_R} cy={py} r="3" fill={info.color} fillOpacity="0.6" />

                  {/* Pin badge */}
                  <rect x={BOARD_X-62} y={py-10} width={58} height={20} rx="6"
                    fill={info.color+"22"} stroke={info.color} strokeWidth="1" />
                  <text x={BOARD_X-33} y={py+4} textAnchor="middle"
                    fill={info.color} fontSize="8" fontFamily="monospace" fontWeight="bold">
                    {info.pinName}
                  </text>

                  {/* Component circle */}
                  <circle cx={COMP_L_X} cy={py} r={COMP_R}
                    fill={info.color+"18"} stroke={info.color} strokeWidth="1.5" />
                  <text x={COMP_L_X} y={py-3} textAnchor="middle" fontSize="14">{info.icon}</text>
                  <text x={COMP_L_X} y={py+16} textAnchor="middle"
                    fill={info.color} fontSize="6.5" fontFamily="monospace" fontWeight="bold">
                    {info.label}
                  </text>

                  {/* Variable name if detected */}
                  {info.varName && (
                    <text x={COMP_L_X} y={py-COMP_R-5} textAnchor="middle"
                      fill={textMuted} fontSize="6" fontFamily="monospace" fontStyle="italic">
                      {info.varName}
                    </text>
                  )}

                  {/* Line number */}
                  <text x={BOARD_X-33} y={py+16} textAnchor="middle"
                    fill={textMuted} fontSize="5.5" fontFamily="monospace">
                    L{pin.line || '?'}
                  </text>

                  {/* Mode badge */}
                  <text x={COMP_L_X+COMP_R+4} y={py+3} textAnchor="start"
                    fill={info.color+"99"} fontSize="6" fontFamily="monospace">
                    {info.mode}
                  </text>
                </g>
              )
            })}

            {/* RIGHT PINS */}
            {rightPins.map((pin: any, i: number) => {
              const py = PIN_START_Y + i * ROW_H
              const info = getPinInfo(pin, code)
              return (
                <g key={"R"+i}>
                  <line x1={BOARD_X+BOARD_W+2} y1={py} x2={COMP_R_X-COMP_R} y2={py}
                    stroke={info.color} strokeWidth="2" strokeOpacity="0.8" />
                  <circle cx={BOARD_X+BOARD_W} cy={py} r="4.5" fill={info.color} />
                  <circle cx={COMP_R_X-COMP_R} cy={py} r="3" fill={info.color} fillOpacity="0.6" />

                  {/* Pin badge */}
                  <rect x={BOARD_X+BOARD_W+4} y={py-10} width={58} height={20} rx="6"
                    fill={info.color+"22"} stroke={info.color} strokeWidth="1" />
                  <text x={BOARD_X+BOARD_W+33} y={py+4} textAnchor="middle"
                    fill={info.color} fontSize="8" fontFamily="monospace" fontWeight="bold">
                    {info.pinName}
                  </text>

                  {/* Component circle */}
                  <circle cx={COMP_R_X} cy={py} r={COMP_R}
                    fill={info.color+"18"} stroke={info.color} strokeWidth="1.5" />
                  <text x={COMP_R_X} y={py-3} textAnchor="middle" fontSize="14">{info.icon}</text>
                  <text x={COMP_R_X} y={py+16} textAnchor="middle"
                    fill={info.color} fontSize="6.5" fontFamily="monospace" fontWeight="bold">
                    {info.label}
                  </text>

                  {/* Variable name */}
                  {info.varName && (
                    <text x={COMP_R_X} y={py-COMP_R-5} textAnchor="middle"
                      fill={textMuted} fontSize="6" fontFamily="monospace" fontStyle="italic">
                      {info.varName}
                    </text>
                  )}

                  {/* Line number */}
                  <text x={BOARD_X+BOARD_W+33} y={py+16} textAnchor="middle"
                    fill={textMuted} fontSize="5.5" fontFamily="monospace">
                    L{pin.line || '?'}
                  </text>

                  {/* Mode badge */}
                  <text x={COMP_R_X-COMP_R-4} y={py+3} textAnchor="end"
                    fill={info.color+"99"} fontSize="6" fontFamily="monospace">
                    {info.mode}
                  </text>
                </g>
              )
            })}

            {/* Empty state */}
            {pins.length === 0 && (
              <text x={SVG_W/2} y={SVG_H/2} textAnchor="middle"
                fill={textMuted} fontSize="13" fontFamily="monospace">
                Write code to see wiring diagram
              </text>
            )}
          </svg>
        </div>

        {/* Legend */}
        <div className="shrink-0 flex items-center justify-between px-5 py-2"
          style={{ borderTop: "1px solid " + borderCol, background: isDark ? "#0a0e14" : "#f1f5f9" }}>
          <div className="flex items-center gap-4 flex-wrap">
            {[
              ['ðŸ’¡','LED','#56d364'],['ðŸ””','Buzzer','#ffa657'],['âš™ï¸','Servo','#bc8cff'],
              ['ðŸ”˜','Button','#00e5ff'],['ðŸ“¡','Sensor','#ffa657'],['ðŸŒ¡ï¸','Temp','#f85149'],
              ['âš¡','Relay','#ffa657'],['ðŸŽ›ï¸','Pot','#ffa657'],
            ].map(([icon, label, color]) => (
              <div key={label} className="flex items-center gap-1">
                <span style={{ fontSize: 10 }}>{icon}</span>
                <span className="font-mono text-[9px]" style={{ color }}>{label}</span>
              </div>
            ))}
          </div>
          <span className="font-mono text-[10px]" style={{ color: textMuted }}>
            Components auto-detected from variable names
          </span>
        </div>
      </div>
    </div>
  )
}

