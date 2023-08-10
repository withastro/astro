import type { Arguments as Flags } from 'yargs-parser';
import type {
	AstroConfig,
	AstroInlineConfig,
	AstroInlineOnlyConfig,
	AstroUserConfig,
	CLIFlags,
} from '../../@types/astro';

import * as colors from 'kleur/colors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ZodError } from 'zod';
import { eventConfigError, telemetry } from '../../events/index.js';
import { trackAstroConfigZodError } from '../errors/errors.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { formatConfigErrorMessage } from '../messages.js';
import { mergeConfig } from './merge.js';
import { createRelativeSchema } from './schema.js';
import { loadConfigWithVite } from './vite-load.js';

const LEGACY_ASTRO_CONFIG_KEYS = new Set([
	'projectRoot',
	'src',
	'pages',
	'public',
	'dist',
	'styleOptions',
	'markdownOptions',
	'buildOptions',
	'devOptions',
]);

/** Turn raw config values into normalized values */
export async function validateConfig(
	userConfig: any,
	root: string,
	cmd: string
): Promise<AstroConfig> {
	// Manual deprecation checks
	/* eslint-disable no-console */
	if (userConfig.hasOwnProperty('renderers')) {
		console.error('Astro "renderers" are now "integrations"!');
		console.error('Update your configuration and install new dependencies:');
		try {
			const rendererKeywords = userConfig.renderers.map((r: string) =>
				r.replace('@astrojs/renderer-', '')
			);
			const rendererImports = rendererKeywords
				.map((r: string) => `  import ${r} from '@astrojs/${r === 'solid' ? 'solid-js' : r}';`)
				.join('\n');
			const rendererIntegrations = rendererKeywords.map((r: string) => `    ${r}(),`).join('\n');
			console.error('');
			console.error(colors.dim('  // astro.config.js'));
			if (rendererImports.length > 0) {
				console.error(colors.green(rendererImports));
			}
			console.error('');
			console.error(colors.dim('  // ...'));
			if (rendererIntegrations.length > 0) {
				console.error(colors.green('  integrations: ['));
				console.error(colors.green(rendererIntegrations));
				console.error(colors.green('  ],'));
			} else {
				console.error(colors.green('  integrations: [],'));
			}
			console.error('');
		} catch (err) {
			// We tried, better to just exit.
		}
		process.exit(1);
	}

	let legacyConfigKey: string | undefined;
	for (const key of Object.keys(userConfig)) {
		if (LEGACY_ASTRO_CONFIG_KEYS.has(key)) {
			legacyConfigKey = key;
			break;
		}
	}
	if (legacyConfigKey) {
		throw new AstroError({
			...AstroErrorData.ConfigLegacyKey,
			message: AstroErrorData.ConfigLegacyKey.message(legacyConfigKey),
		});
	}
	/* eslint-enable no-console */

	const AstroConfigRelativeSchema = createRelativeSchema(cmd, root);

	// First-Pass Validation
	let result: AstroConfig;
	try {
		result = await AstroConfigRelativeSchema.parseAsync(userConfig);
	} catch (e) {
		// Improve config zod error messages
		if (e instanceof ZodError) {
			// Mark this error so the callee can decide to suppress Zod's error if needed.
			// We still want to throw the error to signal an error in validation.
			trackAstroConfigZodError(e);
			// eslint-disable-next-line no-console
			console.error(formatConfigErrorMessage(e) + '\n');
			telemetry.record(eventConfigError({ cmd, err: e, isFatal: true }));
		}
		throw e;
	}

	// If successful, return the result as a verified AstroConfig object.
	return result;
}

/** Convert the generic "yargs" flag object into our own, custom TypeScript object. */
// NOTE: This function will be removed in a later PR. Use `flagsToAstroInlineConfig` instead.
// All CLI related flow should be located in the `packages/astro/src/cli` directory.
export function resolveFlags(flags: Partial<Flags>): CLIFlags {
	return {
		root: typeof flags.root === 'string' ? flags.root : undefined,
		site: typeof flags.site === 'string' ? flags.site : undefined,
		base: typeof flags.base === 'string' ? flags.base : undefined,
		port: typeof flags.port === 'number' ? flags.port : undefined,
		open: typeof flags.open === 'boolean' ? flags.open : undefined,
		config: typeof flags.config === 'string' ? flags.config : undefined,
		host:
			typeof flags.host === 'string' || typeof flags.host === 'boolean' ? flags.host : undefined,
		drafts: typeof flags.drafts === 'boolean' ? flags.drafts : undefined,
		experimentalAssets:
			typeof flags.experimentalAssets === 'boolean' ? flags.experimentalAssets : undefined,
	};
}

