import type fsMod from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bold } from 'kleur/colors';
import { normalizePath } from 'vite';
import type { AstroSettings } from '../../@types/astro.js';
import type { Logger } from '../logger/core.js';
import { REFERENCE_FILE } from './constants.js';

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

export async function setUpEnvTs({
	settings,
	logger,
	fs,
}: {
	settings: AstroSettings;
	logger: Logger;
	fs: typeof fsMod;
}) {
	const envTsPath = normalizePath(fileURLToPath(new URL('env.d.ts', settings.config.srcDir)));
	const envTsPathRelativetoRoot = normalizePath(
		path.relative(fileURLToPath(settings.config.root), envTsPath)
	);
	const expectedTypeReference = getDotAstroTypeReference({
		settings,
		filename: REFERENCE_FILE,
	});

	if (fs.existsSync(envTsPath)) {
		const initialEnvContents = await fs.promises.readFile(envTsPath, 'utf-8');
		let typesEnvContents = initialEnvContents;


		if (!typesEnvContents.includes(expectedTypeReference)) {
			typesEnvContents = `${expectedTypeReference}\n${typesEnvContents}`;
		}

		if (initialEnvContents !== typesEnvContents) {
			logger.info('types', `Updated ${bold(envTsPathRelativetoRoot)} type declarations.`);
			await fs.promises.writeFile(envTsPath, typesEnvContents, 'utf-8');
		}
	} else {
		// Otherwise, inject the `env.d.ts` file
		await fs.promises.mkdir(settings.config.srcDir, { recursive: true });
		await fs.promises.writeFile(envTsPath, expectedTypeReference, 'utf-8');
		logger.info('types', `Added ${bold(envTsPathRelativetoRoot)} type declarations`);
	}
}
