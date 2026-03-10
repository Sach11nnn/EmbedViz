import { CodeParser } from './parser/codeParser';
const codeParser = new CodeParser();
import WebSocket, { WebSocketServer } from 'ws';
import express from 'express';
import http from 'http';
import cors from 'cors';
import url from 'url';
import { processCode } from './orchestrator';
import { serialManager } from './hardware/serialManager';

// Load .env
const fs = require('fs');
const path = require('path');
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line: string) => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
  });
}

const app = express();
app.use(cors({ origin: '*', methods: ['GET','POST'], allowedHeaders: ['Content-Type'] }));
app.use(express.json());
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
const PORT = process.env.PORT || 8080;
const AUTH_TOKEN = process.env.WS_AUTH_TOKEN || 'embedviz_secret_token_123';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);
  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (limit.count >= 10) return false;
  limit.count++;
  return true;
}

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/ports', async (req, res) => {
  try {
    const ports = await serialManager.getAvailablePorts();
    res.json(ports);
  } catch (e) {
    res.status(500).json({ error: 'Failed to list ports' });
  }
});

// AI Suggestions — Groq Proxy
app.post('/api/ai-suggest', async (req: any, res: any) => {
  const ip = req.ip || 'unknown';

  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded — max 10 requests/minute' });
  }

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'AI not configured — add GROQ_API_KEY to .env' });
  }

  const { code, platform, conflicts, timingIssues, memoryWarnings } = req.body;
  if (!code) return res.status(400).json({ error: 'No code provided' });

  try {
    const systemPrompt = `You are an expert embedded systems engineer for Arduino, ESP32, ESP8266.
Analyze the provided code and respond ONLY with valid JSON — no markdown, no backticks, no extra text.

JSON format:
{
  "summary": "one line summary of code quality",
  "suggestions": [
    { "type": "ERROR|WARNING|PERFORMANCE|MEMORY|SECURITY|INFO|ISR_ERROR|ISR_WARNING", "message": "actionable suggestion", "line": null }
  ],
  "optimizedTips": ["tip1", "tip2", "tip3"],
  "score": 75
}`;

    const userPrompt = `Platform: ${platform || 'Arduino Nano'}
Detected issues: ${JSON.stringify({ conflicts, timingIssues, memoryWarnings })}

Code:
${code.substring(0, 3000)}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + GROQ_API_KEY
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        temperature: 0.3,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Groq error:', err);
      return res.status(500).json({ error: 'AI request failed: ' + err });
    }

    const data: any = await response.json();
    const text = data.choices?.[0]?.message?.content || '{}';
    console.log('Groq response:', text.substring(0, 200));

    let parsed;
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = { summary: 'Analysis complete', suggestions: [], optimizedTips: [text], score: 70 };
    }

    res.json({ success: true, ...parsed });
  } catch (err: any) {
    console.error('AI error:', err);
    res.status(500).json({ error: 'AI suggestion failed: ' + err.message });
  }
});

// WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
  const parsedUrl = url.parse(request.url || '', true);
  const token = parsedUrl.query.token;
  if (token !== AUTH_TOKEN) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (ws: any) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  console.log('Client connected successfully');

  ws.on('message', (message: WebSocket.RawData) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'SET_PLATFORM') {
        ws.send(JSON.stringify({ type: 'ACK', status: 'platform_set' }));
      } else if (data.type === 'PARSE' && data.code) {
        const result = processCode(data.code);
        ws.send(JSON.stringify({ type: 'RESULT', data: result }));
      } else if (data.type === 'CONNECT_DEVICE') {
        serialManager.connect(data.port, parseInt(data.baudRate), ws);
      } else if (data.type === 'DISCONNECT_DEVICE') {
        serialManager.disconnect();
        ws.send(JSON.stringify({ type: 'DEVICE_STATUS', status: 'disconnected' }));
      } else {
        ws.send(JSON.stringify({ type: 'ACK', status: 'ignored' }));
      }
    } catch (e) {
      ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid JSON payload' }));
    }
  });

  ws.on('close', () => {
    serialManager.disconnect();
    console.log('Client disconnected');
  });
});

const interval = setInterval(() => {
  wss.clients.forEach((ws: any) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => clearInterval(interval));

try {
  codeParser.init();
  server.listen(PORT, () => {
    console.log('EmbedViz Backend running on port ' + PORT);
    console.log('AI suggestions: ' + (GROQ_API_KEY ? 'ENABLED (Groq LLaMA)' : 'DISABLED'));
  });
} catch (e) {
  console.error('Failed to initialize:', e);
  process.exit(1);
}
