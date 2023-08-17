import { existsSync } from 'node:fs';
import { join } from 'node:path';
import * as tsr from 'tsconfig-resolver';

export const defaultTSConfig: tsr.TsConfigJson = { extends: 'astro/tsconfigs/base' };

export type frameworkWithTSSettings = 'vue' | 'react' | 'preact' | 'solid-js';
// The following presets unfortunately cannot be inside the specific integrations, as we need
// them even in cases where the integrations are not installed
export const presets = new Map<frameworkWithTSSettings, tsr.TsConfigJson>([
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

/**
 * Load a tsconfig.json or jsconfig.json is the former is not found
 * @param cwd Directory to start from
 * @param resolve Determine if the function should go up directories like TypeScript would
 */
export function loadTSConfig(cwd: string | undefined, resolve = true): tsr.TsConfigResult {
	cwd = cwd ?? process.cwd();
	let config = tsr.tsconfigResolverSync({
		cwd,
		filePath: resolve ? undefined : cwd,
		ignoreExtends: !resolve,
	});

	// When a direct filepath is provided to `tsconfigResolver`, it'll instead return invalid-config even when
	// the file does not exists. We'll manually handle this so we can provide better errors to users
	if (!resolve && config.reason === 'invalid-config' && !existsSync(join(cwd, 'tsconfig.json'))) {
		config = { reason: 'not-found', path: undefined, exists: false };
	}

	// If we couldn't find a tsconfig.json, try to load a jsconfig.json instead
	if (config.reason === 'not-found') {
		const jsconfig = tsr.tsconfigResolverSync({
			cwd,
			filePath: resolve ? undefined : cwd,
			searchName: 'jsconfig.json',
			ignoreExtends: !resolve,
		});

		if (
			!resolve &&
			jsconfig.reason === 'invalid-config' &&
			!existsSync(join(cwd, 'jsconfig.json'))
		) {
			return { reason: 'not-found', path: undefined, exists: false };
		}

		return jsconfig;
	}

	return config;
}

export function updateTSConfigForFramework(
	target: tsr.TsConfigJson,
	framework: frameworkWithTSSettings
): tsr.TsConfigJson {
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
