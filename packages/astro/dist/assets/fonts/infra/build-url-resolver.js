import { fileExtension, joinPaths, prependForwardSlash } from '../../../core/path.js';
import { getAssetsPrefix } from '../../utils/getAssetsPrefix.js';
import { createPlaceholderURL, stringifyPlaceholderURL } from '../../utils/url.js';
class BuildUrlResolver {
	#resources = /* @__PURE__ */ new Set();
	#urls = /* @__PURE__ */ new Set();
	#base;
	#assetsPrefix;
	#searchParams;
	constructor({ base, assetsPrefix, searchParams }) {
		this.#base = base;
		this.#assetsPrefix = assetsPrefix;
		this.#searchParams = searchParams;
	}
	resolve(id) {
		const prefix = this.#assetsPrefix
			? getAssetsPrefix(fileExtension(id), this.#assetsPrefix)
			: void 0;
		let urlPath;
		if (prefix) {
			this.#resources.add(prefix);
			urlPath = joinPaths(prefix, this.#base, id);
		} else {
			this.#resources.add("'self'");
			urlPath = prependForwardSlash(joinPaths(this.#base, id));
		}
		const url = createPlaceholderURL(urlPath);
		this.#searchParams.forEach((value, key) => {
			url.searchParams.set(key, value);
		});
		const result = stringifyPlaceholderURL(url);
		this.#urls.add(result);
		return result;
	}
	get cspResources() {
		return Array.from(this.#resources);
	}
	get urls() {
		return Array.from(this.#urls);
	}
}
export { BuildUrlResolver };
