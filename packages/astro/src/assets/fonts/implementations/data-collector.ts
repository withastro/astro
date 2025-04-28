import type { DataCollector } from '../definitions.js';
import type { CreateUrlProxyParams } from '../types.js';

export function createDataCollector({
	hasUrl,
	saveUrl,
	savePreload,
	saveFontData,
}: Omit<CreateUrlProxyParams, 'local'>): DataCollector {
	return {
		collect({ originalUrl, hash, preload, data }) {
			if (!hasUrl(hash)) {
				saveUrl(hash, originalUrl);
				if (preload) {
					savePreload(preload);
				}
			}
			saveFontData({
				hash,
				url: originalUrl,
				data,
			});
		},
	};
}
