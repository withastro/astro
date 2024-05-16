import type fsMod from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bold } from 'kleur/colors';
import { type Plugin, normalizePath } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import { ACTIONS_TYPES_FILE } from '../actions/consts.js';
import { CONTENT_TYPES_FILE } from '../content/consts.js';
import { getContentPaths } from '../content/index.js';
import { type Logger } from '../core/logger/core.js';

export function getEnvTsPath({ srcDir }: { srcDir: URL }) {
	return new URL('env.d.ts', srcDir);
}

export function astroInjectEnvTsPlugin({
	settings,
	logger,
	fs,
}: {
	settings: AstroSettings;
	logger: Logger;
	fs: typeof fsMod;
}): Plugin {
	return {
		name: 'astro-inject-env-ts',
		// Use `post` to ensure project setup is complete
		// Ex. `.astro` types have been written
		enforce: 'post',
		async config() {
			await setUpEnvTs({ settings, logger, fs });
		},
	};
}

export async function setUpEnvTs({
	settings,
	logger,
	fs,
}: {
	settings: AstroSettings;
	logger: Logger;
	fs: typeof fsMod;
}) {
	const envTsPath = getEnvTsPath(settings.config);
	const dotAstroDir = getContentPaths(settings.config).cacheDir;
	const dotAstroTypeReferences = getDotAstroTypeReferences({
		root: settings.config.root,
		srcDir: settings.config.srcDir,
		fs,
	});
	const envTsPathRelativeToRoot = normalizePath(
		path.relative(fileURLToPath(settings.config.root), fileURLToPath(envTsPath))
	);

	if (fs.existsSync(envTsPath)) {
		let typesEnvContents = await fs.promises.readFile(envTsPath, 'utf-8');

		let addedTypes = false;
		for (const typeReference of dotAstroTypeReferences) {
			if (typesEnvContents.includes(typeReference)) continue;
			typesEnvContents = `${typeReference}\n${typesEnvContents}`;
			await fs.promises.writeFile(envTsPath, typesEnvContents, 'utf-8');
			addedTypes = true;
		}
		if (addedTypes) {
			logger.info('types', `Added ${bold(envTsPathRelativeToRoot)} type declarations`);
		}
	} else {
		// Otherwise, inject the `env.d.ts` file
		let referenceDefs: string[] = [];
		referenceDefs.push('/// <reference types="astro/client" />');

		if (fs.existsSync(dotAstroDir)) {
			referenceDefs.push(...dotAstroTypeReferences);
		}

		await fs.promises.mkdir(settings.config.srcDir, { recursive: true });
		await fs.promises.writeFile(envTsPath, referenceDefs.join('\n'), 'utf-8');
		logger.info('types', `Added ${bold(envTsPathRelativeToRoot)} type declarations`);
	}
}

function getDotAstroTypeReferences({
	fs,
	root,
	srcDir,
}: {
	fs: typeof fsMod;
	root: URL;
	srcDir: URL;
}) {
	const { cacheDir } = getContentPaths({ root, srcDir });
	let referenceDefs: string[] = [];
	const typesFiles = [CONTENT_TYPES_FILE, ACTIONS_TYPES_FILE];
	for (const typesFile of typesFiles) {
		const url = new URL(typesFile, cacheDir);
		if (!fs.existsSync(url)) continue;
		const typesRelativeToSrcDir = normalizePath(
			path.relative(fileURLToPath(srcDir), fileURLToPath(url))
		);
		referenceDefs.push(`/// <reference path=${JSON.stringify(typesRelativeToSrcDir)} />`);
	}

	return referenceDefs;
}
