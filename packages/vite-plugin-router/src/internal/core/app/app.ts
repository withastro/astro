import { BaseApp, type LogRequestPayload } from './base.js';

export class App extends BaseApp {
	isDev(): boolean {
		return false;
	}

	// Should we log something for our users?
	logRequest(_options: LogRequestPayload) {}
}
