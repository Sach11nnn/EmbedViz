import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
export const PinDiagram = ({ pins }) => {
    return (_jsxs("div", { className: "card", children: [_jsx("h3", { className: "card-title", children: "Hardware Interfaces" }), pins.length === 0 ? (_jsx("p", { style: { color: 'var(--text-secondary)', fontSize: '0.9rem' }, children: "No hardware functions detected in code. Use digitalWrite, HAL_GPIO_WritePin, etc." })) : (_jsx("div", { className: "pin-list", children: pins.map((p, idx) => (_jsxs("div", { className: "pin-item", children: [_jsxs("div", { children: [_jsx("div", { className: "pin-name", children: p.pin }), _jsxs("div", { style: { fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }, children: [p.interface, " \u2022 Line ", p.line] })] }), _jsx("div", { className: `pin-state ${p.state.toLowerCase()}`, children: p.state })] }, `${p.pin}-${idx}`))) }))] }));
};
//# sourceMappingURL=PinDiagram.js.map