import path from 'node:path';

const ignoredDirectories = ['node_modules', '.git'];

/**
 * Whether `filePath` is inside a `node_modules` or `.git` directory within `rootPath`.
 * Only path segments below `rootPath` are checked, so the root itself is never ignored.
 */
export function isInIgnoredDirectory(rootPath: string, filePath: string): boolean {
	return path
		.relative(rootPath, filePath)
		.split(path.sep)
		.some((segment) => ignoredDirectories.includes(segment));
}
