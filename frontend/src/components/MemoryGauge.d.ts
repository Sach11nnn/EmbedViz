import React from 'react';
interface MemoryEstimate {
    totalBytes: number;
    breakdown: Record<string, number>;
}
interface MemoryGaugeProps {
    memory: MemoryEstimate;
}
export declare const MemoryGauge: React.FC<MemoryGaugeProps>;
export {};
//# sourceMappingURL=MemoryGauge.d.ts.map