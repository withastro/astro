import { normalizePath } from 'vite';
import type { AstroConfig } from '../@types/astro.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { AstroError, AstroErrorData } from '../core/errors/index.js';

export function injectTypes({
	codegenDir,
	filename,
	content,
}: Pick<AstroConfig, 'codegenDir'> & {
	filename: `${string}.d.ts`;
	content: string;
}) {
	if (!filename.endsWith('.d.ts')) {
		throw new AstroError(AstroErrorData.InvalidInjectTypesFilename);
	}

	writeFileSync(new URL(codegenDir, filename), content);

	const tsConfigPath = normalizePath(fileURLToPath(new URL('tsconfig.json', codegenDir)));
	const tsconfig = JSON.parse(readFileSync(tsConfigPath, 'utf-8'));
	tsconfig.include.push(`./${filename}`);
	writeFileSync(tsConfigPath, JSON.stringify(tsconfig, null, 2), 'utf-8');
}
