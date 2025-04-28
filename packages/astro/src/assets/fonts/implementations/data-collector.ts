import type { DataCollector } from '../definitions.js';
import type { CreateUrlProxyParams } from '../types.js';

export function createDataCollector({
	hasUrl,
	saveUrl,
	savePreload,
	saveFontData,
}: Omit<CreateUrlProxyParams, 'local'>): DataCollector {
	return {
		collect({ originalUrl, hash, preload, data, init }) {
			if (!hasUrl(hash)) {
				saveUrl({ hash, url: originalUrl, init });
				if (preload) {
					savePreload(preload);
				}
			}
			saveFontData({
				hash,
				url: originalUrl,
				data,
				init,
			});
		},
	};
}
