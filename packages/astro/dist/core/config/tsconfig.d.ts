import type { CompilerOptions, TypeAcquisition } from 'typescript';
export declare const defaultTSConfig: TSConfig;
export type frameworkWithTSSettings = 'vue' | 'react' | 'preact' | 'solid-js';
export declare const presets: Map<frameworkWithTSSettings, TSConfig>;
export interface TSConfigLoadedResult {
	error?: undefined;
	/** Absolute path of the root tsconfig/jsconfig file that was loaded. */
	tsconfigFile: string;
	/** The merged/resolved config (after `extends` are walked). */
	tsconfig: TSConfig;
	/** The user-written, un-merged config. Used by `astro add` to round-trip. */
	rawConfig: TSConfig;
	/**
	 * Every tsconfig file that contributed via `extends`, root-first.
	 * Includes `tsconfigFile`. Used to populate the dev-server watch list.
	 */
	sources: string[];
}
export type TSConfigResult =
	| TSConfigLoadedResult
	| {
			error: 'invalid-config';
			message: string;
	  }
	| {
			error: 'missing-config';
	  };
/**
 * Load a tsconfig.json or jsconfig.json if the former is not found.
 * @param root The directory to search in, defaults to `process.cwd()`.
 */
export declare function loadTSConfig(root: string | undefined): Promise<TSConfigResult>;
export declare function updateTSConfigForFramework(
	target: TSConfig,
	framework: frameworkWithTSSettings,
): TSConfig;
type StripEnums<T extends Record<string, any>> = {
	[K in keyof T]: T[K] extends boolean
		? T[K]
		: T[K] extends string
			? T[K]
			: T[K] extends object
				? T[K]
				: T[K] extends Array<any>
					? T[K]
					: T[K] extends undefined
						? undefined
						: any;
};
export interface TSConfig {
	compilerOptions?: StripEnums<CompilerOptions>;
	compileOnSave?: boolean;
	extends?: string | string[];
	files?: string[];
	include?: string[];
	exclude?: string[];
	typeAcquisition?: TypeAcquisition;
}
export {};
