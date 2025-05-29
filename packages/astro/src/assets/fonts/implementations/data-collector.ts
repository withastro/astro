import type { DataCollector } from '../definitions.js';
import type { CreateUrlProxyParams } from '../types.js';

export function createDataCollector({
	hasUrl,
	saveUrl,
	savePreload,
	saveFontData,
}: Omit<CreateUrlProxyParams, 'local'>): DataCollector {
	return {
		collect({ hash, url, init, preload, data }) {
			if (!hasUrl(hash)) {
				saveUrl({ hash, url, init });
				if (preload) {
					savePreload(preload);
				}
			}
			saveFontData({ hash, url, data, init });
		},
	};
}
