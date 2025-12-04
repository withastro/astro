import type { DataCollector, ProxyData } from '../definitions.js';
import type { CreateUrlProxyParams, FontFileData, PreloadData } from '../types.js';

// TODO: investigate converting to core logic
export class RealDataCollector implements DataCollector {
	readonly #hasUrl: CreateUrlProxyParams['hasUrl'];
	readonly #saveUrl: CreateUrlProxyParams['saveUrl'];
	readonly #savePreload: CreateUrlProxyParams['savePreload'];
	readonly #saveFontData: CreateUrlProxyParams['saveFontData'];

	constructor({
		hasUrl,
		saveUrl,
		savePreload,
		saveFontData,
	}: Pick<CreateUrlProxyParams, 'hasUrl' | 'saveUrl' | 'savePreload' | 'saveFontData'>) {
		this.#hasUrl = hasUrl;
		this.#saveUrl = saveUrl;
		this.#savePreload = savePreload;
		this.#saveFontData = saveFontData;
	}

	collect({
		hash,
		url,
		init,
		preload,
		data,
	}: FontFileData & { data: ProxyData; preload: PreloadData | null }): void {
		if (!this.#hasUrl(hash)) {
			this.#saveUrl({ hash, url, init });
			if (preload) {
				this.#savePreload(preload);
			}
		}
		this.#saveFontData({ hash, url, data, init });
	}
}
