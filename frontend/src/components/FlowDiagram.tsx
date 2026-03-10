import React from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

interface FlowGraph {
    nodes: any[];
    edges: any[];
}

interface FlowDiagramProps {
    flow: FlowGraph;
}

export const FlowDiagram: React.FC<FlowDiagramProps> = ({ flow }) => {
    return (
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
            <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>Control Flow</h3>
            <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <ReactFlow
                    nodes={flow.nodes}
                    edges={flow.edges}
                    fitView
                    attributionPosition="bottom-right"
                >
                    <Background color="#334155" gap={16} />
                    <Controls showInteractive={false} />
                </ReactFlow>
            </div>
        </div>
    );
};
