import { bold } from 'kleur/colors';
import type fsMod from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizePath, type Plugin } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import { type Logger } from '../core/logger/core.js';
import { CODEGENDIR_BASE_DTS_FILE } from '../config/types.js';

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

function getDotAstroTypeReference({ codegenDir, srcDir }: { codegenDir: URL; srcDir: URL }) {
	const contentTypesRelativeToSrcDir = normalizePath(
		// TODO: set constant somewhere
		path.relative(
			fileURLToPath(srcDir),
			fileURLToPath(new URL(CODEGENDIR_BASE_DTS_FILE, codegenDir))
		)
	);

	return `/// <reference path=${JSON.stringify(contentTypesRelativeToSrcDir)} />`;
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
	const dotAstroTypeReference = getDotAstroTypeReference({
		srcDir: settings.config.srcDir,
		codegenDir: settings.codegenDir,
	});
	const envTsPathRelativetoRoot = normalizePath(
		path.relative(fileURLToPath(settings.config.root), fileURLToPath(envTsPath))
	);

	if (fs.existsSync(envTsPath)) {
		let typesEnvContents = await fs.promises.readFile(envTsPath, 'utf-8');

		if (!fs.existsSync(settings.codegenDir))
			// Add `.astro` types reference if none exists
			return;

		if (!typesEnvContents.includes(dotAstroTypeReference)) {
			typesEnvContents = `${dotAstroTypeReference}\n${typesEnvContents}`;
			await fs.promises.writeFile(envTsPath, typesEnvContents, 'utf-8');
			logger.info('types', `Added ${bold(envTsPathRelativetoRoot)} type declarations`);
		}
	} else {
		// Otherwise, inject the `env.d.ts` file
		let referenceDefs: string[] = [];
		referenceDefs.push('/// <reference types="astro/client" />');

		if (fs.existsSync(settings.codegenDir)) {
			referenceDefs.push(dotAstroTypeReference);
		}

		await fs.promises.mkdir(settings.config.srcDir, { recursive: true });
		await fs.promises.writeFile(envTsPath, referenceDefs.join('\n'), 'utf-8');
		logger.info('types', `Added ${bold(envTsPathRelativetoRoot)} type declarations`);
	}
}
