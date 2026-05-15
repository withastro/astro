import { isAbsolute } from 'node:path';
import { AstroError, AstroErrorData } from '../../../core/errors/index.js';
class FsFontFileContentResolver {
	#readFileSync;
	constructor({ readFileSync }) {
		this.#readFileSync = readFileSync;
	}
	resolve(url) {
		if (!isAbsolute(url)) {
			return url;
		}
		try {
			return url + this.#readFileSync(url);
		} catch (cause) {
			throw new AstroError(AstroErrorData.UnknownFilesystemError, { cause });
		}
	}
}
export { FsFontFileContentResolver };
