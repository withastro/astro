import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import colors from 'piccolore';
import { $ZodError } from 'zod/v4/core';
import { eventConfigError, telemetry } from '../../events/index.js';
import { trackAstroConfigZodError } from '../errors/errors.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { formatConfigErrorMessage } from '../messages/runtime.js';
import { mergeConfig } from './merge.js';
import { validateConfig } from './validate.js';
import { loadConfigWithVite } from './vite-load.js';
function resolveRoot(cwd) {
	if (cwd instanceof URL) {
		cwd = fileURLToPath(cwd);
	}
	return cwd ? path.resolve(cwd) : process.cwd();
}
const configPaths = Object.freeze([
	'astro.config.mjs',
	'astro.config.js',
	'astro.config.ts',
	'astro.config.mts',
]);
async function search(fsMod, root) {
	const paths = configPaths.map((p) => path.join(root, p));
	for (const file of paths) {
		if (fsMod.existsSync(file)) {
			return file;
		}
	}
}
async function resolveConfigPath(options) {
	let userConfigPath;
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
async function loadConfig(root, configFile, fsMod = fs) {
	if (configFile === false) return {};
	const configPath = await resolveConfigPath({
		root,
		configFile,
		fs: fsMod,
	});
	if (!configPath) return {};
	try {
		return await loadConfigWithVite({
			root,
			configPath,
			fs: fsMod,
		});
	} catch (e) {
		const configPathText = configFile ? colors.bold(configFile) : 'your Astro config';
		console.error(`${colors.bold(colors.red('[astro]'))} Unable to load ${configPathText}
`);
		throw e;
	}
}
function splitInlineConfig(inlineConfig) {
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
async function resolveConfig(inlineConfig, command, fsMod = fs) {
	const root = resolveRoot(inlineConfig.root);
	const { inlineUserConfig, inlineOnlyConfig } = splitInlineConfig(inlineConfig);
	if (inlineConfig.root) {
		inlineUserConfig.root = root;
	}
	const userConfig = await loadConfig(root, inlineOnlyConfig.configFile, fsMod);
	const mergedConfig = mergeConfig(userConfig, inlineUserConfig);
	let astroConfig;
	try {
		astroConfig = await validateConfig(mergedConfig, root, command);
	} catch (e) {
		if (e instanceof $ZodError) {
			trackAstroConfigZodError(e);
			console.error(formatConfigErrorMessage(e) + '\n');
			telemetry.record(eventConfigError({ cmd: command, err: e, isFatal: true }));
		}
		throw e;
	}
	return { userConfig: mergedConfig, astroConfig };
}
export { resolveConfig, resolveConfigPath, resolveRoot };
