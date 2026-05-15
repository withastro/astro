import { BaseApp } from './base.js';
import { AppPipeline } from './pipeline.js';
class App extends BaseApp {
	createPipeline(streaming) {
		return AppPipeline.create({
			manifest: this.manifest,
			streaming,
		});
	}
	isDev() {
		return false;
	}
	// Should we log something for our users?
	logRequest(_options) {}
}
export { App };
