import { EventEmitter } from 'node:events';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createFixture as _createFixture, type FileTree } from 'fs-fixture';
import httpMocks from 'node-mocks-http';
import { getDefaultClientDirectives } from '../../dist/core/client-directive/index.js';
import { resolveConfig } from '../../dist/core/config/index.js';
import { createBaseSettings } from '../../dist/core/config/settings.js';
import { AstroLogger } from '../../dist/core/logger/core.js';
import nodeLoggerFactory from '../../dist/core/logger/impls/node.js';
import { NOOP_MIDDLEWARE_FN } from '../../dist/core/middleware/noop-middleware.js';
import { Pipeline } from '../../dist/core/render/index.js';
import { RouteCache } from '../../dist/core/render/route-cache.js';
import type { AstroLoggerLevel } from '../../dist/core/logger/core.js';
import type { AstroInlineConfig, RuntimeMode } from '../../dist/types/public/config.js';
import type { AstroSettings } from '../../dist/types/astro.js';
import type { SSRManifest } from '../../dist/core/app/types.js';
import type { RouteData, SSRLoadedRenderer, SSRResult } from '../../dist/types/public/internal.js';
import type { HeadElements, TryRewriteResult } from '../../dist/core/base-pipeline.js';
import type { ComponentInstance } from '../../dist/types/astro.js';
import type { RewritePayload, MiddlewareHandler } from '../../dist/types/public/common.js';
import { createManifest } from './app/test-helpers.ts';

export type { AstroSettings };

