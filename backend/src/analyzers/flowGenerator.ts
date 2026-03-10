

export interface FlowNode {
    id: string;
    type: 'default' | 'input' | 'output' | 'decision';
    data: { label: string };
    position: { x: number; y: number };
}

export interface FlowEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
}

export interface FlowGraph {
    nodes: FlowNode[];
    edges: FlowEdge[];
}

export class FlowGenerator {
    public generate(rootNode: any): FlowGraph {
        const nodes: FlowNode[] = [];
        const edges: FlowEdge[] = [];
        let nodeIdCounter = 0;

        const createNode = (label: string, type: FlowNode['type'], x: number, y: number): string => {
            const id = `node-${nodeIdCounter++}`;
            nodes.push({ id, type, data: { label }, position: { x, y } });
            return id;
        };

        const createEdge = (source: string, target: string, label?: string) => {
            edges.push({ id: `e${source}-${target}`, source, target, label });
        };

        const traverse = (node: any, parentId?: string, depth = 0): string | undefined => {
            let currentId = parentId;

            if (node.type === 'function_definition') {
                const nameNode = node.childForFieldName('declarator')?.childForFieldName('declarator');
                if (nameNode) {
                    currentId = createNode(`Function: ${nameNode.text}`, 'input', 250, depth * 100);
                    if (parentId) createEdge(parentId, currentId);
                }
            } else if (node.type === 'if_statement') {
                const condition = node.childForFieldName('condition')?.text || 'if';
                const newId = createNode(`If: ${condition}`, 'decision', 250, depth * 100);
                if (currentId) createEdge(currentId, newId);
                currentId = newId;

                // Very basic layout
                const consequence = node.childForFieldName('consequence');
                const alternative = node.childForFieldName('alternative');
                if (consequence) {
                    const trueId = createNode('True', 'default', 150, (depth + 1) * 100);
                    createEdge(currentId, trueId, 'Yes');
                    traverse(consequence, trueId, depth + 2);
                }
                if (alternative) {
                    const falseId = createNode('False', 'default', 350, (depth + 1) * 100);
                    createEdge(currentId, falseId, 'No');
                    traverse(alternative, falseId, depth + 2);
                }
                return currentId; // Stop deeper default traversal for 'if' to keep graph clean
            } else if (node.type === 'for_statement') {
                const initNode = node.childForFieldName('initializer');
                const condNode = node.childForFieldName('condition');
                const updateNode = node.childForFieldName('update');
                const loopLabel = `For: ${initNode?.text || ''} ${condNode?.text || ''} ${updateNode?.text || ''}`.trim();

                const loopId = createNode(loopLabel, 'decision', 250, depth * 100);
                if (currentId) createEdge(currentId, loopId);

                const bodyNode = node.childForFieldName('body');
                if (bodyNode) {
                    const bodyStartId = createNode('Loop Body', 'default', 150, (depth + 1) * 100);
                    createEdge(loopId, bodyStartId, 'Enter');
                    traverse(bodyNode, bodyStartId, depth + 2);
                }

                return loopId;
            } else if (node.type === 'while_statement') {
                const condNode = node.childForFieldName('condition');
                const loopLabel = `While: ${condNode?.text || ''}`.trim();

                const loopId = createNode(loopLabel, 'decision', 250, depth * 100);
                if (currentId) createEdge(currentId, loopId);

                const bodyNode = node.childForFieldName('body');
                if (bodyNode) {
                    const bodyStartId = createNode('Loop Body', 'default', 150, (depth + 1) * 100);
                    createEdge(loopId, bodyStartId, 'Enter');
                    traverse(bodyNode, bodyStartId, depth + 2);
                }

                return loopId;
            } else if (node.type === 'call_expression') {
                const funcNode = node.childForFieldName('function');
                if (funcNode) {
                    const callId = createNode(`Call: ${funcNode.text}`, 'default', 250, depth * 100);
                    if (currentId) createEdge(currentId, callId);
                    currentId = callId;
                }
            }

            for (let i = 0; i < node.childCount; i++) {
                const child = node.child(i);
                if (child) {
                    const newCurrent = traverse(child, currentId, depth + 1);
                    if (newCurrent) currentId = newCurrent;
                }
            }

            return currentId;
        };

        traverse(rootNode, undefined, 0);

        // Provide default empty state if nothing found
        if (nodes.length === 0) {
            createNode('Start coding to view flow', 'input', 250, 50);
        }

        return { nodes, edges };
    }
}

export const flowGenerator = new FlowGenerator();
