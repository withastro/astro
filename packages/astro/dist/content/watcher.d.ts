import type { FSWatcher } from 'vite';
export type WrappedWatcher = FSWatcher & {
	removeAllTrackedListeners(): void;
};
export declare function createWatcherWrapper(watcher: FSWatcher): WrappedWatcher;
