export declare function say(
	messages: string | string[],
	{
		clear,
		hat,
		tie,
	}?: {
		clear?: boolean | undefined;
		hat?: string | undefined;
		tie?: string | undefined;
	},
): Promise<void>;
export declare const title: (text: string) => string;
export declare const getName: () => Promise<string>;
export declare const getVersion: (
	packageManager: string,
	packageName: string,
	packageTag?: string,
	fallback?: string,
) => Promise<string>;
export declare const log: (message: string) => boolean;
export declare const banner: () => void;
export declare const bannerAbort: () => boolean;
export declare const info: (prefix: string, text: string) => Promise<void>;
export declare const error: (prefix: string, text: string) => Promise<void>;
export declare const nextSteps: ({
	projectDir,
	devCmd,
}: {
	projectDir: string;
	devCmd: string;
}) => Promise<void>;
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
