import { readFileSync } from 'node:fs';
import { AstroError, AstroErrorData } from '../../../core/errors/index.js';
import type { UrlProxyContentResolver } from '../definitions.js';

export class LocalUrlProxyContentResolver implements UrlProxyContentResolver {
	resolve(url: string): string {
		try {
			// We use the url and the file content for the hash generation because:
			// - The URL is not hashed unlike remote providers
			// - A font file can renamed and swapped so we would incorrectly cache it
			return url + readFileSync(url, 'utf-8');
		} catch (cause) {
			throw new AstroError(AstroErrorData.UnknownFilesystemError, { cause });
		}
	}
}
