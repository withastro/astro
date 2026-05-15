import type { TextStyler } from '../../definitions.js';
import type { DebugInfoFormatter } from '../definitions.js';
import type { DebugInfo } from '../domain/debug-info.js';
export declare class StyledDebugInfoFormatter implements DebugInfoFormatter {
	#private;
	constructor({ textStyler }: { textStyler: TextStyler });
	format(info: DebugInfo): string;
}
