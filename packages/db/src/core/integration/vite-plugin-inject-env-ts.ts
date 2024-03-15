import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegrationLogger } from 'astro';
import { bold, cyan } from 'kleur/colors';
import { normalizePath } from 'vite';
import { DB_TYPES_FILE } from '../consts.js';
import type { VitePlugin } from '../utils.js';

export function vitePluginInjectEnvTs(
	{ srcDir, root }: { srcDir: URL; root: URL },
	logger: AstroIntegrationLogger
): VitePlugin {
	return {
		name: 'db-inject-env-ts',
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

		const dbTypeReference = getDBTypeReference({ srcDir, dotAstroDir });

		if (!typesEnvContents.includes(dbTypeReference)) {
			typesEnvContents = `${dbTypeReference}\n${typesEnvContents}`;
			await writeFile(envTsPath, typesEnvContents, 'utf-8');
			logger.info(`Added ${bold(envTsPathRelativetoRoot)} types`);
		}
	}
}

function getDBTypeReference({ srcDir, dotAstroDir }: { srcDir: URL; dotAstroDir: URL }) {
	const dbTypesFile = new URL(DB_TYPES_FILE, dotAstroDir);
	const contentTypesRelativeToSrcDir = normalizePath(
		path.relative(fileURLToPath(srcDir), fileURLToPath(dbTypesFile))
	);

	return `/// <reference path=${JSON.stringify(contentTypesRelativeToSrcDir)} />`;
}

function getEnvTsPath({ srcDir }: { srcDir: URL }) {
	return new URL('env.d.ts', srcDir);
}
