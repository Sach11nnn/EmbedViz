import React from 'react';
interface PinState {
    pin: string;
    state: 'HIGH' | 'LOW' | 'UNKNOWN';
    interface: 'GPIO' | 'UART' | 'SPI' | 'I2C';
    line: number;
}
interface PinDiagramProps {
    pins: PinState[];
}
export declare const PinDiagram: React.FC<PinDiagramProps>;
export {};
//# sourceMappingURL=PinDiagram.d.ts.map