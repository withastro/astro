import { type ComponentSlots } from '../../runtime/server/index.js';
import type { SSRResult } from '../../types/public/internal.js';
import type { AstroLogger } from '../logger/core.js';
export declare class Slots {
	#private;
	constructor(result: SSRResult, slots: ComponentSlots | null, logger: AstroLogger);
	has(name: string): boolean;
	render(name: string, args?: any[]): Promise<any>;
}
