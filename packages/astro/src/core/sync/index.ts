import { bold, dim } from 'kleur/colors';
import type fsMod from 'node:fs';
import { performance } from 'node:perf_hooks';
import { createServer, normalizePath } from 'vite';
import type { AstroSettings } from '../../@types/astro';
import { createContentTypesGenerator } from '../../content/index.js';
import {
	getContentPaths,
	getDotAstroTypeReference,
	globalContentConfigObserver,
} from '../../content/utils.js';
import { getTimeStat } from '../build/util.js';
import { createVite } from '../create-vite.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { info, LogOptions } from '../logger/core.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export async function sync(
	settings: AstroSettings,
	{ logging, fs }: { logging: LogOptions; fs: typeof fsMod }
): Promise<0 | 1> {
	const timerStart = performance.now();
	// Needed to load content config
	const tempViteServer = await createServer(
		await createVite(
			{
				server: { middlewareMode: true, hmr: false },
				optimizeDeps: { entries: [] },
				logLevel: 'silent',
			},
			{ settings, logging, mode: 'build', fs }
		)
	);

	try {
		const contentTypesGenerator = await createContentTypesGenerator({
			contentConfigObserver: globalContentConfigObserver,
			logging,
			fs,
			settings,
			viteServer: tempViteServer,
		});
		const typesResult = await contentTypesGenerator.init();
		if (typesResult.typesGenerated === false) {
			switch (typesResult.reason) {
				case 'no-content-dir':
				default:
					info(logging, 'content', 'No content directory found. Skipping type generation.');
					return 0;
			}
		}
	} catch (e) {
		throw new AstroError(AstroErrorData.GenerateContentTypesError);
	} finally {
		await tempViteServer.close();
	}

	info(logging, 'content', `Types generated ${dim(getTimeStat(timerStart, performance.now()))}`);
	await setUpEnvTs({ settings, logging, fs });

	return 0;
}

export async function setUpEnvTs({
	settings,
	logging,
	fs,
}: {
	settings: AstroSettings;
	logging: LogOptions;
	fs: typeof fsMod;
}) {
	const envTsPath = getEnvTsPath(settings.config);
	const dotAstroDir = getContentPaths(settings.config).cacheDir;
	const dotAstroTypeReference = getDotAstroTypeReference(settings.config);
	const envTsPathRelativetoRoot = normalizePath(
		path.relative(fileURLToPath(settings.config.root), fileURLToPath(envTsPath))
	);

	if (fs.existsSync(envTsPath)) {
		// Add `.astro` types reference if none exists
		if (!fs.existsSync(dotAstroDir)) return;

		let typesEnvContents = await fs.promises.readFile(envTsPath, 'utf-8');
		const expectedTypeReference = getDotAstroTypeReference(settings.config);

		if (!typesEnvContents.includes(expectedTypeReference)) {
			typesEnvContents = `${expectedTypeReference}\n${typesEnvContents}`;
			await fs.promises.writeFile(envTsPath, typesEnvContents, 'utf-8');
			info(logging, 'content', `Added ${bold(envTsPathRelativetoRoot)} types`);
		}
	} else {
		// Otherwise, inject the `env.d.ts` file
		let referenceDefs: string[] = [];
		if (settings.config.integrations.find((i) => i.name === '@astrojs/image')) {
			referenceDefs.push('/// <reference types="@astrojs/image/client" />');
		} else {
			referenceDefs.push('/// <reference types="astro/client" />');
		}

		if (fs.existsSync(dotAstroDir)) {
			referenceDefs.push(dotAstroTypeReference);
		}

		await fs.promises.mkdir(settings.config.srcDir, { recursive: true });
		await fs.promises.writeFile(envTsPath, referenceDefs.join('\n'), 'utf-8');
		info(logging, 'astro', `Added ${bold(envTsPathRelativetoRoot)} types`);
	}
}

function getEnvTsPath({ srcDir }: { srcDir: URL }) {
	return new URL('env.d.ts', srcDir);
}
