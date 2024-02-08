import { writeFileSync } from 'node:fs';
import type { AstroConfig, InjectedDts } from '../@types/astro.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';

export function injectDts({
	codegenDir,
	filename,
	content,
	bypassValidation = false,
}: Pick<AstroConfig, 'codegenDir'> & InjectedDts & { bypassValidation?: boolean }) {
	if (!bypassValidation && (!filename.endsWith('.d.ts') || filename === 'astro.d.ts')) {
		throw new AstroError(AstroErrorData.InvalidInjectTypesFilename);
	}

	writeFileSync(new URL(filename, codegenDir), content);
}
