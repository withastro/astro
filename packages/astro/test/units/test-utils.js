import { Volume } from 'memfs';
import httpMocks from 'node-mocks-http';
import { EventEmitter } from 'node:events';
import realFS from 'node:fs';
import npath from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDefaultClientDirectives } from '../../dist/core/client-directive/index.js';
import { nodeLogDestination } from '../../dist/core/logger/node.js';
import { createEnvironment } from '../../dist/core/render/index.js';
import { RouteCache } from '../../dist/core/render/route-cache.js';
import { resolveConfig } from '../../dist/core/config/index.js';
import { createBaseSettings } from '../../dist/core/config/settings.js';
import { createContainer } from '../../dist/core/dev/container.js';
import { unixify } from './correct-path.js';
import { Logger } from '../../dist/core/logger/core.js';

/** @type {import('../../src/core/logger/core').Logger} */
export const defaultLogger = new Logger({
	dest: nodeLogDestination,
	level: 'error',
});

/** @type {import('../../src/core/logger/core').LogOptions} */
export const silentLogging = {
	dest: nodeLogDestination,
	level: 'error',
};

class VirtualVolume extends Volume {
	#root = '';
	constructor(root) {
		super();
		this.#root = root;
	}

	#forcePath(p) {
		if (p instanceof URL) {
			p = unixify(fileURLToPath(p));
		} else {
			p = unixify(p);
		}
		return p;
	}

	getFullyResolvedPath(pth) {
		return npath.posix.join(this.#root, pth);
	}

	readFile(p, ...args) {
		return super.readFile(this.#forcePath(p), ...args);
	}

	existsSync(p) {
		return super.existsSync(this.#forcePath(p));
	}

	writeFileFromRootSync(pth, ...rest) {
		return super.writeFileSync(this.getFullyResolvedPath(pth), ...rest);
	}
}

class VirtualVolumeWithFallback extends VirtualVolume {
	// Fallback to the real fs
	readFile(p, ...args) {
		const cb = args[args.length - 1];
		const argsMinusCallback = args.slice(0, args.length - 1);
		return super.readFile(p, ...argsMinusCallback, function (err, data) {
			if (err) {
				realFS.readFile(p, ...argsMinusCallback, function (err2, data2) {
					if (err2) {
						cb(err);
					} else {
						cb(null, data2);
					}
				});
			} else {
				cb(null, data);
			}
		});
	}

	readFileSync(p, ...args) {
		try {
			return super.readFileSync(p, ...args);
		} catch (e) {
			return realFS.readFileSync(p, ...args);
		}
	}
}

export function createFs(json, root, VolumeImpl = VirtualVolume) {
	if (typeof root !== 'string') {
		root = unixify(fileURLToPath(root));
	}

	const structure = {};
	for (const [key, value] of Object.entries(json)) {
		const fullpath = npath.posix.join(root, key);
		structure[fullpath] = value;
	}

	const fs = new VolumeImpl(root);
	fs.fromJSON(structure);
	return fs;
}

export function createFsWithFallback(json, root) {
	return createFs(json, root, VirtualVolumeWithFallback);
}

/**
 *
 * @param {import('../../src/core/dev/container').Container} container
 * @param {typeof import('node:fs')} fs
 * @param {string} shortPath
 * @param {'change'} eventType
 */
export function triggerFSEvent(container, fs, shortPath, eventType) {
	container.viteServer.watcher.emit(eventType, fs.getFullyResolvedPath(shortPath));

	if (!fileURLToPath(container.settings.config.root).startsWith('/')) {
		const drive = fileURLToPath(container.settings.config.root).slice(0, 2);
		container.viteServer.watcher.emit(eventType, drive + fs.getFullyResolvedPath(shortPath));
	}
}

export function createRequestAndResponse(reqOptions = {}) {
	const req = httpMocks.createRequest(reqOptions);

	const res = httpMocks.createResponse({
		eventEmitter: EventEmitter,
		req,
	});

	// When the response is complete.
	const done = toPromise(res);

	// Get the response as text
	const text = async () => {
		let chunks = await done;
		return buffersToString(chunks);
	};

	// Get the response as json
	const json = async () => {
		const raw = await text();
		return JSON.parse(raw);
	};

	return { req, res, done, json, text };
}

export function toPromise(res) {
	return new Promise((resolve) => {
		// node-mocks-http doesn't correctly handle non-Buffer typed arrays,
		// so override the write method to fix it.
		const write = res.write;
		res.write = function (data, encoding) {
			if (ArrayBuffer.isView(data) && !Buffer.isBuffer(data)) {
				data = Buffer.from(data.buffer);
			}
			return write.call(this, data, encoding);
		};
		res.on('end', () => {
			let chunks = res._getChunks();
			resolve(chunks);
		});
	});
}

export function buffersToString(buffers) {
	let decoder = new TextDecoder();
	let str = '';
	for (const buffer of buffers) {
		str += decoder.decode(buffer);
	}
	return str;
}

// A convenience method for creating an astro module from a component
export const createAstroModule = (AstroComponent) => ({ default: AstroComponent });

/**
 * @param {Partial<import('../../src/core/render/environment.js').CreateEnvironmentArgs>} options
 * @returns {import('../../src/core/render/environment.js').Environment}
 */
export function createBasicEnvironment(options = {}) {
	const mode = options.mode ?? 'development';
	return createEnvironment({
		...options,
		markdown: {
			...(options.markdown ?? {}),
		},
		mode,
		renderers: options.renderers ?? [],
		clientDirectives: getDefaultClientDirectives(),
		resolve: options.resolve ?? ((s) => Promise.resolve(s)),
		routeCache: new RouteCache(options.logging, mode),
		logger: options.logger ?? defaultLogger,
		ssr: options.ssr ?? true,
		streaming: options.streaming ?? true,
	});
}

/**
 * @param {import('../../src/@types/astro.js').AstroInlineConfig} inlineConfig
 * @returns {Promise<import('../../src/@types/astro.js').AstroSettings>}
 */
export async function createBasicSettings(inlineConfig = {}) {
	if (!inlineConfig.root) {
		inlineConfig.root = fileURLToPath(new URL('.', import.meta.url));
	}
	const { astroConfig } = await resolveConfig(inlineConfig, 'dev');
	return createBaseSettings(astroConfig);
}

/**
 * @typedef {{
 * 	fs?: typeof realFS,
 * 	inlineConfig?: import('../../src/@types/astro.js').AstroInlineConfig,
 *  logging?: import('../../src/core/logger/core').LogOptions,
 * }} RunInContainerOptions
 */

/**
 * @param {RunInContainerOptions} options
 * @param {(container: import('../../src/core/dev/container.js').Container) => Promise<void> | void} callback
 */
export async function runInContainer(options = {}, callback) {
	const settings = await createBasicSettings(options.inlineConfig ?? {});
	const container = await createContainer({
		fs: options?.fs ?? realFS,
		settings,
		inlineConfig: options.inlineConfig ?? {},
		logger: defaultLogger,
	});
	try {
		await callback(container);
	} finally {
		await container.close();
	}
}
