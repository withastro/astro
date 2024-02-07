import { writeFileSync } from 'node:fs';
import type { AstroConfig, InjectedDts } from '../@types/astro.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';

export function injectDts({
	codegenDir,
	filename,
	content,
}: Pick<AstroConfig, 'codegenDir'> & InjectedDts) {
	if (!filename.endsWith('.d.ts') || filename === 'astro.d.ts') {
		throw new AstroError(AstroErrorData.InvalidInjectTypesFilename);
	}

	writeFileSync(new URL(filename, codegenDir), content);
}
