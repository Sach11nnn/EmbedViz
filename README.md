<div align="center">

<img src="https://img.shields.io/badge/EmbedViz-v1.0.0-00e5ff?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTEyIDJMMyA3bDkgNSA5LTV6bTAgMTBMMyAxMmw5IDUgOS01ek0zIDE3bDkgNSA5LTV6Ii8+PC9zdmc+" alt="EmbedViz" />

# EmbedViz

### Embedded Systems Visualizer

**Turn your Arduino, ESP32 & STM32 code into live visual dashboards**

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-56d364?style=flat-square)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-bc8cff?style=flat-square)](https://github.com/Sach11nnn/embedviz/pulls)

[📖 Docs](#getting-started) · [🐛 Report Bug](https://github.com/Sach11nnn/embedviz/issues) · [✨ Request Feature](https://github.com/Sach11nnn/embedviz/issues)

</div>

---

## What is EmbedViz?

EmbedViz is an open-source developer tool that gives embedded systems programmers a **real-time visual interface** for their code. Instead of guessing what your microcontroller is doing, you can see it — live pin states, auto-generated control flow diagrams, memory usage, serial output, and AI-powered code analysis, all in one place.

> Built because Arduino IDE's serial monitor was never enough.

---

## Screenshots

| Control Flow | Pin States | Power Estimator |
|:---:|:---:|:---:|
| Auto-generated flowchart | Live HIGH/LOW monitor | Battery life calculator |

| Code Export | Pinout Reference | AI Analysis |
|:---:|:---:|:---:|
| Diff viewer + download | Arduino & ESP32 pins | Groq LLaMA suggestions |

---

## Features

### Core Visualizations
- **Dynamic Control Flow Diagram** — Auto-generates a flowchart from your C/C++ code with zoom, pan, and fullscreen
- **Real-time Pin Monitor** — Detects GPIO, PWM, ADC, UART, I2C, SPI pins and shows live HIGH/LOW states
- **Multi-Sensor Graph** — Live chart with toggle, stats, and CSV export
- **Wiring Diagram** — Auto-detects components (LED, servo, DHT11, etc.) and draws connections

### Code Tools
- **Monaco Editor** — VS Code-quality editor with C/C++ support, multi-file tabs, and file upload
- **Code Export** — Download optimized `.ino` with side-by-side diff viewer
- **Sessions Panel** — Save, load, import/export coding sessions (100% local, no cloud)

### Hardware Intelligence
- **Memory Estimator** — Live SRAM/Flash usage with threshold warnings
- **Interrupt Analyzer** — Detects ISR conflicts and missing `volatile` keywords
- **Pin Conflict Detection** — Flags pins assigned to multiple functions
- **Timing Analysis** — Warns about `delay()` blocking calls

### Platform Support
- **AI Code Analysis** — Groq LLaMA 70B powered suggestions, score, and optimization tips
- **Power Consumption Estimator** — Battery life calculator with WiFi/BLE/LED detection
- **Pinout Reference** — Full Arduino Nano + ESP32 pinout with search and filter
- **Board Selector** — Arduino Nano, Uno, Mega, ESP32, ESP8266, STM32

### Developer Experience
- **Serial Monitor** — Color-coded, timestamped, filterable output
- **Dark / Light theme**
- **Local-first** — No login, no cloud, no tracking. Your code stays on your machine.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React, TypeScript, Tailwind CSS |
| Editor | Monaco Editor (`@monaco-editor/react`) |
| Diagrams | React Flow / custom SVG canvas |
| Backend | Node.js, Express, WebSocket (`ws`) |
| AI | Groq API (LLaMA 3.3 70B) — free tier |
| Code Analysis | Regex-based C/C++ parser |
| Storage | localStorage (sessions) — no database needed |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- A Groq API key (free at [console.groq.com](https://console.groq.com))

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/Sach11nnn/embedviz.git
cd embedviz

# 2. Install backend dependencies
cd backend
npm install

# 3. Create backend .env
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# 4. Install frontend dependencies
cd ../v0-ui
npm install
```

### Running Locally

```bash
# Terminal 1 — Start backend (port 8080)
cd backend
npx ts-node src/server.ts

# Terminal 2 — Start frontend (port 3000)
cd v0-ui
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Windows (one-click)

```powershell
# Run start.bat from project root
.\start.bat
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Required for AI analysis
GROQ_API_KEY=your_groq_api_key_here

# Server config
PORT=8080
WS_AUTH_TOKEN=change_this_to_a_random_secret
NODE_ENV=development
```

### Frontend (`v0-ui/.env.local`)

```env
# Point to your backend (change for production)
NEXT_PUBLIC_WS_URL=ws://localhost:8080
NEXT_PUBLIC_WS_TOKEN=change_this_to_a_random_secret
```

> ⚠️ **Never commit `.env` files.** They are in `.gitignore` by default.

---

---

## Project Structure

```
embedviz/
├── backend/                  # Node.js + WebSocket server
│   ├── src/
│   │   ├── server.ts         # Express + WS server, Groq proxy
│   │   ├── orchestrator.ts   # Code processing pipeline
│   │   ├── parser/
│   │   │   └── codeParser.ts # C/C++ regex parser
│   │   ├── hardware/
│   │   │   └── serialManager.ts  # Serial port manager
│   │   └── analysis/
│   │       ├── flowGenerator.ts      # Control flow graph
│   │       ├── hardwareAnalyzer.ts   # Pin/protocol detection
│   │       ├── memoryEstimator.ts    # SRAM/Flash calculator
│   │       └── platformDetector.ts  # Board detection
│   ├── .env.example
│   └── package.json
│
└── v0-ui/                    # Next.js frontend
    ├── app/
    │   ├── page.tsx          # Landing page
    │   └── app/page.tsx      # Main app layout
    ├── components/
    │   ├── code-editor.tsx       # Monaco editor + multi-file tabs
    │   ├── control-flow.tsx      # Flowchart diagram
    │   ├── pin-states.tsx        # Hardware panel
    │   ├── serial-monitor.tsx    # Serial output viewer
    │   ├── sensor-graph.tsx      # Live chart
    │   ├── memory-gauge.tsx      # SRAM/Flash bars
    │   ├── wiring-diagram.tsx    # Component wiring
    │   ├── ai-suggestions.tsx    # Groq AI analysis
    │   ├── interrupt-analyzer.tsx
    │   ├── code-export.tsx       # Export + diff viewer
    │   ├── pinout-reference.tsx  # Pin reference
    │   ├── power-estimate.tsx    # Battery estimator
    │   ├── sessions-panel.tsx    # Save/load sessions
    │   └── embedviz-context.tsx  # Global state
    ├── lib/
    │   └── session-service.ts    # localStorage sessions
    └── package.json
```

---

## How It Works

```
Your Code (C/C++)
      │
      ▼
[Code Parser] ──► regex-based AST
      │
      ├──► [Flow Generator]      → Control flow nodes/edges
      ├──► [Hardware Analyzer]   → Pin/protocol detection
      ├──► [Memory Estimator]    → SRAM/Flash usage
      └──► [Platform Detector]   → Board type
      │
      ▼
[WebSocket] ──► Frontend React
      │
      ├──► Control Flow Diagram
      ├──► Pin States Panel
      ├──► Memory Gauge
      └──► Wiring Diagram

[Serial Port] ──► Serial Monitor + Sensor Graph (local only)
[Groq API]    ──► AI Code Analysis (via backend proxy)
```

---

## Contributing

Contributions are welcome! Here's how:

```bash
# Fork the repo, then:
git checkout -b feature/your-feature-name
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
# Open a Pull Request
```

Please follow the existing code style (TypeScript, functional React components, Tailwind CSS).

---

## Roadmap

- [ ] STM32 full support
- [ ] RTOS task visualization
- [ ] GitHub Gist import/export
- [ ] Dark/Light theme for landing page
- [ ] VS Code extension
- [ ] Offline AI (local LLM via Ollama)
- [ ] Multi-board simulation

---

## License

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)** license.

| | |
|---|---|
| ✅ Use freely | Students, hobbyists, researchers, educators |
| ✅ Modify & share | Fork it, improve it, build on it |
| ✅ Credit required | Keep Sachin Rajawat's name in your version |
| ❌ No commercial use | Cannot be sold or used in paid products |

See the [LICENSE](LICENSE) file or visit [creativecommons.org/licenses/by-nc/4.0](https://creativecommons.org/licenses/by-nc/4.0) for full details.

---

## Author

**Sachin Rajawat**

- GitHub: [@Sach11nnn](https://github.com/Sach11nnn)

---

<div align="center">

Made with ❤️ for the embedded systems community

⭐ Star this repo if EmbedViz helped you!

</div>
