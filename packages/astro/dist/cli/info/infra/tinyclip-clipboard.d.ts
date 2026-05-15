import type { AstroLogger } from '../../../core/logger/core.js';
import type { Clipboard, Prompt } from '../definitions.js';
export declare class TinyclipClipboard implements Clipboard {
	#private;
	constructor({ logger, prompt }: { logger: AstroLogger; prompt: Prompt });
	copy(text: string): Promise<void>;
}
