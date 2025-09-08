import { EventEmitter } from 'node:events';
import type * as fs from 'node:fs';
import type { EnvironmentModuleNode } from 'vite';
import type { TypedEventEmitter } from '../../types/typed-emitter.js';

// This is a generic interface for a module loader. In the astro cli this is
// fulfilled by Vite, see vite.ts

export type LoaderEvents = {
	'file-add': (msg: [path: string, stats?: fs.Stats | undefined]) => void;
	'file-change': (msg: [path: string, stats?: fs.Stats | undefined]) => void;
	'file-unlink': (msg: [path: string, stats?: fs.Stats | undefined]) => void;
	'hmr-error': (msg: {
		type: 'error';
		err: {
			message: string;
			stack: string;
		};
	}) => void;
};

export type ModuleLoaderEventEmitter = TypedEventEmitter<LoaderEvents>;

export interface ModuleLoader {
	import: (src: string) => Promise<Record<string, any>>;
	resolveId: (specifier: string, parentId: string | undefined) => Promise<string | undefined>;
	getModuleById: (id: string) => EnvironmentModuleNode | undefined;
	getModulesByFile: (file: string) => Set<EnvironmentModuleNode> | undefined;
	getModuleInfo: (id: string) => ModuleInfo | null;

	eachModule(
		callbackfn: (
			value: EnvironmentModuleNode,
			key: string,
			map: Map<string, EnvironmentModuleNode>,
		) => void,
	): void;
	invalidateModule(mod: EnvironmentModuleNode): void;

	fixStacktrace: (error: Error) => void;

	clientReload: () => void;
	webSocketSend: (msg: any) => void;
	isHttps: () => boolean;
	events: TypedEventEmitter<LoaderEvents>;
}

export interface ModuleInfo {
	id: string;
	meta?: Record<string, any>;
}

export function createLoader(overrides: Partial<ModuleLoader>): ModuleLoader {
	return {
		import() {
			throw new Error(`Not implemented`);
		},
		resolveId(id) {
			return Promise.resolve(id);
		},
		getModuleById() {
			return undefined;
		},
		getModulesByFile() {
			return undefined;
		},
		getModuleInfo() {
			return null;
		},
		eachModule() {
			throw new Error(`Not implemented`);
		},
		invalidateModule() {},
		fixStacktrace() {},
		clientReload() {},
		webSocketSend() {},
		isHttps() {
			return true;
		},
		events: new EventEmitter() as ModuleLoaderEventEmitter,

		...overrides,
	};
}
