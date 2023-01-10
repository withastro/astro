import type { AstroSettings } from '../@types/astro.js';
import type fsMod from 'node:fs';
import { normalizePath, Plugin } from 'vite';
import path from 'node:path';
import { getContentPaths, getDotAstroTypeReference } from '../content/index.js';
import { info, LogOptions } from '../core/logger/core.js';
import { fileURLToPath } from 'node:url';
import { bold } from 'kleur/colors';

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
		name: 'astro-inject-ts-env',
		// Use `post` to ensure project setup is complete
		// Ex. `.astro` types have been written
		enforce: 'post',
		async config() {
			const envTsPath = getEnvTsPath(settings.config);
			if (fs.existsSync(envTsPath)) return;

			let referenceDefs: string[] = [];
			if (settings.config.integrations.find((i) => i.name === '@astrojs/image')) {
				referenceDefs.push('/// <reference types="@astrojs/image/client" />');
			} else {
				referenceDefs.push('/// <reference types="astro/client" />');
			}

			if (fs.existsSync(getContentPaths(settings.config).cacheDir)) {
				referenceDefs.push(getDotAstroTypeReference(settings.config));
			}

			const envTsPathRelativetoRoot = normalizePath(
				path.relative(fileURLToPath(settings.config.root), fileURLToPath(envTsPath))
			);

			await fs.promises.writeFile(envTsPath, referenceDefs.join('\n'));
			info(logging, 'astro', `Added ${bold(envTsPathRelativetoRoot)} types`);
		},
	};
}
