import type fsMod from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bold } from 'kleur/colors';
import { type Plugin, normalizePath } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import { ACTIONS_TYPES_FILE } from '../actions/consts.js';
import { CONTENT_TYPES_FILE } from '../content/consts.js';
import { type Logger } from '../core/logger/core.js';
import { ENV_TYPES_FILE } from '../env/constants.js';

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

function getDotAstroTypeReference({
	settings,
	filename,
}: { settings: AstroSettings; filename: string }) {
	const relativePath = normalizePath(
		path.relative(
			fileURLToPath(settings.config.srcDir),
			fileURLToPath(new URL(filename, settings.dotAstroDir))
		)
	);

	return `/// <reference path=${JSON.stringify(relativePath)} />`;
}

type InjectedType = { filename: string; meetsCondition?: () => boolean | Promise<boolean> };

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
	const envTsPathRelativetoRoot = normalizePath(
		path.relative(fileURLToPath(settings.config.root), fileURLToPath(envTsPath))
	);

	const injectedTypes: Array<InjectedType> = [
		{
			filename: CONTENT_TYPES_FILE,
			meetsCondition: () => fs.existsSync(new URL(CONTENT_TYPES_FILE, settings.dotAstroDir)),
		},
		{
			filename: ACTIONS_TYPES_FILE,
			meetsCondition: () => fs.existsSync(new URL(ACTIONS_TYPES_FILE, settings.dotAstroDir)),
		},
	];
	if (settings.config.experimental.env) {
		injectedTypes.push({
			filename: ENV_TYPES_FILE,
		});
	}

	if (fs.existsSync(envTsPath)) {
		let typesEnvContents = await fs.promises.readFile(envTsPath, 'utf-8');

		for (const injectedType of injectedTypes) {
			if (!injectedType.meetsCondition || (await injectedType.meetsCondition?.())) {
				const expectedTypeReference = getDotAstroTypeReference({
					settings,
					filename: injectedType.filename,
				});

				if (!typesEnvContents.includes(expectedTypeReference)) {
					typesEnvContents = `${expectedTypeReference}\n${typesEnvContents}`;
				}
			}
		}

		logger.info('types', `Added ${bold(envTsPathRelativetoRoot)} type declarations.`);
		await fs.promises.writeFile(envTsPath, typesEnvContents, 'utf-8');
	} else {
		// Otherwise, inject the `env.d.ts` file
		let referenceDefs: string[] = [];
		referenceDefs.push('/// <reference types="astro/client" />');

		for (const injectedType of injectedTypes) {
			if (!injectedType.meetsCondition || (await injectedType.meetsCondition?.())) {
				referenceDefs.push(getDotAstroTypeReference({ settings, filename: injectedType.filename }));
			}
		}

		await fs.promises.mkdir(settings.config.srcDir, { recursive: true });
		await fs.promises.writeFile(envTsPath, referenceDefs.join('\n'), 'utf-8');
		logger.info('types', `Added ${bold(envTsPathRelativetoRoot)} type declarations`);
	}
}
