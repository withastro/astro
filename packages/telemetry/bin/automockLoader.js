import { basename, extname, join, dirname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';

const MOCKS_DIR = '../test/__mocks__';
const MOCK_DEFAULT_EXTENSION = '.js';

const filePath = fileURLToPath(import.meta.url);
const fileDirname = dirname(filePath);

/**
 * Automatically redirects a module import to its mock, if one is available.
 *
 * Caveat:
 * Mocking is absolute, hence why it should be used only for "edge" modules e.g. testing of which would be outside of a package's scope, and with a possibility of a universal mock for an entire test suite (like 3rd party dependencies).
 */
export function resolve(specifier, context, next) {
	const moduleName = basename(specifier);
	const moduleExtension = extname(specifier);

	const moduleMockExtension = moduleExtension ? '' : MOCK_DEFAULT_EXTENSION;
	const moduleMockName = `${moduleName}${moduleMockExtension}`;
	const moduleMockPath = join(fileDirname, MOCKS_DIR, moduleMockName);

	const hasMock = existsSync(moduleMockPath);
	if (hasMock) {
		const { href: url } = pathToFileURL(moduleMockPath);
		return {
			url,
		};
	}

	return next(specifier, context);
}
