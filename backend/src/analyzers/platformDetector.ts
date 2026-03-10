

export type Platform = 'Arduino' | 'STM32' | 'ESP32' | 'Unknown';

export class PlatformDetector {
    public detect(rootNode: any): Platform {
        let platform: Platform = 'Unknown';

        const traverse = (node: any) => {
            if (platform !== 'Unknown') return; // Short circuit if found

            // Look for #include directives
            if (node.type === 'preproc_include') {
                const pathNode = node.childForFieldName('path');
                if (pathNode) {
                    const text = pathNode.text;
                    if (text.includes('Arduino.h')) {
                        platform = 'Arduino';
                        return;
                    } else if (text.includes('stm32') || text.includes('stm32f4xx_hal.h')) {
                        platform = 'STM32';
                        return;
                    } else if (
                        text.includes('esp_') ||
                        text.includes('freertos/FreeRTOS.h') ||
                        text.includes('esp_system.h') ||
                        text.includes('driver/gpio.h') ||
                        text.includes('driver/uart.h')
                    ) {
                        platform = 'ESP32';
                        return;
                    }
                }
            }

            for (let i = 0; i < node.childCount; i++) {
                const child = node.child(i);
                if (child) traverse(child);
            }
        };

        traverse(rootNode);
        return platform;
    }
}

export const platformDetector = new PlatformDetector();
