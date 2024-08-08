import type fsMod from 'node:fs';
import { dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import generate from '@babel/generator';
import { parse } from '@babel/parser';
import { bold } from 'kleur/colors';
import { normalizePath } from 'vite';
import type { AstroSettings } from '../../@types/astro.js';
import type { Logger } from '../logger/core.js';
import { REFERENCE_FILE } from './constants.js';

export async function writeFiles(settings: AstroSettings, fs: typeof fsMod, logger: Logger) {
	writeInjectedTypes(settings, fs);
	await setUpEnvTs(settings, fs, logger);
}

function getTsReference(type: 'path' | 'types', value: string) {
	return `/// <reference ${type}=${JSON.stringify(value)} />`;
}

const CLIENT_TYPES_REFERENCE = getTsReference('types', 'astro/client');

function writeInjectedTypes(settings: AstroSettings, fs: typeof fsMod) {
	const references: Array<string> = [];

	for (const { filename, content } of settings.injectedTypes) {
		const filepath = normalizePath(fileURLToPath(new URL(filename, settings.dotAstroDir)));
		fs.mkdirSync(dirname(filepath), { recursive: true });
		fs.writeFileSync(filepath, formatContent(content), 'utf-8');
		references.push(normalizePath(relative(fileURLToPath(settings.dotAstroDir), filepath)));
	}

	const astroDtsContent = `${CLIENT_TYPES_REFERENCE}\n${references.map((reference) => getTsReference('path', reference)).join('\n')}`;
	if (references.length === 0) {
		fs.mkdirSync(settings.dotAstroDir, { recursive: true });
	}
	fs.writeFileSync(
		normalizePath(fileURLToPath(new URL(REFERENCE_FILE, settings.dotAstroDir))),
		astroDtsContent,
		'utf-8',
	);
}

async function setUpEnvTs(settings: AstroSettings, fs: typeof fsMod, logger: Logger) {
	const envTsPath = normalizePath(fileURLToPath(new URL('env.d.ts', settings.config.srcDir)));
	const envTsPathRelativetoRoot = normalizePath(
		relative(fileURLToPath(settings.config.root), envTsPath),
	);
	const relativePath = normalizePath(
		relative(
			fileURLToPath(settings.config.srcDir),
			fileURLToPath(new URL(REFERENCE_FILE, settings.dotAstroDir)),
		),
	);
	const expectedTypeReference = getTsReference('path', relativePath);

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

function formatContent(source: string) {
	const ast = parse(source, {
		sourceType: 'module',
		plugins: ['typescript'],
	});

	const result = generate.default(ast, {
		retainLines: false,
	});

	return result.code;
}
