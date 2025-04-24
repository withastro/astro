import type { DataCollector } from '../definitions.js';
import type { CreateUrlProxyParams, PreloadData } from '../types.js';
import type * as unifont from 'unifont';

export class RealDataCollector implements DataCollector {
	constructor(private params: Omit<CreateUrlProxyParams, 'local'>) {}

	collect({
		originalUrl,
		hash,
		preload,
		data,
	}: {
		originalUrl: string;
		hash: string;
		preload: PreloadData[number] | null;
		data: Partial<unifont.FontFaceData>;
	}): void {
		if (!this.params.hasUrl(hash)) {
			this.params.saveUrl(hash, originalUrl);
			if (preload) {
				this.params.savePreload(preload);
			}
		}
		this.params.saveFontData({
			hash,
			url: originalUrl,
			data,
		});
	}
}
