import { readFileSync, existsSync } from 'node:fs';
import { join, normalize } from 'node:path';
import { readTsconfig, type TsconfigResult } from 'get-tsconfig';
import { parse as parseJsonc, type ParseError } from 'jsonc-parser';
import type { CompilerOptions, TypeAcquisition } from 'typescript';

export const defaultTSConfig: TSConfig = { extends: 'astro/tsconfigs/base' };

export type frameworkWithTSSettings = 'vue' | 'react' | 'preact' | 'solid-js';
// The following presets unfortunately cannot be inside the specific integrations, as we need
// them even in cases where the integrations are not installed
export const presets = new Map<frameworkWithTSSettings, TSConfig>([
	[
		'vue', // Settings needed for template intellisense when using Volar
		{
			compilerOptions: {
				jsx: 'preserve',
			},
		},
	],
	[
		'react', // Default TypeScript settings, but we need to redefine them in case the users changed them previously
		{
			compilerOptions: {
				jsx: 'react-jsx',
				jsxImportSource: 'react',
			},
		},
	],
	[
		'preact', // https://preactjs.com/guide/v10/typescript/#typescript-configuration
		{
			compilerOptions: {
				jsx: 'react-jsx',
				jsxImportSource: 'preact',
			},
		},
	],
	[
		'solid-js', // https://www.solidjs.com/guides/typescript#configuring-typescript
		{
			compilerOptions: {
				jsx: 'preserve',
				jsxImportSource: 'solid-js',
			},
		},
	],
]);

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
	| { error: 'invalid-config'; message: string }
	| { error: 'missing-config' };

/**
 * Load a tsconfig.json or jsconfig.json if the former is not found.
 * @param root The directory to search in, defaults to `process.cwd()`.
 */
export async function loadTSConfig(root: string | undefined): Promise<TSConfigResult> {
	const safeCwd = root || process.cwd();
	let tsconfigPath: string | undefined;

	// Find the json file path. Prefer tsconfig.json over jsconfig.json.
	for (const configName of ['tsconfig.json', 'jsconfig.json']) {
		const possiblePath = join(safeCwd, configName);
		if (existsSync(possiblePath)) {
			tsconfigPath = possiblePath;
			break;
		}
	}
	if (!tsconfigPath) {
		return {
			error: 'missing-config',
		};
	}

	// Read the raw json file
	let rawConfig: TSConfig | undefined;
	try {
		const text = readFileSync(tsconfigPath, 'utf-8');
		const errors: ParseError[] = [];
		const parsed = parseJsonc(text, errors, { allowTrailingComma: true }) as TSConfig;
		if (errors.length > 0) {
			const first = errors[0];
			return {
				error: 'invalid-config',
				message: `Failed to parse ${tsconfigPath}: Malformed JSONC (error code ${first.error}) at offset ${first.offset}`,
			};
		}
		rawConfig = parsed;
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		return {
			error: 'invalid-config',
			message: `Failed to parse ${tsconfigPath}: ${message}`,
		};
	}
	if (!rawConfig) {
		return {
			error: 'invalid-config',
			message: `Failed to parse ${tsconfigPath}: Unknown error`,
		};
	}

	// Resolve the tsconfig via `extends`
	let resolved: TsconfigResult | undefined;
	try {
		resolved = readTsconfig(tsconfigPath);
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		return {
			error: 'invalid-config',
			message: `Failed to resolve ${tsconfigPath}: ${message}`,
		};
	}

	return {
		tsconfigFile: normalize(resolved.path),
		tsconfig: resolved.config satisfies TSConfig,
		rawConfig,
		sources: (resolved.sources || [resolved.path]).map(normalize),
	};
}

export function updateTSConfigForFramework(
	target: TSConfig,
	framework: frameworkWithTSSettings,
): TSConfig {
	if (!presets.has(framework)) {
		return target;
	}

	return deepMergeObjects(target, presets.get(framework)!);
}

// Simple deep merge implementation that merges objects and strings
function deepMergeObjects<T extends Record<string, any>>(a: T, b: T): T {
	const merged: T = { ...a };

	for (const key in b) {
		const value = b[key];

		if (a[key] == null) {
			merged[key] = value;
			continue;
		}

		if (typeof a[key] === 'object' && typeof value === 'object') {
			merged[key] = deepMergeObjects(a[key], value);
			continue;
		}

		merged[key] = value;
	}

	return merged;
}

// The code below is adapted from `pkg-types`
// `pkg-types` offer more types and utilities, but since we only want the TSConfig type, we'd rather avoid adding a dependency.
// https://github.com/unjs/pkg-types/blob/78328837d369d0145a8ddb35d7fe1fadda4bfadf/src/types/tsconfig.ts
// See https://github.com/unjs/pkg-types/blob/78328837d369d0145a8ddb35d7fe1fadda4bfadf/LICENSE for license information

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
