import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroConfig } from 'astro';
import { bold, cyan } from 'kleur/colors';
import { normalizePath } from 'vite';
import { DOT_ASTRO_DIR, DB_TYPES_FILE } from './consts.js';
import type { VitePlugin } from './utils.js';

export function getEnvTsPath({ srcDir }: { srcDir: URL }) {
	return new URL('env.d.ts', srcDir);
}

export function vitePluginInjectEnvTs({ config }: { config: AstroConfig }): VitePlugin {
	return {
		name: 'db-inject-env-ts',
		// Use `post` to ensure project setup is complete
		// Ex. `.astro` types have been written
		enforce: 'post',
		async config() {
			await setUpEnvTs({ config });
		},
	};
}

export async function setUpEnvTs({ config }: { config: AstroConfig }) {
	const envTsPath = getEnvTsPath(config);
	const envTsPathRelativetoRoot = normalizePath(
		path.relative(fileURLToPath(config.root), fileURLToPath(envTsPath)),
	);

	if (existsSync(envTsPath)) {
		let typesEnvContents = await readFile(envTsPath, 'utf-8');

		if (!existsSync(DOT_ASTRO_DIR)) return;

		const dbTypeReference = getDBTypeReference(config);

		if (!typesEnvContents.includes(dbTypeReference)) {
			typesEnvContents = `${dbTypeReference}\n${typesEnvContents}`;
			await writeFile(envTsPath, typesEnvContents, 'utf-8');
			console.info(`${cyan(bold('[astro:db]'))} Added ${bold(envTsPathRelativetoRoot)} types`);
		}
	}
}

function getDBTypeReference({ srcDir }: { srcDir: URL }) {
	const contentTypesRelativeToSrcDir = normalizePath(
		path.relative(fileURLToPath(srcDir), fileURLToPath(DB_TYPES_FILE)),
	);

	return `/// <reference path=${JSON.stringify(contentTypesRelativeToSrcDir)} />`;
}
