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

export const PinDiagram: React.FC<PinDiagramProps> = ({ pins }) => {
    return (
        <div className="card">
            <h3 className="card-title">Hardware Interfaces</h3>
            {pins.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    No hardware functions detected in code. Use digitalWrite, HAL_GPIO_WritePin, etc.
                </p>
            ) : (
                <div className="pin-list">
                    {pins.map((p, idx) => (
                        <div key={`${p.pin}-${idx}`} className="pin-item">
                            <div>
                                <div className="pin-name">{p.pin}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                    {p.interface} • Line {p.line}
                                </div>
                            </div>
                            <div className={`pin-state ${p.state.toLowerCase()}`}>
                                {p.state}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
