import type { AstroConfig } from '../@types/astro.js';
import { writeFileSync } from 'node:fs';

export function injectTypes({
	typegenDir,
	filename,
	content,
}: Pick<AstroConfig, 'typegenDir'> & {
	filename: `${string}.d.ts`;
	content: string;
}) {
	if (!filename.endsWith('.d.ts')) {
		throw new Error('TODO:');
	}

	writeFileSync(new URL(typegenDir, filename), content);
}
