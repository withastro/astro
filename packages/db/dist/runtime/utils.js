import { LibsqlError } from '@libsql/client';
import { AstroError } from 'astro/errors';
function hasPrimaryKey(column) {
	return 'primaryKey' in column.schema && !!column.schema.primaryKey;
}
const isWindows = process?.platform === 'win32';
class AstroDbError extends AstroError {
	name = 'Astro DB Error';
}
function getDbError(err) {
	if (err instanceof LibsqlError) return err;
	if (err instanceof Error && err.libsqlError === true) return err;
	if (err instanceof Error && err.cause != null && err.cause !== err) {
		return getDbError(err.cause);
	}
	return void 0;
}
function isDbError(err) {
	return getDbError(err) !== void 0;
}
function slash(path) {
	const isExtendedLengthPath = path.startsWith('\\\\?\\');
	if (isExtendedLengthPath) {
		return path;
	}
	return path.replace(/\\/g, '/');
}
function pathToFileURL(path) {
	if (isWindows) {
		let slashed = slash(path);
		if (!slashed.startsWith('/')) {
			slashed = '/' + slashed;
		}
		return new URL('file://' + slashed);
	}
	return new URL('file://' + path);
}
export { AstroDbError, getDbError, hasPrimaryKey, isDbError, pathToFileURL };
