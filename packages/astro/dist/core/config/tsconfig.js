import { readFileSync, existsSync } from 'node:fs';
import { join, normalize } from 'node:path';
import { readTsconfig } from 'get-tsconfig';
import { parse as parseJsonc } from 'jsonc-parser';
const defaultTSConfig = { extends: 'astro/tsconfigs/base' };
const presets = /* @__PURE__ */ new Map([
	[
		'vue',
		// Settings needed for template intellisense when using Volar
		{
			compilerOptions: {
				jsx: 'preserve',
			},
		},
	],
	[
		'react',
		// Default TypeScript settings, but we need to redefine them in case the users changed them previously
		{
			compilerOptions: {
				jsx: 'react-jsx',
				jsxImportSource: 'react',
			},
		},
	],
	[
		'preact',
		// https://preactjs.com/guide/v10/typescript/#typescript-configuration
		{
			compilerOptions: {
				jsx: 'react-jsx',
				jsxImportSource: 'preact',
			},
		},
	],
	[
		'solid-js',
		// https://www.solidjs.com/guides/typescript#configuring-typescript
		{
			compilerOptions: {
				jsx: 'preserve',
				jsxImportSource: 'solid-js',
			},
		},
	],
]);
async function loadTSConfig(root) {
	const safeCwd = root || process.cwd();
	let tsconfigPath;
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
	let rawConfig;
	try {
		const text = readFileSync(tsconfigPath, 'utf-8');
		const errors = [];
		const parsed = parseJsonc(text, errors, { allowTrailingComma: true });
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
	let resolved;
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
		tsconfig: resolved.config,
		rawConfig,
		sources: (resolved.sources || [resolved.path]).map(normalize),
	};
}
function updateTSConfigForFramework(target, framework) {
	if (!presets.has(framework)) {
		return target;
	}
	return deepMergeObjects(target, presets.get(framework));
}
function deepMergeObjects(a, b) {
	const merged = { ...a };
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
export { defaultTSConfig, loadTSConfig, presets, updateTSConfigForFramework };
