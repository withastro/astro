import { DefaultErrorHandler } from './default-handler.js';
class BuildErrorHandler {
	#default;
	constructor(app) {
		this.#default = new DefaultErrorHandler(app);
	}
	async renderError(request, options) {
		if (options.status === 500) {
			if (options.response) {
				return options.response;
			}
			throw options.error;
		}
		return this.#default.renderError(request, {
			...options,
			prerenderedErrorPageFetch: void 0,
		});
	}
}
export { BuildErrorHandler };
