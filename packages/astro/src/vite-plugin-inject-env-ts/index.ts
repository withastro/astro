import { bold } from 'kleur/colors';
import type fsMod from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizePath, Plugin } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import { getContentPaths, getDotAstroTypeReference } from '../content/index.js';
import { info, LogOptions } from '../core/logger/core.js';

export function getEnvTsPath({ srcDir }: { srcDir: URL }) {
	return new URL('env.d.ts', srcDir);
}

export function astroInjectEnvTsPlugin({
	settings,
	logging,
	fs,
}: {
	settings: AstroSettings;
	logging: LogOptions;
	fs: typeof fsMod;
}): Plugin {
	return {
		name: 'astro-inject-env-ts',
		// Use `post` to ensure project setup is complete
		// Ex. `.astro` types have been written
		enforce: 'post',
		async config() {
			await setUpEnvTs({ settings, logging, fs });
		},
	};
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
		let typesEnvContents = await fs.promises.readFile(envTsPath, 'utf-8');
		if (settings.config.experimental.assets && typesEnvContents.includes('types="astro/client"')) {
			typesEnvContents = typesEnvContents.replace(
				'types="astro/client"',
				'types="astro/client-image"'
			);
			await fs.promises.writeFile(envTsPath, typesEnvContents, 'utf-8');
		} else if (typesEnvContents.includes('types="astro/client-image"')) {
			typesEnvContents = typesEnvContents.replace(
				'types="astro/client-image"',
				'types="astro/client"'
			);
			await fs.promises.writeFile(envTsPath, typesEnvContents, 'utf-8');
		}

		if (!fs.existsSync(dotAstroDir))
			// Add `.astro` types reference if none exists
			return;
		const expectedTypeReference = getDotAstroTypeReference(settings.config);

		if (!typesEnvContents.includes(expectedTypeReference)) {
			typesEnvContents = `${expectedTypeReference}\n${typesEnvContents}`;
			await fs.promises.writeFile(envTsPath, typesEnvContents, 'utf-8');
			info(logging, 'content', `Added ${bold(envTsPathRelativetoRoot)} types`);
		}
	} else {
		// Otherwise, inject the `env.d.ts` file
		let referenceDefs: string[] = [];
		if (settings.config.experimental.assets) {
			referenceDefs.push('/// <reference types="astro/client-image" />');
		} else if (settings.config.integrations.find((i) => i.name === '@astrojs/image')) {
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
