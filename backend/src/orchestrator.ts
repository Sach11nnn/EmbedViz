import { CodeParser } from './parser/codeParser';

const parser = new CodeParser();
parser.init();

export function processCode(code: string) {
  try {
    const result = parser.parseCode(code);
    return {
      status: 'success',
      platform: result.platformName,
      hardwareStates: result.pins,
      interfaces: result.interfaces,
      conflicts: result.conflicts,
      timingIssues: result.timingIssues,
      memoryWarnings: result.memoryWarnings,
      suggestions: result.suggestions,
      interrupts: result.interrupts,
      memory: {
        sram: result.memory.sram,
        sramTotal: result.memory.sramTotal,
        flash: result.memory.flash,
        flashTotal: result.memory.flashTotal,
        totalBytes: result.memory.sram,
        breakdown: { 'Global Variables': result.memory.sram, 'Flash Used': result.memory.flash }
      },
      flow: result.flow
    };
  } catch (err) {
    return {
      status: 'error',
      message: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}
