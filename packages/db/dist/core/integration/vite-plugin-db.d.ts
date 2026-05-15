import type { AstroConfig, AstroIntegrationLogger } from 'astro';
import type { DBTables } from '../types.js';
import { type VitePlugin } from '../utils.js';
export type LateTables = {
	get: () => DBTables;
};
export type LateSeedFiles = {
	get: () => Array<string | URL>;
};
export type SeedHandler = {
	inProgress: boolean;
	execute: (fileUrl: URL) => Promise<void>;
};
type VitePluginDBParams =
	| {
			connectToRemote: false;
			tables: LateTables;
			seedFiles: LateSeedFiles;
			srcDir: URL;
			root: URL;
			logger?: AstroIntegrationLogger;
			output: AstroConfig['output'];
			seedHandler: SeedHandler;
	  }
	| {
			connectToRemote: true;
			tables: LateTables;
			appToken: string;
			srcDir: URL;
			root: URL;
			output: AstroConfig['output'];
			seedHandler: SeedHandler;
	  };
export declare function vitePluginDb(params: VitePluginDBParams): VitePlugin;
export declare function getConfigVirtualModContents(): string;
export declare function getLocalVirtualModContents({
	tables,
	root,
	localExecution,
}: {
	tables: DBTables;
	root: URL;
	/**
	 * Used for the execute command to import the client directly.
	 * In other cases, we use the runtime only vite virtual module.
	 *
	 * This is used to ensure that the client is imported correctly
	 * when executing commands like `astro db execute`.
	 */
	localExecution: boolean;
}): string;
export declare function getRemoteVirtualModContents({
	tables,
	appToken,
	isBuild,
	output,
	localExecution,
}: {
	tables: DBTables;
	appToken: string;
	isBuild: boolean;
	output: AstroConfig['output'];
	/**
	 * Used for the execute command to import the client directly.
	 * In other cases, we use the runtime only vite virtual module.
	 *
	 * This is used to ensure that the client is imported correctly
	 * when executing commands like `astro db execute`.
	 */
	localExecution: boolean;
}): string;
export {};
