import type { LoaderEvents, ModuleLoader } from '../core/module-loader/index.js';
import type { ServerState } from './server-state.js';
type ReloadFn = () => void;
export interface DevServerController {
	state: ServerState;
	onFileChange: LoaderEvents['file-change'];
	onHMRError: LoaderEvents['hmr-error'];
}
type CreateControllerParams =
	| {
			loader: ModuleLoader;
	  }
	| {
			reload: ReloadFn;
	  };
export declare function createController(params: CreateControllerParams): DevServerController;
interface RunWithErrorHandlingParams {
	controller: DevServerController;
	pathname: string;
	run: () => Promise<any>;
	onError: (error: unknown) => Error | undefined;
}
export declare function runWithErrorHandling({
	controller: { state },
	pathname,
	run,
	onError,
}: RunWithErrorHandlingParams): Promise<void>;
export {};
