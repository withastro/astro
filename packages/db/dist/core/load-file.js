import { existsSync } from 'node:fs';
import { unlink, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build as esbuild } from 'esbuild';
import { CONFIG_FILE_NAMES, VIRTUAL_MODULE_ID } from './consts.js';
import { INTEGRATION_TABLE_CONFLICT_ERROR } from './errors.js';
import { errorMap } from './integration/error-map.js';
import { getConfigVirtualModContents } from './integration/vite-plugin-db.js';
import { dbConfigSchema } from './schemas.js';
import './types.js';
import { getAstroEnv, getDbDirectoryUrl } from './utils.js';
async function resolveDbConfig({ root, integrations }) {
	const { mod, dependencies } = await loadUserConfigFile(root);
	const userDbConfig = dbConfigSchema.parse(mod?.default ?? {}, { error: errorMap });
	const dbConfig = { tables: userDbConfig.tables ?? {} };
	const integrationDbConfigPaths = [];
	const integrationSeedPaths = [];
	for (const integration of integrations) {
		const { name, hooks } = integration;
		if (hooks['astro:db:setup']) {
			hooks['astro:db:setup']({
				extendDb({ configEntrypoint, seedEntrypoint }) {
					if (configEntrypoint) {
						integrationDbConfigPaths.push({ name, configEntrypoint });
					}
					if (seedEntrypoint) {
						integrationSeedPaths.push(seedEntrypoint);
					}
				},
			});
		}
	}
	for (const { name, configEntrypoint } of integrationDbConfigPaths) {
		const loadedConfig = await loadIntegrationConfigFile(root, configEntrypoint);
		const integrationDbConfig = dbConfigSchema.parse(loadedConfig.mod?.default ?? {}, {
			error: errorMap,
		});
		for (const key in integrationDbConfig.tables) {
			if (key in dbConfig.tables) {
				const isUserConflict = key in (userDbConfig.tables ?? {});
				throw new Error(INTEGRATION_TABLE_CONFLICT_ERROR(name, key, isUserConflict));
			} else {
				dbConfig.tables[key] = integrationDbConfig.tables[key];
			}
		}
	}
	return {
		/** Resolved `astro:db` config, including tables added by integrations. */
		dbConfig,
		/** Dependencies imported into the user config file. */
		dependencies,
		/** Additional `astro:db` seed file paths provided by integrations. */
		integrationSeedPaths,
	};
}
async function loadUserConfigFile(root) {
	let configFileUrl;
	for (const fileName of CONFIG_FILE_NAMES) {
		const fileUrl = new URL(fileName, getDbDirectoryUrl(root));
		if (existsSync(fileUrl)) {
			configFileUrl = fileUrl;
		}
	}
	return await loadAndBundleDbConfigFile({ root, fileUrl: configFileUrl });
}
function getResolvedFileUrl(root, filePathOrUrl) {
	if (typeof filePathOrUrl === 'string') {
		const { resolve } = createRequire(root);
		const resolvedFilePath = resolve(filePathOrUrl);
		return pathToFileURL(resolvedFilePath);
	}
	return filePathOrUrl;
}
async function loadIntegrationConfigFile(root, filePathOrUrl) {
	const fileUrl = getResolvedFileUrl(root, filePathOrUrl);
	return await loadAndBundleDbConfigFile({ root, fileUrl });
}
async function loadAndBundleDbConfigFile({ root, fileUrl }) {
	if (!fileUrl) {
		return { mod: void 0, dependencies: [] };
	}
	const { code, dependencies } = await bundleFile({
		virtualModContents: getConfigVirtualModContents(),
		root,
		fileUrl,
	});
	return {
		mod: await importBundledFile({ code, root }),
		dependencies,
	};
}
async function bundleFile({ fileUrl, root, virtualModContents }) {
	const { ASTRO_DATABASE_FILE } = getAstroEnv();
	const result = await esbuild({
		absWorkingDir: process.cwd(),
		entryPoints: [fileURLToPath(fileUrl)],
		outfile: 'out.js',
		packages: 'external',
		write: false,
		target: ['node16'],
		platform: 'node',
		bundle: true,
		format: 'esm',
		sourcemap: 'inline',
		metafile: true,
		define: {
			'import.meta.env.ASTRO_DATABASE_FILE': JSON.stringify(ASTRO_DATABASE_FILE ?? ''),
		},
		plugins: [
			{
				name: 'resolve-astro-db',
				setup(build) {
					build.onResolve({ filter: /^astro:db$/ }, ({ path }) => {
						return { path, namespace: VIRTUAL_MODULE_ID };
					});
					build.onLoad({ namespace: VIRTUAL_MODULE_ID, filter: /.*/ }, () => {
						return {
							contents: virtualModContents,
							// Needed to resolve runtime dependencies
							resolveDir: fileURLToPath(root),
						};
					});
				},
			},
		],
	});
	const file = result.outputFiles[0];
	if (!file) {
		throw new Error(`Unexpected: no output file`);
	}
	return {
		code: file.text,
		dependencies: Object.keys(result.metafile.inputs),
	};
}
async function importBundledFile({ code, root }) {
	const tmpFileUrl = new URL(`./db.timestamp-${Date.now()}.mjs`, root);
	await writeFile(tmpFileUrl, code, { encoding: 'utf8' });
	try {
		return await import(
			/* @vite-ignore */
			tmpFileUrl.toString()
		);
	} finally {
		try {
			await unlink(tmpFileUrl);
		} catch {}
	}
}
export { bundleFile, getResolvedFileUrl, importBundledFile, resolveDbConfig };
