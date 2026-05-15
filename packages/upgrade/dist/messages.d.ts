import type { PackageInfo } from './actions/context.js';
export declare function getRegistry(): Promise<string>;
export declare function spinner(args: {
	start: string;
	end: string;
	while: (...args: any) => Promise<any>;
}): Promise<void>;
export declare function pluralize(word: string | [string, string], n: number): string;
export declare const celebrations: string[];
export declare const done: string[];
export declare const bye: string[];
export declare const newline: () => boolean;
export declare const banner: () => Promise<boolean>;
export declare const bannerAbort: () => boolean;
export declare const warn: (prefix: string, text: string) => Promise<void>;
export declare const info: (prefix: string, text: string, version?: string) => Promise<void>;
export declare const upgrade: (packageInfo: PackageInfo, text: string) => Promise<void>;
export declare const title: (text: string) => string;
export declare const success: (prefix: string, text: string) => Promise<void>;
export declare const error: (prefix: string, text: string) => Promise<void>;
export declare const changelog: (name: string, text: string, url: string) => Promise<void>;
export declare function printHelp({
	commandName,
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
