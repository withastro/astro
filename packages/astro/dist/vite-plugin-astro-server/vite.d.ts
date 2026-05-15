import { type EnvironmentModuleNode, type RunnableDevEnvironment } from 'vite';
/** recursively crawl the module graph to get all style files imported by parent id */
export declare function crawlGraph(
	environment: RunnableDevEnvironment,
	_id: string,
	isRootFile: boolean,
	scanned?: Set<string>,
): AsyncGenerator<EnvironmentModuleNode, void, unknown>;
