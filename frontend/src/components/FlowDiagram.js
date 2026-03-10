import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
export const FlowDiagram = ({ flow }) => {
    return (_jsxs("div", { className: "card", style: { height: '400px', display: 'flex', flexDirection: 'column' }, children: [_jsx("h3", { className: "card-title", style: { marginBottom: '0.5rem' }, children: "Control Flow" }), _jsx("div", { style: { flex: 1, borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }, children: _jsxs(ReactFlow, { nodes: flow.nodes, edges: flow.edges, fitView: true, attributionPosition: "bottom-right", children: [_jsx(Background, { color: "#334155", gap: 16 }), _jsx(Controls, { showInteractive: false })] }) })] }));
};
//# sourceMappingURL=FlowDiagram.js.map