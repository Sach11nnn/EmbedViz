import React from 'react';

interface MemoryEstimate {
    totalBytes: number;
    breakdown: Record<string, number>;
}

interface MemoryGaugeProps {
    memory: MemoryEstimate;
}

export const MemoryGauge: React.FC<MemoryGaugeProps> = ({ memory }) => {
    // Assume a very small 2KB SRAM baseline for visualization scale if running on small MCU
    const MAX_MEMORY = 2048;
    const percentage = Math.min((memory.totalBytes / MAX_MEMORY) * 100, 100);

    return (
        <div className="card">
            <h3 className="card-title">Static Memory Estimate</h3>

            <div className="memory-stat">
                <span>SRAM Usage</span>
                <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                    {memory.totalBytes} B
                </span>
            </div>

            <div className="memory-bar-bg">
                <div
                    className="memory-bar-fill"
                    style={{ width: `${percentage}%` }}
                />
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {Object.entries(memory.breakdown).map(([type, bytes]) => (
                    <div key={type} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                        <span>{type} variables</span>
                        <span>{bytes} B</span>
                    </div>
                ))}
                {Object.keys(memory.breakdown).length === 0 && (
                    <span>No static variable declarations detected.</span>
                )}
            </div>
        </div>
    );
};
