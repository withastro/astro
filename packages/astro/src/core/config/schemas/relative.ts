import type { OutgoingHttpHeaders } from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { z } from 'zod';
import { appendForwardSlash, prependForwardSlash, removeTrailingForwardSlash } from '../../path.js';
import { ASTRO_CONFIG_DEFAULTS, AstroConfigSchema } from './base.js';

function resolveDirAsUrl(dir: string, root: string) {
	let resolvedDir = path.resolve(root, dir);
	if (!resolvedDir.endsWith(path.sep)) {
		resolvedDir += path.sep;
	}
	return pathToFileURL(resolvedDir);
}

export function createRelativeSchema(cmd: string, fileProtocolRoot: string) {
	let originalBuildClient: string;
	let originalBuildServer: string;

	// We need to extend the global schema to add transforms that are relative to root.
	// This is type checked against the global schema to make sure we still match.
	const AstroConfigRelativeSchema = AstroConfigSchema.extend({
		root: z
			.string()
			.default(ASTRO_CONFIG_DEFAULTS.root)
			.transform((val) => resolveDirAsUrl(val, fileProtocolRoot)),
		srcDir: z
			.string()
			.default(ASTRO_CONFIG_DEFAULTS.srcDir)
			.transform((val) => resolveDirAsUrl(val, fileProtocolRoot)),
		compressHTML: z.boolean().optional().default(ASTRO_CONFIG_DEFAULTS.compressHTML),
		publicDir: z
			.string()
			.default(ASTRO_CONFIG_DEFAULTS.publicDir)
			.transform((val) => resolveDirAsUrl(val, fileProtocolRoot)),
		outDir: z
			.string()
			.default(ASTRO_CONFIG_DEFAULTS.outDir)
			.transform((val) => resolveDirAsUrl(val, fileProtocolRoot)),
		cacheDir: z
			.string()
			.default(ASTRO_CONFIG_DEFAULTS.cacheDir)
			.transform((val) => resolveDirAsUrl(val, fileProtocolRoot)),
		build: z
			.object({
				format: z
					.union([z.literal('file'), z.literal('directory'), z.literal('preserve')])
					.optional()
					.default(ASTRO_CONFIG_DEFAULTS.build.format),
				// NOTE: `client` and `server` are transformed relative to the default outDir first,
				// later we'll fix this to be relative to the actual `outDir`
				client: z
					.string()
					.optional()
					.default(ASTRO_CONFIG_DEFAULTS.build.client)
					.transform((val) => {
						originalBuildClient = val;
						return resolveDirAsUrl(
							val,
							path.resolve(fileProtocolRoot, ASTRO_CONFIG_DEFAULTS.outDir),
						);
					}),
				server: z
					.string()
					.optional()
					.default(ASTRO_CONFIG_DEFAULTS.build.server)
					.transform((val) => {
						originalBuildServer = val;
						return resolveDirAsUrl(
							val,
							path.resolve(fileProtocolRoot, ASTRO_CONFIG_DEFAULTS.outDir),
						);
					}),
				assets: z.string().optional().default(ASTRO_CONFIG_DEFAULTS.build.assets),
				assetsPrefix: z
					.string()
					.optional()
					.or(z.object({ fallback: z.string() }).and(z.record(z.string())).optional()),
				serverEntry: z.string().optional().default(ASTRO_CONFIG_DEFAULTS.build.serverEntry),
				redirects: z.boolean().optional().default(ASTRO_CONFIG_DEFAULTS.build.redirects),
				inlineStylesheets: z
					.enum(['always', 'auto', 'never'])
					.optional()
					.default(ASTRO_CONFIG_DEFAULTS.build.inlineStylesheets),
				concurrency: z.number().min(1).optional().default(ASTRO_CONFIG_DEFAULTS.build.concurrency),
			})
			.optional()
			.default({}),
		server: z.preprocess(
			// preprocess
			(val) => {
				if (typeof val === 'function') {
					return val({ command: cmd === 'dev' ? 'dev' : 'preview' });
				}
				return val;
			},
			// validate
			z
				.object({
					open: z
						.union([z.string(), z.boolean()])
						.optional()
						.default(ASTRO_CONFIG_DEFAULTS.server.open),
					host: z
						.union([z.string(), z.boolean()])
						.optional()
						.default(ASTRO_CONFIG_DEFAULTS.server.host),
					port: z.number().optional().default(ASTRO_CONFIG_DEFAULTS.server.port),
					headers: z.custom<OutgoingHttpHeaders>().optional(),
					streaming: z.boolean().optional().default(true),
					allowedHosts: z
						.union([z.array(z.string()), z.literal(true)])
						.optional()
						.default(ASTRO_CONFIG_DEFAULTS.server.allowedHosts),
				})
				.optional()
				.default({}),
		),
	}).transform((config) => {
		// If the user changed `outDir`, we need to also update `build.client` and `build.server`
		// the be based on the correct `outDir`
		if (
			config.outDir.toString() !==
			resolveDirAsUrl(ASTRO_CONFIG_DEFAULTS.outDir, fileProtocolRoot).toString()
		) {
			const outDirPath = fileURLToPath(config.outDir);
			config.build.client = resolveDirAsUrl(originalBuildClient, outDirPath);
			config.build.server = resolveDirAsUrl(originalBuildServer, outDirPath);
		}

		// Handle `base` and `image.endpoint.route` trailing slash based on `trailingSlash` config
		if (config.trailingSlash === 'never') {
			config.base = prependForwardSlash(removeTrailingForwardSlash(config.base));
			config.image.endpoint.route = prependForwardSlash(
				removeTrailingForwardSlash(config.image.endpoint.route),
			);
		} else if (config.trailingSlash === 'always') {
			config.base = prependForwardSlash(appendForwardSlash(config.base));
			config.image.endpoint.route = prependForwardSlash(
				appendForwardSlash(config.image.endpoint.route),
			);
		} else {
			config.base = prependForwardSlash(config.base);
			config.image.endpoint.route = prependForwardSlash(config.image.endpoint.route);
		}

		return config;
	});

	return AstroConfigRelativeSchema;
}
