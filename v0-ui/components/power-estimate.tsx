"use client"

import { useState, useEffect } from "react"
import { useEmbedViz } from "./embedviz-context"
import { X, Battery, Zap, Clock } from "lucide-react"

interface PowerComponent {
  name: string
  current_ma: number
  active: boolean
  icon: string
}

function estimatePower(code: string, platform: string): {
  components: PowerComponent[]
  totalMa: number
  sleepMa: number
  notes: string[]
} {
  const notes: string[] = []
  const isESP32 = /esp32/i.test(platform)
  const isESP8266 = /esp8266/i.test(platform)

  // Base MCU current
  const baseMa = isESP32 ? 80 : isESP8266 ? 80 : 15
  const components: PowerComponent[] = [
    {
      name: isESP32 ? "ESP32 MCU" : isESP8266 ? "ESP8266 MCU" : "ATmega328P",
      current_ma: baseMa,
      active: true,
      icon: "chip"
    }
  ]

  // WiFi
  if (/WiFi\.begin|WiFi\.connect/i.test(code)) {
    components.push({ name: "WiFi Radio", current_ma: 120, active: true, icon: "wifi" })
    notes.push("WiFi active — major power drain. Use WiFi.disconnect() when idle.")
  }

  // Bluetooth
  if (/BluetoothSerial|BLEDevice|BLE/i.test(code)) {
    components.push({ name: "Bluetooth/BLE", current_ma: 30, active: true, icon: "bt" })
    notes.push("BLE active — disable when not in use to save ~30mA.")
  }

  // Serial
  if (/Serial\.begin/i.test(code)) {
    components.push({ name: "USB Serial (TX/RX)", current_ma: 3, active: true, icon: "serial" })
  }

  // I2C devices (estimated)
  if (/Wire\.begin/i.test(code)) {
    components.push({ name: "I2C Device(s)", current_ma: 5, active: true, icon: "i2c" })
    notes.push("I2C sensor detected — check datasheet for exact current draw.")
  }

  // SPI devices
  if (/SPI\.begin/i.test(code)) {
    components.push({ name: "SPI Device(s)", current_ma: 8, active: true, icon: "spi" })
  }

  // LEDs - count digitalWrite HIGH calls
  const highCount = (code.match(/digitalWrite\s*\([^,]+,\s*HIGH/g) || []).length
  if (highCount > 0) {
    components.push({ name: `LED(s) ×${highCount}`, current_ma: highCount * 20, active: true, icon: "led" })
    notes.push(`${highCount} LED(s) detected @ ~20mA each. Use 330Ω resistors!`)
  }

  // Servo
  if (/Servo\.|servo\./i.test(code)) {
    components.push({ name: "Servo Motor", current_ma: 200, active: true, icon: "servo" })
    notes.push("Servo detected — draws up to 200mA under load. Use separate power supply for multiple servos.")
  }

  // Relay
  if (/relay/i.test(code)) {
    components.push({ name: "Relay Module", current_ma: 70, active: true, icon: "relay" })
  }

  // Sleep mode detection
  const hasSleep = /esp_deep_sleep|ESP.deepSleep|LowPower|sleep_mode/i.test(code)
  if (hasSleep) {
    notes.push("Sleep mode detected — great for battery life!")
  } else if (isESP32 || isESP8266) {
    notes.push("No sleep mode detected — add esp_deep_sleep_start() to extend battery life dramatically.")
  }

  // Long delays = potential for sleep
  const longDelays = (code.match(/delay\s*\(\s*(\d+)/g) || [])
    .map(d => parseInt(d.match(/\d+/)?.[0] || "0"))
    .filter(ms => ms >= 1000)
  if (longDelays.length > 0) {
    notes.push(`${longDelays.length} long delay(s) found — replace with deep sleep for ${isESP32 ? "~2,500×" : "~500×"} power savings.`)
  }

  const totalMa = components.filter(c => c.active).reduce((a, c) => a + c.current_ma, 0)
  const sleepMa = isESP32 ? 0.01 : isESP8266 ? 0.02 : 0.1

  return { components, totalMa, sleepMa, notes }
}

function batteryLife(capacityMah: number, activeMa: number, sleepMa: number, dutyCycle: number) {
  // dutyCycle = fraction of time active (0-1)
  const avgMa = activeMa * dutyCycle + sleepMa * (1 - dutyCycle)
  const hours = capacityMah / avgMa
  if (hours < 1) return Math.round(hours * 60) + " minutes"
  if (hours < 24) return hours.toFixed(1) + " hours"
  if (hours < 24 * 30) return (hours / 24).toFixed(1) + " days"
  return (hours / (24 * 30)).toFixed(1) + " months"
}

const BATTERIES = [
  { name: "CR2032 (coin)", mah: 220 },
  { name: "AA × 2 (3V)", mah: 2500 },
  { name: "18650 LiPo", mah: 3000 },
  { name: "5000mAh Power Bank", mah: 5000 },
  { name: "Custom...", mah: 0 },
]

const ICON_MAP: Record<string, string> = {
  chip: "⚙️", wifi: "📶", bt: "📡", serial: "🔌", i2c: "🔗",
  spi: "⚡", led: "💡", servo: "🔧", relay: "🔄",
}

export function PowerEstimate({ onClose }: { onClose: () => void }) {
  const { platform, theme } = useEmbedViz()
  const isDark = theme === "dark"
  const code = typeof window !== "undefined" ? (window as any).__embedviz_code || "" : ""

  const [batteryIdx, setBatteryIdx] = useState(2)
  const [customMah, setCustomMah] = useState(3000)
  const [dutyCycle, setDutyCycle] = useState(100)
  const [components, setComponents] = useState<PowerComponent[]>([])
  const [totalMa, setTotalMa] = useState(0)
  const [sleepMa, setSleepMa] = useState(0.01)
  const [notes, setNotes] = useState<string[]>([])

  useEffect(() => {
    const result = estimatePower(code, platform || "arduino_nano")
    setComponents(result.components)
    setTotalMa(result.totalMa)
    setSleepMa(result.sleepMa)
    setNotes(result.notes)
  }, [code, platform])

  const selectedBattery = BATTERIES[batteryIdx]
  const mah = batteryIdx === BATTERIES.length - 1 ? customMah : selectedBattery.mah
  const dc = dutyCycle / 100
  const life = batteryLife(mah, totalMa, sleepMa, dc)
  const lifeWithSleep = batteryLife(mah, totalMa, sleepMa, 0.01)

  const bg = isDark ? "#0d1117" : "#ffffff"
  const border = isDark ? "#1c2530" : "#d0d8e4"
  const headerBg = isDark ? "#0a0e14" : "#f8fafc"
  const textPrimary = isDark ? "#c5cdd8" : "#2a3a4a"
  const textMuted = isDark ? "#6b7280" : "#8090a0"
  const cardBg = isDark ? "#131920" : "#f8fafc"

  const powerColor = totalMa < 50 ? "#56d364" : totalMa < 200 ? "#ffa657" : "#f85149"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.88)" }}>
      <div className="flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ width: "740px", height: "86vh", background: bg, border: "1px solid " + border }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ borderBottom: "1px solid " + border, background: headerBg }}>
          <div className="flex items-center gap-3">
            <Zap className="h-4 w-4 text-[#ffa657]" />
            <span className="font-mono font-bold text-sm uppercase tracking-widest text-[#ffa657]">
              Power Estimate
            </span>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: powerColor + "20", color: powerColor, border: "1px solid " + powerColor + "40" }}>
              {totalMa.toFixed(0)} mA total
            </span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-red-500/20 transition-colors">
            <X size={18} color="#f85149" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left — Components */}
          <div className="flex flex-col w-56 shrink-0 overflow-auto"
            style={{ borderRight: "1px solid " + border }}>
            <div className="px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-wider"
              style={{ color: textMuted, borderBottom: "1px solid " + border }}>
              Active Components
            </div>
            {components.map((comp, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2"
                style={{ borderBottom: "1px solid " + border + "60" }}>
                <span style={{ fontSize: 14 }}>{ICON_MAP[comp.icon] || "🔌"}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[10px] font-bold truncate" style={{ color: textPrimary }}>
                    {comp.name}
                  </div>
                  <div className="font-mono text-[9px]" style={{ color: textMuted }}>
                    ~{comp.current_ma} mA
                  </div>
                </div>
                {/* Bar */}
                <div className="w-12 h-1.5 rounded-full overflow-hidden shrink-0"
                  style={{ background: isDark ? "#1c2530" : "#e2e8f0" }}>
                  <div className="h-full rounded-full" style={{
                    width: Math.min((comp.current_ma / totalMa) * 100, 100) + "%",
                    background: "#ffa657"
                  }} />
                </div>
              </div>
            ))}

            {/* Total */}
            <div className="px-4 py-3 mt-auto" style={{ borderTop: "1px solid " + border }}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase" style={{ color: textMuted }}>Total</span>
                <span className="font-mono text-[13px] font-bold" style={{ color: powerColor }}>
                  {totalMa.toFixed(0)} mA
                </span>
              </div>
              <div className="font-mono text-[9px] mt-1" style={{ color: textMuted }}>
                Sleep: ~{sleepMa} mA
              </div>
            </div>
          </div>

          {/* Right — Battery + Estimates */}
          <div className="flex-1 flex flex-col overflow-auto p-5 gap-5">

            {/* Battery selector */}
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: textMuted }}>
                Battery Type
              </div>
              <div className="grid grid-cols-2 gap-2">
                {BATTERIES.map((b, i) => (
                  <button key={i} onClick={() => setBatteryIdx(i)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all"
                    style={{
                      background: batteryIdx === i ? "#ffa65720" : cardBg,
                      border: "1px solid " + (batteryIdx === i ? "#ffa65750" : border),
                      color: batteryIdx === i ? "#ffa657" : textPrimary
                    }}>
                    <Battery className="h-3.5 w-3.5 shrink-0" />
                    <div>
                      <div className="font-mono text-[10px] font-bold">{b.name}</div>
                      {b.mah > 0 && <div className="font-mono text-[9px]" style={{ color: textMuted }}>{b.mah} mAh</div>}
                    </div>
                  </button>
                ))}
              </div>
              {batteryIdx === BATTERIES.length - 1 && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-mono text-[10px]" style={{ color: textMuted }}>Capacity:</span>
                  <input type="number" value={customMah} onChange={e => setCustomMah(parseInt(e.target.value) || 1000)}
                    className="flex-1 px-2 py-1 rounded-lg font-mono text-[11px] outline-none"
                    style={{ background: cardBg, border: "1px solid " + border, color: textPrimary }} />
                  <span className="font-mono text-[10px]" style={{ color: textMuted }}>mAh</span>
                </div>
              )}
            </div>

            {/* Duty cycle slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: textMuted }}>
                  Active Time
                </div>
                <span className="font-mono text-[11px] font-bold" style={{ color: "#00e5ff" }}>
                  {dutyCycle}%
                </span>
              </div>
              <input type="range" min={1} max={100} value={dutyCycle}
                onChange={e => setDutyCycle(parseInt(e.target.value))}
                className="w-full accent-[#00e5ff]" />
              <div className="flex justify-between font-mono text-[9px] mt-1" style={{ color: textMuted }}>
                <span>1% (mostly sleeping)</span>
                <span>100% (always on)</span>
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl"
                style={{ background: cardBg, border: "1px solid " + border }}>
                <Clock className="h-5 w-5 mb-2 text-[#00e5ff]" />
                <div className="font-mono text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: textMuted }}>
                  Battery Life
                </div>
                <div className="font-mono text-xl font-bold text-center" style={{ color: "#00e5ff" }}>
                  {life}
                </div>
                <div className="font-mono text-[9px] mt-1 text-center" style={{ color: textMuted }}>
                  at {dutyCycle}% active · {mah}mAh
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-4 rounded-2xl"
                style={{ background: "#56d36410", border: "1px solid #56d36430" }}>
                <Zap className="h-5 w-5 mb-2 text-[#56d364]" />
                <div className="font-mono text-[11px] font-bold uppercase tracking-wider mb-1 text-[#56d364]">
                  With Sleep Mode
                </div>
                <div className="font-mono text-xl font-bold text-center text-[#56d364]">
                  {lifeWithSleep}
                </div>
                <div className="font-mono text-[9px] mt-1 text-center" style={{ color: textMuted }}>
                  1% active · {sleepMa}mA sleep
                </div>
              </div>
            </div>

            {/* Notes / Tips */}
            {notes.length > 0 && (
              <div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: textMuted }}>
                  Power Tips
                </div>
                <div className="flex flex-col gap-2">
                  {notes.map((note, i) => (
                    <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-xl"
                      style={{ background: "#ffa65710", border: "1px solid #ffa65730" }}>
                      <span className="text-[#ffa657] text-[11px] mt-0.5 shrink-0">⚡</span>
                      <span className="font-mono text-[10px]" style={{ color: textPrimary }}>{note}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-2 shrink-0"
          style={{ borderTop: "1px solid " + border, background: headerBg }}>
          <span className="font-mono text-[9px]" style={{ color: textMuted }}>
            Estimates based on typical datasheet values · Actual usage may vary
          </span>
          <span className="font-mono text-[10px] font-bold" style={{ color: powerColor }}>
            Avg: {(totalMa * dc + sleepMa * (1 - dc)).toFixed(1)} mA
          </span>
        </div>
      </div>
    </div>
  )
}
