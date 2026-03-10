import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import WebSocket from 'ws';

export class SerialManager {
    private activePort: SerialPort | null = null;
    private parser: ReadlineParser | null = null;

    public async getAvailablePorts() {
        try {
            const ports = await SerialPort.list();
            // If no ports detected, return common Windows COM ports as fallback
            if (ports.length === 0) {
                return [
                    { path: 'COM1' },
                    { path: 'COM2' },
                    { path: 'COM3' },
                    { path: 'COM4' },
                    { path: 'COM5' },
                    { path: 'COM6' },
                    { path: 'COM7' },
                    { path: 'COM8' },
                ];
            }
            return ports;
        } catch (error) {
            console.error('Error listing ports', error);
            // Return fallback ports on error
            return [
                { path: 'COM3' },
                { path: 'COM4' },
                { path: 'COM5' },
                { path: 'COM6' },
            ];
        }
    }

    public connect(portPath: string, baudRate: number, ws: WebSocket) {
        this.disconnect();

        // Windows COM port fix
        const normalizedPath = portPath.startsWith('COM')
            ? `\\\\.\\${portPath}`
            : portPath;

        try {
            this.activePort = new SerialPort({
                path: normalizedPath,
                baudRate: baudRate || 115200
            });
            this.parser = this.activePort.pipe(new ReadlineParser({ delimiter: '\n' }));

            this.activePort.on('open', () => {
                ws.send(JSON.stringify({ type: 'DEVICE_STATUS', status: 'connected', port: portPath }));
                console.log(`Connected to ${portPath}`);
            });

            this.parser.on('data', (line: string) => {
                ws.send(JSON.stringify({ type: 'SERIAL_DATA', data: line.trim() }));
            });

            this.activePort.on('error', (err) => {
                ws.send(JSON.stringify({ type: 'DEVICE_ERROR', error: err.message }));
                console.error(`Serial error: ${err.message}`);
                this.disconnect();
            });

            this.activePort.on('close', () => {
                ws.send(JSON.stringify({ type: 'DEVICE_STATUS', status: 'disconnected' }));
                console.log('Port closed');
            });

        } catch (e: any) {
            ws.send(JSON.stringify({ type: 'DEVICE_ERROR', error: e.message || 'Failed to open port' }));
            console.error(`Failed to open port: ${e.message}`);
        }
    }

    public disconnect() {
        if (this.activePort && this.activePort.isOpen) {
            this.activePort.close();
        }
        this.activePort = null;
        this.parser = null;
    }
}

export const serialManager = new SerialManager();