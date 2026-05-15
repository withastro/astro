import { ContentLayer } from './content-layer.js';
function contentLayerSingleton() {
	let instance = null;
	return {
		init: (options) => {
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
const globalContentLayer = contentLayerSingleton();
export { globalContentLayer };
