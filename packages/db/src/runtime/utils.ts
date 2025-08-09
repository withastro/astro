import { type Config as LibSQLConfig, LibsqlError } from '@libsql/client';
import { AstroError } from 'astro/errors';

const isWindows = process?.platform === 'win32';

export class AstroDbError extends AstroError {
	name = 'Astro DB Error';
}

export function isDbError(err: unknown): err is LibsqlError {
	return err instanceof LibsqlError || (err instanceof Error && (err as any).libsqlError === true);
}

function slash(path: string) {
	const isExtendedLengthPath = path.startsWith('\\\\?\\');

	if (isExtendedLengthPath) {
		return path;
	}

	return path.replace(/\\/g, '/');
}

export function pathToFileURL(path: string): URL {
	if (isWindows) {
		let slashed = slash(path);
		// Windows like C:/foo/bar
		if (!slashed.startsWith('/')) {
			slashed = '/' + slashed;
		}
		return new URL('file://' + slashed);
	}

	// Unix is easy
	return new URL('file://' + path);
}

// this function parses the options from a `Record<string, string>`
// provided from the object conversion of the searchParams and properly
// verifies that the Config object is providing the correct types.
// without this, there is runtime errors due to incorrect values
export function parseOpts(config: Record<string, string>): Partial<LibSQLConfig> {
	return {
		...config,
		...(config.syncInterval ? { syncInterval: parseInt(config.syncInterval) } : {}),
		...('readYourWrites' in config ? { readYourWrites: config.readYourWrites !== 'false' } : {}),
		...('offline' in config ? { offline: config.offline !== 'false' } : {}),
		...('tls' in config ? { tls: config.tls !== 'false' } : {}),
		...(config.concurrency ? { concurrency: parseInt(config.concurrency) } : {}),
	};
}
