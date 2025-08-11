import { BaseApp } from './base.js';
import { AppPipeline } from './pipeline.js';

export class App extends BaseApp {
	createPipeline(streaming: boolean): AppPipeline {
		return AppPipeline.create({
			logger: this.logger,
			manifest: this.manifest,
			streaming,
		});
	}
}
