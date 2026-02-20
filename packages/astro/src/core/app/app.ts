import { BaseApp, type LogRequestPayload } from './base.js';
import { AppPipeline } from './pipeline.js';

export class App extends BaseApp {
	createPipeline(streaming: boolean): AppPipeline {
		return AppPipeline.create({
			manifest: this.manifest,
			streaming,
		});
	}

	isDev(): boolean {
		return false;
	}

	// Should we log something for our users?
	logRequest(_options: LogRequestPayload) {}
}
