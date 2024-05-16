import type { AstroConfig, AstroIntegration, AstroIntegrationLogger } from "astro";
import { STORAGE_CODE_FILE, STORAGE_TYPES_FILE } from "./consts.js";
import { codegen } from "./codegen.js";
import { readFile, writeFile } from "node:fs/promises";
import { bold } from "kleur/colors";
import path from "node:path";
import { fileURLToPath } from "url";
import { normalizePath } from "vite";
import { existsSync } from "node:fs";

const VIRTUAL_MODULE_ID = 'astro:storage';
const RESOLVED_MODULE_ID = '\0' + 'astro:storage';

type VitePlugin = Required<AstroConfig['vite']>['plugins'][number];

function vitePluginStorage({ root }: { root: URL }): VitePlugin {
	const dotAstroDir = new URL('.astro/', root);

	return {
		name: 'astro:storage',
		async resolveId(id) {
			if (id !== VIRTUAL_MODULE_ID) return;
			return RESOLVED_MODULE_ID;
		},
		async load(id) {
			if (id !== RESOLVED_MODULE_ID) return;

			return `
				import { images, all } from '${new URL(STORAGE_CODE_FILE, dotAstroDir)}';

				export function getFile(name) {
					return all[name];
				}

				export function getStudioImage(name) {
					return images[name].id;
				}
			`
		}
	}
}

export function storageIntegration(): AstroIntegration {
return {
	name: "astro:studio",
	hooks: {
		'astro:config:setup': async ({ config, updateConfig, logger }) => {
			updateConfig({
				vite: {
					plugins: [vitePluginStorage({ root: config.root }), vitePluginInjectEnvTs({ srcDir: config.srcDir, root: config.root }, logger)]
				}
			})
		},
		'astro:config:done': async ({ config }) => {
			await codegen({ root: config.root });
		}
	}
}
}

export function vitePluginInjectEnvTs(
	{ srcDir, root }: { srcDir: URL; root: URL },
	logger: AstroIntegrationLogger
): VitePlugin {
	return {
		name: 'storage-inject-env-ts',
		enforce: 'post',
		async config() {
			await setUpEnvTs({ srcDir, root, logger });
		},
	};
}

export async function setUpEnvTs({
	srcDir,
	root,
	logger,
}: {
	srcDir: URL;
	root: URL;
	logger: AstroIntegrationLogger;
}) {
	const envTsPath = getEnvTsPath({ srcDir });
	const envTsPathRelativetoRoot = normalizePath(
		path.relative(fileURLToPath(root), fileURLToPath(envTsPath))
	);

	if (existsSync(envTsPath)) {
		let typesEnvContents = await readFile(envTsPath, 'utf-8');
		const dotAstroDir = new URL('.astro/', root);

		if (!existsSync(dotAstroDir)) return;

		const dbTypeReference = getStorageTypeReference({ srcDir, dotAstroDir });

		if (!typesEnvContents.includes(dbTypeReference)) {
			typesEnvContents = `${dbTypeReference}\n${typesEnvContents}`;
			await writeFile(envTsPath, typesEnvContents, 'utf-8');
			logger.info(`Added ${bold(envTsPathRelativetoRoot)} types`);
		}
	}
}

function getStorageTypeReference({ srcDir, dotAstroDir }: { srcDir: URL; dotAstroDir: URL }) {
	const storageTypesFile = new URL(STORAGE_TYPES_FILE, dotAstroDir);
	const storageTypesRelativeToSrcDir = normalizePath(
		path.relative(fileURLToPath(srcDir), fileURLToPath(storageTypesFile))
	);

	return `/// <reference path=${JSON.stringify(storageTypesRelativeToSrcDir)} />`;
}

function getEnvTsPath({ srcDir }: { srcDir: URL }) {
	return new URL('env.d.ts', srcDir);
}
