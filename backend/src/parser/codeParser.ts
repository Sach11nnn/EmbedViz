const PLATFORMS: Record<string, any> = {
  arduino_nano: {
    name: 'Arduino Nano', chip: 'ATmega328P', sram: 2048, flash: 32768,
    interfaces: ['UART','I2C','SPI']
  },
  esp32: {
    name: 'ESP32', chip: 'ESP32', sram: 532480, flash: 4194304,
    interfaces: ['UART','I2C','SPI','WiFi','Bluetooth','BLE']
  },
  esp8266: {
    name: 'ESP8266', chip: 'ESP8266', sram: 81920, flash: 4194304,
    interfaces: ['UART','I2C','SPI','WiFi']
  }
}

export interface FlowNode {
  id: string
  label: string
  type: 'start' | 'end' | 'process' | 'decision' | 'interrupt' | 'io' | 'delay'
  x: number
  y: number
}

export interface FlowEdge {
  from: string
  to: string
  label?: string
}

const NODE_H = 34
const NODE_GAP = 20
const STEP = NODE_H + NODE_GAP

export class CodeParser {
  public async init() {
    console.log('CodeParser initialized (regex mode)')
  }

  private detectPlatform(code: string): string {
    if (/ESP\.restart|WiFi\.begin|BluetoothSerial|BLEDevice|ledcWrite|dacWrite|touchRead/i.test(code)) return 'esp32'
    if (/ESP8266WiFi|ESP\.deepSleep|ESP8266WebServer/i.test(code)) return 'esp8266'
    if (/#include\s*<WiFi\.h>/i.test(code)) return 'esp32'
    if (/#include\s*<ESP8266/i.test(code)) return 'esp8266'
    return 'arduino_nano'
  }

  private extractFunctionBody(code: string, funcName: string): string {
    const regex = new RegExp('void\\s+' + funcName + '\\s*\\([^)]*\\)\\s*\\{')
    const match = regex.exec(code)
    if (!match) return ''
    let depth = 0, start = match.index + match[0].length - 1, i = start
    for (; i < code.length; i++) {
      if (code[i] === '{') depth++
      else if (code[i] === '}') { depth--; if (depth === 0) break }
    }
    return code.substring(start + 1, i)
  }

  // Generate nodes from function body — returns nodes + edges + height used
  private generateBodyNodes(
    body: string,
    prefix: string,
    startY: number,
    x: number
  ): { nodes: FlowNode[]; edges: FlowEdge[]; endY: number; lastId: string } {
    const nodes: FlowNode[] = []
    const edges: FlowEdge[] = []
    let y = startY
    let prevId = ''
    let count = 0

    const push = (label: string, type: FlowNode['type']): string => {
      const id = prefix + '_' + count++
      nodes.push({ id, label, type, x, y })
      if (prevId) edges.push({ from: prevId, to: id })
      prevId = id
      y += STEP
      return id
    }

    const lines = body.split('\n').map(l => l.trim()).filter(l =>
      l && !l.startsWith('//') && l !== '{' && l !== '}' && l !== '};'
    )

    for (const line of lines) {
      // delay
      if (/delay\s*\(/.test(line)) {
        const ms = (line.match(/delay\s*\(\s*(\d+)/) || [])[1] || '?'
        push('delay(' + ms + 'ms)', 'delay')
        continue
      }
      // Serial print
      if (/Serial\.(print|println|write)/.test(line)) {
        const val = (line.match(/Serial\.print(?:ln)?\s*\(([^)]{0,12})/) || [])[1] || ''
        push('Serial: ' + val, 'io')
        continue
      }
      // digitalWrite
      if (/digitalWrite\s*\(/.test(line)) {
        const m = line.match(/digitalWrite\s*\(\s*(\w+)\s*,\s*(\w+)/)
        if (m) push('digitalWrite(' + m[1] + ',' + m[2] + ')', 'io')
        continue
      }
      // analogRead/Write
      if (/analog(Read|Write)\s*\(/.test(line)) {
        const m = line.match(/analog(Read|Write)\s*\(\s*(\w+)/)
        if (m) push('analog' + m[1] + '(' + m[2] + ')', 'io')
        continue
      }
      // if statement
      if (/^if\s*\(/.test(line)) {
        const cond = (line.match(/^if\s*\((.+)\)/) || [])[1] || 'condition'
        const label = cond.length > 16 ? cond.substring(0, 16) + '…' : cond
        push(label + '?', 'decision')
        continue
      }
      // for/while
      if (/^(for|while)\s*\(/.test(line)) {
        const kw = (line.match(/^(\w+)/) || [])[1] || 'loop'
        push(kw + '(...)', 'decision')
        continue
      }
      // attachInterrupt
      if (/attachInterrupt\s*\(/.test(line)) {
        const m = line.match(/attachInterrupt\s*\([^,]+,\s*(\w+)\s*,\s*(\w+)/)
        if (m) push('IRQ: ' + m[1] + ' (' + m[2] + ')', 'interrupt')
        continue
      }
      // pinMode
      if (/pinMode\s*\(/.test(line)) {
        const m = line.match(/pinMode\s*\(\s*(\w+)\s*,\s*(\w+)/)
        if (m) push('pinMode(' + m[1] + ',' + m[2] + ')', 'process')
        continue
      }
      // Serial.begin
      if (/Serial\.begin/.test(line)) {
        const baud = (line.match(/Serial\.begin\s*\(\s*(\d+)/) || [])[1] || '9600'
        push('Serial.begin(' + baud + ')', 'process')
        continue
      }
      // Wire/SPI begin
      if (/Wire\.begin|SPI\.begin/.test(line)) {
        push(line.substring(0, 22), 'process')
        continue
      }
      // variable assignment with analogRead (e.g. val = analogRead(A0))
      if (/=\s*analogRead\s*\(/.test(line)) {
        const m = line.match(/(\w+)\s*=\s*analogRead\s*\(\s*(\w+)/)
        if (m) push(m[1] + ' = analogRead(' + m[2] + ')', 'io')
        continue
      }
      // variable assignment with digitalRead
      if (/=\s*digitalRead\s*\(/.test(line)) {
        const m = line.match(/(\w+)\s*=\s*digitalRead\s*\(\s*(\w+)/)
        if (m) push(m[1] + ' = digitalRead(' + m[2] + ')', 'io')
        continue
      }
      // function calls
      if (/^\w+\s*\(/.test(line)) {
        const fn = (line.match(/^(\w+)\s*\(/) || [])[1] || ''
        const skip = ['if','for','while','switch','pinMode','Serial','Wire','SPI','digitalWrite','digitalRead','analogWrite','analogRead','delay','attachInterrupt']
        if (fn && !skip.includes(fn)) {
          push(fn + '()', 'process')
        }
      }
    }

    return { nodes, edges, endY: y, lastId: prevId }
  }

  public parseCode(code: string, platformHint: string = '') {
    const pins: any[] = []
    const interfaces: any[] = []
    const functions: string[] = []
    const conflicts: any[] = []
    const timingIssues: any[] = []
    const memoryWarnings: any[] = []
    const suggestions: any[] = []
    const interrupts: any[] = []
    const lines = code.split('\n')
    let match

    const platformKey = platformHint || this.detectPlatform(code)
    const platform = PLATFORMS[platformKey] || PLATFORMS['arduino_nano']

    // Pin detection
    const pinModeRegex = /pinMode\s*\(\s*(\w+)\s*,\s*(INPUT|OUTPUT|INPUT_PULLUP)\s*\)/g
    while ((match = pinModeRegex.exec(code)) !== null) {
      const lineNum = code.substring(0, match.index).split('\n').length
      pins.push({ pin: match[1], mode: match[2], type: 'GPIO', line: lineNum })
    }
    const digitalRegex = /digital(Write|Read)\s*\(\s*(\w+)/g
    while ((match = digitalRegex.exec(code)) !== null) {
      const lineNum = code.substring(0, match.index).split('\n').length
      const exists = pins.find((p: any) => p.pin === match[2] && p.type === 'GPIO')
      if (!exists) pins.push({ pin: match[2], mode: match[1]==='Write'?'OUTPUT':'INPUT', type: 'GPIO', line: lineNum })
    }
    const analogRegex = /analog(Write|Read)\s*\(\s*(\w+)/g
    while ((match = analogRegex.exec(code)) !== null) {
      const lineNum = code.substring(0, match.index).split('\n').length
      const exists = pins.find((p: any) => p.pin === match[2] && p.type === 'ANALOG')
      if (!exists) pins.push({ pin: match[2], mode: match[1]==='Write'?'PWM':'ADC', type: 'ANALOG', line: lineNum })
    }
    if (platformKey === 'esp32') {
      const ledcRegex = /ledcWrite\s*\(\s*(\w+)/g
      while ((match = ledcRegex.exec(code)) !== null) {
        pins.push({ pin: match[1], mode: 'PWM', type: 'LEDC', line: code.substring(0, match.index).split('\n').length })
      }
    }

    // Interfaces
    if (/Serial\.begin/i.test(code)) {
      const baud = code.match(/Serial\.begin\s*\(\s*(\d+)/)?.[1] || '9600'
      interfaces.push({ type: 'UART', name: 'Serial', pins: 'TX/RX', baud, line: code.substring(0, code.search(/Serial\.begin/)).split('\n').length })
    }
    if (/Wire\.begin/i.test(code)) {
      interfaces.push({ type: 'I2C', name: 'Wire', pins: platformKey==='esp32'?'GPIO21/22':'SDA/SCL', line: code.substring(0, code.search(/Wire\.begin/)).split('\n').length })
    }
    if (/SPI\.begin/i.test(code)) {
      interfaces.push({ type: 'SPI', name: 'SPI', pins: 'MOSI/MISO/SCK', line: 0 })
    }
    if (/WiFi\.begin/i.test(code)) {
      interfaces.push({ type: 'WiFi', name: 'WiFi', pins: 'Internal', line: code.substring(0, code.search(/WiFi\.begin/)).split('\n').length })
      suggestions.push({ type: 'SECURITY', message: 'WiFi credentials hardcoded — use config file!' })
    }
    if (/BluetoothSerial|BLEDevice/i.test(code)) {
      interfaces.push({ type: 'Bluetooth', name: 'BT/BLE', pins: 'Internal', line: 0 })
    }

    // Functions
    const funcRegex = /void\s+(\w+)\s*\(/g
    while ((match = funcRegex.exec(code)) !== null) functions.push(match[1])

    // Interrupts
    const attachRegex = /attachInterrupt\s*\(\s*digitalPinToInterrupt\s*\(\s*(\w+)\s*\)\s*,\s*(\w+)\s*,\s*(RISING|FALLING|CHANGE|LOW|HIGH)\s*\)/g
    while ((match = attachRegex.exec(code)) !== null) {
      const lineNum = code.substring(0, match.index).split('\n').length
      interrupts.push({ pin: match[1], handler: match[2], mode: match[3], line: lineNum, severity: 'INFO',
        message: 'ISR ' + match[2] + ' on pin ' + match[1] + ' (' + match[3] + ' edge)' })
    }
    if (interrupts.length > 0 && !/volatile\s+\w+/.test(code)) {
      suggestions.push({ type: 'ISR_WARNING', message: 'ISR detected but no volatile variables — shared vars must be volatile!' })
    }

    // Conflicts
    const pinUsageMap: Record<string, any[]> = {}
    pins.forEach((p: any) => { if (!pinUsageMap[p.pin]) pinUsageMap[p.pin]=[]; pinUsageMap[p.pin].push(p) })
    Object.entries(pinUsageMap).forEach(([pin, usages]) => {
      if (usages.length > 1) {
        const modes = usages.map((u:any)=>u.mode)
        if ((modes.includes('OUTPUT')&&modes.includes('INPUT'))||(modes.includes('ADC')&&modes.includes('OUTPUT')))
          conflicts.push({ pin, severity:'ERROR', message:'Pin '+pin+' conflict: '+modes[0]+' vs '+modes[1] })
      }
    })

    // Timing
    const delayRegex = /delay\s*\(\s*(\d+)\s*\)/g
    while ((match = delayRegex.exec(code)) !== null) {
      const lineNum = code.substring(0, match.index).split('\n').length
      const ms = parseInt(match[1])
      if (ms >= 1000) timingIssues.push({ line: lineNum, ms, severity:'WARNING', message:'delay('+ms+') blocks CPU — use millis()' })
    }

    // Memory
    const intVars = (code.match(/^int\s+\w+/gm)||[]).length
    const floatVars = (code.match(/^float\s+\w+/gm)||[]).length
    const longVars = (code.match(/^long\s+\w+/gm)||[]).length
    const byteVars = (code.match(/^byte\s+\w+/gm)||[]).length
    const sramUsed = (intVars*2)+(floatVars*4)+(longVars*4)+(byteVars*1)+9
    const codeLineCount = lines.filter((l:string)=>l.trim()&&!l.trim().startsWith('//')).length
    const stringBytes: number = (code.match(/"[^"]*"/g) as string[]||[]).reduce((s:number,str:string)=>s+str.length,0)
    const flashUsed: number = (codeLineCount*8)+stringBytes+(functions.length*20)+466
    if ((sramUsed/platform.sram)*100 > 75) memoryWarnings.push({ severity:'ERROR', message:'SRAM '+(((sramUsed/platform.sram)*100).toFixed(0))+'% — risk of crash!' })
    else if ((sramUsed/platform.sram)*100 > 50) memoryWarnings.push({ severity:'WARNING', message:'SRAM usage high — optimize variables' })
    if (/delay\s*\(\s*\d+\s*\)/g.test(code)) suggestions.push({ type:'PERFORMANCE', message:'Replace delay() with millis() for non-blocking code' })
    if (!/Serial\.begin/i.test(code)&&/Serial\./i.test(code)) suggestions.push({ type:'BUG', message:'Serial used without Serial.begin()!' })

    // ===== DYNAMIC FLOW GRAPH =====
    const flowNodes: FlowNode[] = []
    const flowEdges: FlowEdge[] = []

    // MAIN COLUMN (x=200): start → setup nodes → loop nodes
    const MAIN_X = 200
    const IRQ_X = 420  // Interrupt handlers column

    let y = 20

    // START
    flowNodes.push({ id: 'start', label: 'RESET', type: 'start', x: MAIN_X, y })
    let prevId = 'start'
    y += STEP

    // SETUP
    const setupBody = this.extractFunctionBody(code, 'setup')
    if (setupBody) {
      const setupId = 'setup_hdr'
      flowNodes.push({ id: setupId, label: 'setup()', type: 'process', x: MAIN_X, y })
      flowEdges.push({ from: prevId, to: setupId })
      prevId = setupId
      y += STEP

      const { nodes: sNodes, edges: sEdges, endY, lastId } = this.generateBodyNodes(setupBody, 'su', y, MAIN_X)
      flowNodes.push(...sNodes)
      // Connect setup_hdr → first setup node
      if (sNodes.length > 0) {
        flowEdges.push({ from: setupId, to: sNodes[0].id })
        flowEdges.push(...sEdges)
        prevId = lastId || setupId
        y = endY
      }
    }

    // LOOP
    const loopBody = this.extractFunctionBody(code, 'loop')
    if (loopBody) {
      const loopId = 'loop_hdr'
      flowNodes.push({ id: loopId, label: 'loop()', type: 'process', x: MAIN_X, y })
      flowEdges.push({ from: prevId, to: loopId })
      y += STEP

      const { nodes: lNodes, edges: lEdges, endY, lastId } = this.generateBodyNodes(loopBody, 'lp', y, MAIN_X)
      flowNodes.push(...lNodes)
      if (lNodes.length > 0) {
        flowEdges.push({ from: loopId, to: lNodes[0].id })
        flowEdges.push(...lEdges)
        // Loop back
        flowEdges.push({ from: lastId || loopId, to: loopId, label: '↺' })
        y = endY
      }
    }

    // CUSTOM FUNCTIONS — right column
    const customFuncs = functions.filter(f => f !== 'setup' && f !== 'loop' && !/IRAM_ATTR/.test(f))
    let fnY = 20
    customFuncs.forEach((fn) => {
      const fnBody = this.extractFunctionBody(code, fn)
      if (!fnBody) return
      const fnId = 'fn_' + fn
      flowNodes.push({ id: fnId, label: fn + '()', type: 'process', x: IRQ_X, y: fnY })
      fnY += STEP
      const { nodes: fnNodes, edges: fnEdges, endY } = this.generateBodyNodes(fnBody, 'fn_' + fn, fnY, IRQ_X)
      flowNodes.push(...fnNodes)
      if (fnNodes.length > 0) {
        flowEdges.push({ from: fnId, to: fnNodes[0].id })
        flowEdges.push(...fnEdges)
      }
      fnY = endY + NODE_GAP * 2
    })

    // INTERRUPTS — right column after custom fns
    interrupts.forEach((irq, idx) => {
      flowNodes.push({
        id: 'irq_' + irq.handler,
        label: irq.handler + ' (' + irq.mode + ')',
        type: 'interrupt',
        x: IRQ_X,
        y: fnY + idx * (STEP * 2)
      })
    })

    return {
      pins: [...pins, ...interfaces.map((i:any) => ({
        pin: i.name, mode: i.type, type: i.type, line: i.line, pins: i.pins, baud: i.baud
      }))],
      interfaces, functions, conflicts, timingIssues, memoryWarnings, suggestions, interrupts,
      platformKey, platformName: platform.name,
      memory: {
        sram: Math.min(sramUsed, platform.sram), sramTotal: platform.sram,
        flash: Math.min(flashUsed, platform.flash), flashTotal: platform.flash
      },
      flow: { nodes: flowNodes, edges: flowEdges }
    }
  }
}
