import { isAbsolute } from 'node:path';
import { AstroError, AstroErrorData } from '../../../core/errors/index.js';
import type { FontFileContentResolver } from '../definitions.js';

type ReadFileSync = (path: string) => string;

export class FsFontFileContentResolver implements FontFileContentResolver {
	#readFileSync: ReadFileSync;

	constructor({ readFileSync }: { readFileSync: ReadFileSync }) {
		this.#readFileSync = readFileSync;
	}

	resolve(url: string): string {
		if (!isAbsolute(url)) {
			// HTTP URLs are enough
			return url;
		}
		try {
			// We only hash the file content, not the url, so the generated id is
			// deterministic across different absolute paths (eg. CI vs local checkouts).
			// A swapped font file will have different content and thus a different id.
			return this.#readFileSync(url);
		} catch (cause) {
			throw new AstroError(AstroErrorData.UnknownFilesystemError, { cause });
		}
	}
}
