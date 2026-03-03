import { EventEmitter } from 'node:events';
import realFS from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createFixture as _createFixture, type FileTree } from 'fs-fixture';
import httpMocks, { type RequestOptions } from 'node-mocks-http';
import { getDefaultClientDirectives } from '../../dist/core/client-directive/index.js';
import { resolveConfig } from '../../dist/core/config/index.js';
import { createBaseSettings } from '../../dist/core/config/settings.js';
import { createContainer, type Container } from '../../dist/core/dev/container.js';
import { AstroIntegrationLogger, Logger, type LogOptions } from '../../dist/core/logger/core.js';
import { nodeLogDestination } from '../../dist/core/logger/node.js';
import { NOOP_MIDDLEWARE_FN } from '../../dist/core/middleware/noop-middleware.js';
import { Pipeline } from '../../dist/core/render/index.js';
import { RouteCache } from '../../dist/core/render/route-cache.js';
import type { AstroInlineConfig } from '../../dist/index.js';

export const defaultLogger = new Logger({
	dest: nodeLogDestination,
	level: 'error',
});

const tempFixturesDir = fileURLToPath(new URL('./_temp-fixtures/', import.meta.url));

export async function createFixture(tree: FileTree) {
	return await _createFixture(
		{
			'package.json': '{}',
			...tree,
		},
		{
			tempDir: tempFixturesDir,
		},
	);
}

export function createRequestAndResponse(reqOptions: RequestOptions = {}) {
	const req = httpMocks.createRequest(reqOptions);
	req.headers.host ||= 'localhost';

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

function toPromise(res: any) {
	return new Promise<Array<Buffer>>((resolve) => {
		// node-mocks-http doesn't correctly handle non-Buffer typed arrays,
		// so override the write method to fix it.
		const write = res.write;
		res.write = function (data: any, encoding: any) {
			if (ArrayBuffer.isView(data) && !Buffer.isBuffer(data)) {
				data = Buffer.from(data.buffer);
			}
			if (typeof data === 'string') {
				data = Buffer.from(data);
			}
			return write.call(this, data, encoding);
		};
		res.on('end', () => {
			let chunks = res._getChunks();
			resolve(chunks);
		});
	});
}

function buffersToString(buffers: Array<Buffer>) {
	let decoder = new TextDecoder();
	let str = '';
	for (const buffer of buffers) {
		str += decoder.decode(buffer);
	}
	return str;
}

export function createBasicPipeline(options: Partial<Pipeline> = {}) {
	const mode = options.mode ?? 'development';
	const pipeline = new Pipeline(
		options.logger ?? defaultLogger,
		options.manifest ?? {
			rootDir: import.meta.url,
			experimentalQueuedRendering: {
				enabled: true,
			},
		},
		options.mode ?? 'development',
		options.renderers ?? [],
		options.resolve ?? ((s) => Promise.resolve(s)),
		options.streaming ?? true,
		options.adapterName,
		options.clientDirectives ?? getDefaultClientDirectives(),
		options.inlinedScripts ?? [],
		options.compressHTML,
		options.i18n,
		options.middleware,
		options.routeCache ?? new RouteCache(options.logging, mode),
		options.site,
	);
	pipeline.headElements = () => ({ scripts: new Set(), styles: new Set(), links: new Set() });
	pipeline.componentMetadata = () => new Map();
	pipeline.getMiddleware = () => {
		return NOOP_MIDDLEWARE_FN;
	};
	return pipeline;
}

export async function createBasicSettings(inlineConfig: AstroInlineConfig = {}) {
	if (!inlineConfig.root) {
		inlineConfig.root = fileURLToPath(new URL('.', import.meta.url));
	}
	const { astroConfig } = await resolveConfig(inlineConfig, 'dev');
	return createBaseSettings(astroConfig, 'info');
}

export async function runInContainer(
	options: {
		fs?: typeof realFS;
		inlineConfig?: AstroInlineConfig;
		logging?: LogOptions;
	} = {},
	callback: (container: Container) => Promise<void> | void,
) {
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

export class SpyLogger implements Logger {
	#logs: Array<{ type: string; label: string | null; message: string }> = [];
	get logs() {
		return this.#logs;
	}

	debug(label: string | null, ...messages: Array<any>) {
		this.#logs.push(...messages.map((message) => ({ type: 'debug', label, message })));
	}
	error(label: string | null, message: string) {
		this.#logs.push({ type: 'error', label, message });
	}
	info(label: string | null, message: string) {
		this.#logs.push({ type: 'info', label, message });
	}
	warn(label: string | null, message: string) {
		this.#logs.push({ type: 'warn', label, message });
	}
	options = {
		dest: {
			write: () => true,
		},
		level: 'silent' as const,
	};
	level() {
		return this.options.level;
	}
	forkIntegrationLogger(label: string) {
		return new AstroIntegrationLogger(this.options, label);
	}
}

/**
 * Creates a mock next() function for middleware testing.
 *
 * This helper creates a mock middleware next() function that returns a specified
 * Response when called. The returned function has a `called` property that tracks
 * whether the function has been invoked.
 *
 * @param {Response} [response] - The Response to return when next() is called
 * @returns {(() => Promise<Response>)} An async function that returns the response
 *
 * @example
 * const next = createMockNext(new Response('Page content'));
 * const response = await next();
 * console.log(next.called); // true
 */
export function createMockNext(response = new Response('OK')) {
	const nextFn = async () => {
		nextFn.called = true;
		return response;
	};
	nextFn.called = false;
	return nextFn;
}
