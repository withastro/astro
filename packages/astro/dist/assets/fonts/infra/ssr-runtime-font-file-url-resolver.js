import { MissingGetFontFileRequestUrl } from '../../../core/errors/errors-data.js';
import { AstroError } from '../../../core/errors/errors.js';
class SsrRuntimeFontFileUrlResolver {
	#urls;
	constructor({ urls }) {
		this.#urls = urls;
	}
	resolve(url, requestUrl) {
		if (!this.#urls.has(url)) {
			return null;
		}
		if (!url.startsWith('/')) {
			return url;
		}
		if (!requestUrl) {
			throw new AstroError(MissingGetFontFileRequestUrl);
		}
		return `${requestUrl.origin}${url}`;
	}
}
export { SsrRuntimeFontFileUrlResolver };