export const defaultLogger: AstroLogger = new AstroLogger({
	destination: nodeLoggerFactory(),
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

export function createRequestAndResponse(reqOptions: httpMocks.RequestOptions = {}) {
	const req: IncomingMessage = httpMocks.createRequest(reqOptions);
	req.headers.host ||= 'localhost';

	const res: ServerResponse<IncomingMessage> = httpMocks.createResponse({
		eventEmitter: EventEmitter,
		req,
	});

	// When the response is complete.
	// Cast needed because node-mocks-http's type declarations don't expose
	// EventEmitter methods or _getChunks(), even though they exist at runtime.
	const done = toPromise(res as unknown as MockRes);

	// Get the response as text
	const text = async () => {
		const chunks = await done;
		return buffersToString(chunks);
	};

	// Get the response as json
	const json = async () => {
		const raw = await text();
		return JSON.parse(raw);
	};

	return { req, res, done, json, text };
}

// node-mocks-http types are intentionally loose — the mock response supports
// EventEmitter methods and internal helpers like _getChunks() that aren't in
// the public type declarations. We use a loose interface here to avoid fighting
// the mock library's types.
interface MockRes {
	write: (data: Buffer | string, encoding?: BufferEncoding) => boolean;
	on: (event: string, cb: () => void) => void;
	_getChunks: () => Buffer[];
}

function toPromise(res: MockRes): Promise<Buffer[]> {
	return new Promise((resolve) => {
		// node-mocks-http doesn't correctly handle non-Buffer typed arrays,
		// so override the write method to fix it.
		const write = res.write;
		res.write = function (data: Buffer | string | ArrayBufferView, encoding?: BufferEncoding) {
			if (ArrayBuffer.isView(data) && !Buffer.isBuffer(data)) {
				data = Buffer.from(data.buffer as ArrayBuffer);
			}
			if (typeof data === 'string') {
				data = Buffer.from(data);
			}
			return write.call(this, data as Buffer, encoding);
		};
		res.on('end', () => {
			const chunks = res._getChunks();
			resolve(chunks);
		});
	});
}

function buffersToString(buffers: Buffer[]): string {
	const decoder = new TextDecoder();
	let str = '';
	for (const buffer of buffers) {
		str += decoder.decode(buffer);
	}
	return str;
}

/**
 * Concrete Pipeline subclass for unit testing. Implements the abstract
 * methods with minimal stubs so Pipeline can be instantiated without
 * a real build or dev server.
 */
class TestPipeline extends Pipeline {
	headElements(): HeadElements {
		return { scripts: new Set(), styles: new Set(), links: new Set() } as HeadElements;
	}

	async componentMetadata(): Promise<SSRResult['componentMetadata']> {
		return new Map() as SSRResult['componentMetadata'];
	}

	async tryRewrite(_rewritePayload: RewritePayload, _request: Request): Promise<TryRewriteResult> {
		throw new Error('tryRewrite is not implemented in TestPipeline');
	}

	async getComponentByRoute(_routeData: RouteData): Promise<ComponentInstance> {
		throw new Error('getComponentByRoute is not implemented in TestPipeline');
	}

	getName(): string {
		return 'test-pipeline';
	}

	override async getMiddleware(): Promise<MiddlewareHandler> {
		return NOOP_MIDDLEWARE_FN;
	}
}

/**
 * Creates a basic Pipeline instance for testing.
 * For mock utilities like createMockRenderContext, see mocks.ts
 */
export function createBasicPipeline(
	options: {
		logger?: AstroLogger;
		manifest?: Partial<SSRManifest>;
		mode?: RuntimeMode;
		renderers?: SSRLoadedRenderer[];
		resolve?: (s: string) => Promise<string>;
		streaming?: boolean;
		adapterName?: string;
		clientDirectives?: Map<string, string>;
		inlinedScripts?: Map<string, string>;
		compressHTML?: boolean;
		i18n?: SSRManifest['i18n'];
		middleware?: SSRManifest['middleware'];
		routeCache?: RouteCache;
		site?: string;
		logging?: AstroLogger;
	} = {},
): Pipeline {
	const mode = options.mode ?? 'development';
	return new TestPipeline(
		options.logger ?? defaultLogger,
		createManifest(options.manifest ?? {}),
		options.mode ?? 'development',
		options.renderers ?? [],
		options.resolve ?? ((s: string) => Promise.resolve(s)),
		options.streaming ?? true,
		options.adapterName,
		options.clientDirectives ?? getDefaultClientDirectives(),
		options.inlinedScripts ?? new Map(),
		options.compressHTML,
		options.i18n,
		options.middleware,
		options.routeCache ?? new RouteCache(options.logging ?? defaultLogger, mode),
		options.site ? new URL(options.site) : undefined,
	);
}

export async function createBasicSettings(
	inlineConfig: AstroInlineConfig = {},
): Promise<AstroSettings> {
	if (!inlineConfig.root) {
		inlineConfig.root = fileURLToPath(new URL('.', import.meta.url));
	}
	const { astroConfig } = await resolveConfig(inlineConfig, 'dev');
	return createBaseSettings(astroConfig, inlineConfig.logLevel);
}

export interface LogEntry {
	level: string;
	label: string | null;
	message: string;
}

/**
 * A test spy logger that extends AstroLogger and captures all log writes
 * into a `.logs` array for assertions.
 *
 * All writes — including those from integration loggers obtained via
 * `forkIntegrationLogger()` and further `.fork()` calls — flow through
 * a shared capturing destination. This means:
 *
 * - **`.logs`** contains entries from both direct calls and forked loggers,
 *   in the order they occurred.
 * - **`.writeCount()`** includes writes from forked integration loggers.
 * - **Level filtering** (configurable via the constructor) applies uniformly
 *   to both direct and forked writes. Defaults to `'debug'` (capture everything).
 *
 * @example Direct usage
 * ```ts
 * const spy = new SpyLogger();
 * spy.info('config', 'loaded');
 * assert.equal(spy.logs[0].level, 'info');
 * ```
 *
 * @example Integration logger writes are captured
 * ```ts
 * const spy = new SpyLogger();
 * const intLogger = spy.forkIntegrationLogger('my-integration');
 * intLogger.warn('something bad');
 * assert.equal(spy.logs[0].level, 'warn');
 * assert.equal(spy.logs[0].label, 'my-integration');
 * assert.equal(spy.writeCount(), 1);
 * ```
 *
 * @example Custom log level
 * ```ts
 * const spy = new SpyLogger({ level: 'warn' });
 * spy.info(null, 'filtered out');
 * spy.warn(null, 'captured');
 * assert.equal(spy.logs.length, 1);
 * ```
 */
export class SpyLogger extends AstroLogger {
	#logs: LogEntry[] = [];
	#writeCount = 0;
	#flushCount = 0;
	#closeCount = 0;

	constructor(options?: { level?: AstroLoggerLevel }) {
		const logs: LogEntry[] = [];
		const writeCountRef = { value: 0 };
		super({
			destination: {
				write(event) {
					logs.push({ level: event.level, label: event.label, message: event.message });
					writeCountRef.value++;
				},
				flush() {},
				close() {},
			},
			level: options?.level ?? 'debug',
		});
		// Share the same array/counter references so the getters work
		this.#logs = logs;
		this.#writeCount_ref = writeCountRef;
	}

	// We need a mutable ref object because the destination closure and
	// the getter both need to see the same counter. Private fields can't
	// be accessed from inside the destination closure.
	#writeCount_ref: { value: number } = { value: 0 };

	get logs() {
		return this.#logs;
	}

	override flush() {
		this.#flushCount++;
		super.flush();
	}

	override close() {
		this.#closeCount++;
		super.close();
	}

	writeCount() {
		return this.#writeCount_ref.value;
	}

	flushCount() {
		return this.#flushCount;
	}

	closeCount() {
		return this.#closeCount;
	}
}

/**
 * Creates a mock next() function for middleware testing.
 * The returned function has a `called` property that tracks
 * whether the function has been invoked.
 */
export function createMockNext(response = new Response('OK')) {
	const nextFn = async () => {
		nextFn.called = true;
		return response;
	};
	nextFn.called = false;
	return nextFn;
}
