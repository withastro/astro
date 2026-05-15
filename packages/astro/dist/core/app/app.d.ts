import { BaseApp, type LogRequestPayload } from './base.js';
import { AppPipeline } from './pipeline.js';
export declare class App extends BaseApp {
	createPipeline(streaming: boolean): AppPipeline;
	isDev(): boolean;
	logRequest(_options: LogRequestPayload): void;
}
