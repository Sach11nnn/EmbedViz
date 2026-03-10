import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
export const MemoryGauge = ({ memory }) => {
    // Assume a very small 2KB SRAM baseline for visualization scale if running on small MCU
    const MAX_MEMORY = 2048;
    const percentage = Math.min((memory.totalBytes / MAX_MEMORY) * 100, 100);
    return (_jsxs("div", { className: "card", children: [_jsx("h3", { className: "card-title", children: "Static Memory Estimate" }), _jsxs("div", { className: "memory-stat", children: [_jsx("span", { children: "SRAM Usage" }), _jsxs("span", { style: { color: 'var(--accent-primary)', fontWeight: 600 }, children: [memory.totalBytes, " B"] })] }), _jsx("div", { className: "memory-bar-bg", children: _jsx("div", { className: "memory-bar-fill", style: { width: `${percentage}%` } }) }), _jsxs("div", { style: { fontSize: '0.8rem', color: 'var(--text-secondary)' }, children: [Object.entries(memory.breakdown).map(([type, bytes]) => (_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }, children: [_jsxs("span", { children: [type, " variables"] }), _jsxs("span", { children: [bytes, " B"] })] }, type))), Object.keys(memory.breakdown).length === 0 && (_jsx("span", { children: "No static variable declarations detected." }))] })] }));
};
//# sourceMappingURL=MemoryGauge.js.map