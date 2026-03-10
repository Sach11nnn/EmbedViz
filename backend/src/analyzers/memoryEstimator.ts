
import { Platform } from './platformDetector';

export interface MemoryEstimate {
    totalBytes: number;
    breakdown: Record<string, number>;
}

export class MemoryEstimator {
    private sizeMap: Record<Platform, Record<string, number>> = {
        Arduino: { 'int': 2, 'float': 4, 'double': 4, 'char': 1, 'long': 4, 'short': 2 },
        STM32: { 'int': 4, 'float': 4, 'double': 8, 'char': 1, 'long': 4, 'short': 2 },
        ESP32: { 'int': 4, 'float': 4, 'double': 8, 'char': 1, 'long': 4, 'short': 2 },
        Unknown: { 'int': 4, 'float': 4, 'double': 8, 'char': 1, 'long': 4, 'short': 2 },
    };

    public estimate(rootNode: any, platform: Platform): MemoryEstimate {
        const estimate: MemoryEstimate = { totalBytes: 0, breakdown: {} };
        const sizes = this.sizeMap[platform];

        const traverse = (node: any) => {
            // Very basic static sizing based on variable declarations
            if (node.type === 'declaration') {
                const typeNode = node.childForFieldName('type');
                const declaratorNode = node.childForFieldName('declarator');

                if (typeNode && declaratorNode) {
                    const typeName = typeNode.text;
                    const varName = declaratorNode.type === 'identifier' ? declaratorNode.text : declaratorNode.childForFieldName('declarator')?.text || 'unknown';

                    const bytes = sizes[typeName] || 0;
                    if (bytes > 0) {
                        estimate.totalBytes += bytes;
                        estimate.breakdown[typeName] = (estimate.breakdown[typeName] || 0) + bytes;
                    }
                }
            }

            for (let i = 0; i < node.childCount; i++) {
                const child = node.child(i);
                if (child) traverse(child);
            }
        };

        traverse(rootNode);
        return estimate;
    }
}

export const memoryEstimator = new MemoryEstimator();
