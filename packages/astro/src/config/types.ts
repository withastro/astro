import { writeFileSync } from 'node:fs';
import type { AstroSettings, InjectedDts } from '../@types/astro.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';

// TODO: only keep astro.d.ts in Astro 5
const RESERVED_FILE_NAMES = ['astro.d.ts', 'types.d.ts'];

export function injectDts({
	codegenDir,
	filename,
	content,
	bypassValidation = false,
}: Pick<AstroSettings, 'codegenDir'> & InjectedDts & { bypassValidation?: boolean }) {
	if (!bypassValidation && (!filename.endsWith('.d.ts') || RESERVED_FILE_NAMES.includes(filename))) {
		throw new AstroError(AstroErrorData.InvalidInjectTypesFilename);
	}

	writeFileSync(new URL(filename, codegenDir), content);
}
