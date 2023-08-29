import { bold } from 'kleur/colors';
import type fsMod from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizePath, type Plugin } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import { getContentPaths, getDotAstroTypeReference } from '../content/index.js';
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
	const dotAstroTypeReference = getDotAstroTypeReference(settings.config);
	const envTsPathRelativetoRoot = normalizePath(
		path.relative(fileURLToPath(settings.config.root), fileURLToPath(envTsPath))
	);

	if (fs.existsSync(envTsPath)) {
		let typesEnvContents = await fs.promises.readFile(envTsPath, 'utf-8');

		// TODO: Remove this in 4.0, this code is only to help users migrate away from assets being experimental for a long time
		if (typesEnvContents.includes('types="astro/client-image"')) {
			typesEnvContents = typesEnvContents.replace(
				'types="astro/client-image"',
				'types="astro/client"'
			);
			await fs.promises.writeFile(envTsPath, typesEnvContents, 'utf-8');
			logger.info('assets', `Removed ${bold(envTsPathRelativetoRoot)} types`);
		}

		if (!fs.existsSync(dotAstroDir))
			// Add `.astro` types reference if none exists
			return;
		const expectedTypeReference = getDotAstroTypeReference(settings.config);

		if (!typesEnvContents.includes(expectedTypeReference)) {
			typesEnvContents = `${expectedTypeReference}\n${typesEnvContents}`;
			await fs.promises.writeFile(envTsPath, typesEnvContents, 'utf-8');
			logger.info('content', `Added ${bold(envTsPathRelativetoRoot)} types`);
		}
	} else {
		// Otherwise, inject the `env.d.ts` file
		let referenceDefs: string[] = [];
		referenceDefs.push('/// <reference types="astro/client" />');

		if (fs.existsSync(dotAstroDir)) {
			referenceDefs.push(dotAstroTypeReference);
		}

		await fs.promises.mkdir(settings.config.srcDir, { recursive: true });
		await fs.promises.writeFile(envTsPath, referenceDefs.join('\n'), 'utf-8');
		logger.info('astro', `Added ${bold(envTsPathRelativetoRoot)} types`);
	}
}
