
import { Platform } from './platformDetector';

export interface PinState {
    pin: string;
    state: 'HIGH' | 'LOW' | 'UNKNOWN';
    interface: 'GPIO' | 'UART' | 'SPI' | 'I2C';
    line: number;
}

export class HardwareAnalyzer {
    public analyze(rootNode: any, platform: Platform): PinState[] {
        const states: PinState[] = [];

        const traverse = (node: any) => {
            if (node.type === 'call_expression') {
                const funcNode = node.childForFieldName('function');
                const argsNode = node.childForFieldName('arguments');

                if (funcNode && argsNode) {
                    const funcName = funcNode.text;

                    const argsList: string[] = [];
                    for (let i = 0; i < argsNode.childCount; i++) {
                        const child = argsNode.child(i);
                        if (child && child.type !== '(' && child.type !== ')' && child.type !== ',') {
                            argsList.push(child.text);
                        }
                    }

                    if (platform === 'Arduino') {
                        if (funcName === 'digitalWrite' && argsList.length >= 2) {
                            const pin = argsList[0];
                            const stateArg = argsList[1];
                            let state: 'HIGH' | 'LOW' | 'UNKNOWN' = 'UNKNOWN';
                            if (stateArg === 'HIGH' || stateArg === '1') state = 'HIGH';
                            if (stateArg === 'LOW' || stateArg === '0') state = 'LOW';
                            states.push({ pin, state, interface: 'GPIO', line: node.startPosition.row + 1 });
                        } else if (funcName.startsWith('Serial.')) {
                            states.push({ pin: 'TX/RX', state: 'HIGH', interface: 'UART', line: node.startPosition.row + 1 });
                        } else if (funcName.startsWith('SPI.')) {
                            states.push({ pin: 'SCK/MISO/MOSI', state: 'UNKNOWN', interface: 'SPI', line: node.startPosition.row + 1 });
                        } else if (funcName.startsWith('Wire.')) {
                            states.push({ pin: 'SDA/SCL', state: 'UNKNOWN', interface: 'I2C', line: node.startPosition.row + 1 });
                        }
                    } else if (platform === 'STM32') {
                        if (funcName === 'HAL_GPIO_WritePin' && argsList.length >= 3) {
                            const port = argsList[0];
                            const pin = argsList[1];
                            const stateArg = argsList[2];
                            let state: 'HIGH' | 'LOW' | 'UNKNOWN' = 'UNKNOWN';
                            if (stateArg.includes('SET')) state = 'HIGH';
                            if (stateArg.includes('RESET')) state = 'LOW';
                            states.push({ pin: `${port}_${pin}`, state, interface: 'GPIO', line: node.startPosition.row + 1 });
                        }
                    } else if (platform === 'ESP32') {
                        if (funcName === 'gpio_set_level' && argsList.length >= 2) {
                            const pin = argsList[0];
                            const stateArg = argsList[1];
                            let state: 'HIGH' | 'LOW' | 'UNKNOWN' = 'UNKNOWN';
                            if (stateArg === '1') state = 'HIGH';
                            if (stateArg === '0') state = 'LOW';
                            states.push({ pin: `GPIO_${pin}`, state, interface: 'GPIO', line: node.startPosition.row + 1 });
                        } else if (funcName === 'uart_write_bytes') {
                            states.push({ pin: `UART_${argsList[0] || '?'}`, state: 'UNKNOWN', interface: 'UART', line: node.startPosition.row + 1 });
                        } else if (funcName === 'spi_device_transmit') {
                            states.push({ pin: 'SPI_BUS', state: 'UNKNOWN', interface: 'SPI', line: node.startPosition.row + 1 });
                        }
                    }
                }
            }

            for (let i = 0; i < node.childCount; i++) {
                const child = node.child(i);
                if (child) traverse(child);
            }
        };

        traverse(rootNode);
        return states;
    }
}

export const hardwareAnalyzer = new HardwareAnalyzer();
