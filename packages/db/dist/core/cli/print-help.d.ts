/**
 * Uses implementation from Astro core
 * @see https://github.com/withastro/astro/blob/main/packages/astro/src/core/messages.ts#L303
 */
export declare function printHelp({
	commandName,
	headline,
	usage,
	tables,
	description,
}: {
	commandName: string;
	headline?: string;
	usage?: string;
	tables?: Record<string, [command: string, help: string][]>;
	description?: string;
}): void;