export function resolveRoot(cwd?: string | URL): string {
	if (cwd instanceof URL) {
		cwd = fileURLToPath(cwd);
	}
	return cwd ? path.resolve(cwd) : process.cwd();
}

async function search(fsMod: typeof fs, root: string) {
	const paths = [
		'astro.config.mjs',
		'astro.config.js',
		'astro.config.ts',
		'astro.config.mts',
		'astro.config.cjs',
		'astro.config.cts',
	].map((p) => path.join(root, p));

	for (const file of paths) {
		if (fsMod.existsSync(file)) {
			return file;
		}
	}
}

interface ResolveConfigPathOptions {
	root: string;
	configFile?: string;
	fs: typeof fs;
}

/**
 * Resolve the file URL of the user's `astro.config.js|cjs|mjs|ts` file
 */
export async function resolveConfigPath(
	options: ResolveConfigPathOptions
): Promise<string | undefined> {
	let userConfigPath: string | undefined;
	if (options.configFile) {
		userConfigPath = path.join(options.root, options.configFile);
		if (!options.fs.existsSync(userConfigPath)) {
			throw new AstroError({
				...AstroErrorData.ConfigNotFound,
				message: AstroErrorData.ConfigNotFound.message(options.configFile),
			});
		}
	} else {
		userConfigPath = await search(options.fs, options.root);
	}

	return userConfigPath;
}

async function loadConfig(
	root: string,
	configFile?: string | false,
	fsMod = fs
): Promise<Record<string, any>> {
	if (configFile === false) return {};

	const configPath = await resolveConfigPath({
		root,
		configFile,
		fs: fsMod,
	});
	if (!configPath) return {};

	// Create a vite server to load the config
	try {
		return await loadConfigWithVite({
			root,
			configPath,
			fs: fsMod,
		});
	} catch (e) {
		const configPathText = configFile ? colors.bold(configFile) : 'your Astro config';
		// Config errors should bypass log level as it breaks startup
		// eslint-disable-next-line no-console
		console.error(`${colors.bold(colors.red('[astro]'))} Unable to load ${configPathText}\n`);
		throw e;
	}
}

/**
 * `AstroInlineConfig` is a union of `AstroUserConfig` and `AstroInlineOnlyConfig`.
 * This functions splits it up.
 */
function splitInlineConfig(inlineConfig: AstroInlineConfig): {
	inlineUserConfig: AstroUserConfig;
	inlineOnlyConfig: AstroInlineOnlyConfig;
} {
	const { configFile, mode, logLevel, ...inlineUserConfig } = inlineConfig;
	return {
		inlineUserConfig,
		inlineOnlyConfig: {
			configFile,
			mode,
			logLevel,
		},
	};
}

interface ResolveConfigResult {
	userConfig: AstroUserConfig;
	astroConfig: AstroConfig;
}

/**
 * Resolves the Astro config with a given inline config.
 *
 * @param inlineConfig An inline config that takes highest priority when merging and resolving the final config.
 * @param command The running command that uses this config. Usually 'dev' or 'build'.
 */
export async function resolveConfig(
	inlineConfig: AstroInlineConfig,
	command: string,
	fsMod = fs
): Promise<ResolveConfigResult> {
	const root = resolveRoot(inlineConfig.root);
	const { inlineUserConfig, inlineOnlyConfig } = splitInlineConfig(inlineConfig);

	// If the root is specified, assign the resolved path so it takes the highest priority
	if (inlineConfig.root) {
		inlineUserConfig.root = root;
	}

	const userConfig = await loadConfig(root, inlineOnlyConfig.configFile, fsMod);
	const mergedConfig = mergeConfig(userConfig, inlineUserConfig);
	const astroConfig = await validateConfig(mergedConfig, root, command);

	return { userConfig, astroConfig };
}
