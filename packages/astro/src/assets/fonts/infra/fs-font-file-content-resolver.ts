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
			// We use the url and the file content for the id generation because:
			// - The URL is not hashed unlike remote providers
			// - A font file can renamed and swapped so we would incorrectly cache it
			return url + this.#readFileSync(url);
		} catch (cause) {
			throw new AstroError(AstroErrorData.UnknownFilesystemError, { cause });
		}
	}
}
