import type { Prompt } from '../definitions.js';
export declare class ClackPrompt implements Prompt {
	#private;
	constructor({ force }: { force: boolean });
	confirm({ message, defaultValue }: { message: string; defaultValue?: boolean }): Promise<boolean>;
}
