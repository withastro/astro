import type fsMod from 'node:fs';
import type { AstroSettings, InjectedDts } from '../@types/astro.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';

// TODO: only keep astro.d.ts in Astro 5
export const CODEGENDIR_BASE_DTS_FILE = 'types.d.ts';
const RESERVED_FILE_NAMES = ['astro.d.ts', CODEGENDIR_BASE_DTS_FILE];

export function injectDts({
	codegenDir,
	filename,
	content,
	bypassValidation = false,
	fs,
}: Pick<AstroSettings, 'codegenDir'> &
	InjectedDts & { bypassValidation?: boolean; fs: typeof fsMod }) {
	if (
		!bypassValidation &&
		(!filename.endsWith('.d.ts') || RESERVED_FILE_NAMES.includes(filename))
	) {
		throw new AstroError(AstroErrorData.InvalidInjectTypesFilename);
	}

	ensureCodegenDirExists({ codegenDir, fs });
	fs.writeFileSync(new URL(filename, codegenDir), content);
}

export function ensureCodegenDirExists({ codegenDir, fs }: { codegenDir: URL; fs: typeof fsMod }) {
	fs.mkdirSync(codegenDir, { recursive: true });
}
