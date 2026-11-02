import { ContentLayer, type ContentLayerOptions } from './content-layer.js';

function contentLayerSingleton() {
	let instance: ContentLayer | null = null;
	return {
		init: (options: ContentLayerOptions) => {
			instance?.dispose();
			instance = new ContentLayer(options);
			return instance;
		},
		get: () => instance,
		dispose: () => {
			instance?.dispose();
			instance = null;
		},
	};
}

export const globalContentLayer = contentLayerSingleton();
