import { EventEmitter } from 'node:events';
import realFS from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createFixture as _createFixture } from 'fs-fixture';
import type { FileTree } from 'fs-fixture';
import httpMocks from 'node-mocks-http';
import { getDefaultClientDirectives } from '../../dist/core/client-directive/index.js';
import { resolveConfig } from '../../dist/core/config/index.js';
import { createBaseSettings } from '../../dist/core/config/settings.js';
import { createContainer } from '../../dist/core/dev/container.js';
import type { Container } from '../../dist/core/dev/container.js';
import { AstroIntegrationLogger, Logger } from '../../dist/core/logger/core.js';
import type { LogOptions } from '../../dist/core/logger/core.js';
import { nodeLogDestination } from '../../dist/core/logger/node.js';
import { Pipeline } from '../../dist/core/render/index.js';
import type { HeadElements } from '../../dist/core/base-pipeline.js';
import { RouteCache } from '../../dist/core/render/route-cache.js';
import type { SSRManifest, SSRManifestI18n } from '../../dist/core/app/types.js';
import type { AstroInlineConfig } from '../../dist/types/public/config.js';
import type { SSRLoadedRenderer } from '../../dist/types/public/internal.js';
import type { AstroMiddlewareInstance, MiddlewareNext } from '../../dist/types/public/common.js';

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

export function createRequestAndResponse(reqOptions: httpMocks.RequestOptions = {}) {
	const req = httpMocks.createRequest(reqOptions);
	req.headers.host ||= 'localhost';

	const res = httpMocks.createResponse({
		eventEmitter: EventEmitter,
		req,
	});

	const done = toPromise(res);

	const text = async () => {
		const chunks = await done;
		return buffersToString(chunks);
	};

	const json = async () => {
		const raw = await text();
		return JSON.parse(raw);
	};

	return { req, res, done, json, text };
}

function toPromise(res: httpMocks.MockResponse<any>): Promise<Buffer[]> {
	return new Promise((resolve) => {
		const write = res.write.bind(res);
		res.write = function (data: any, encoding?: any) {
			if (ArrayBuffer.isView(data) && !Buffer.isBuffer(data)) {
				data = Buffer.from(data.buffer);
			}
			if (typeof data === 'string') {
				data = Buffer.from(data);
			}
			return write(data, encoding);
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

export interface BasicPipelineOptions {
	logger?: InstanceType<typeof Logger>;
	manifest?: Partial<SSRManifest>;
	mode?: 'development' | 'production';
	renderers?: SSRLoadedRenderer[];
	resolve?: (s: string) => Promise<string>;
	streaming?: boolean;
	adapterName?: string;
	clientDirectives?: Map<string, string>;
	inlinedScripts?: Map<string, string>;
	compressHTML?: boolean;
	i18n?: SSRManifestI18n;
	middleware?: () => Promise<AstroMiddlewareInstance> | AstroMiddlewareInstance;
	routeCache?: RouteCache;
	logging?: InstanceType<typeof Logger>;
	site?: URL;
}

/**
 * Concrete Pipeline subclass for unit tests.
 * Implements the abstract methods with minimal no-op stubs.
 */
export class TestPipeline extends Pipeline {
	headElements(): HeadElements {
		return { scripts: new Set(), styles: new Set(), links: new Set() };
	}
	componentMetadata() {}
	async tryRewrite(): Promise<never> {
		throw new Error('tryRewrite not implemented in TestPipeline');
	}
	async getComponentByRoute(): Promise<never> {
		throw new Error('getComponentByRoute not implemented in TestPipeline');
	}
	getName() {
		return 'TestPipeline';
	}
}

export function createBasicPipeline(options: BasicPipelineOptions = {}): TestPipeline {
	const mode = options.mode ?? 'development';
	const manifest: SSRManifest = {
		rootDir: new URL(import.meta.url),
		experimentalQueuedRendering: { enabled: true },
		...options.manifest,
	} as SSRManifest;
	return new TestPipeline(
		options.logger ?? defaultLogger,
		manifest,
		options.mode ?? 'development',
		options.renderers ?? [],
		options.resolve ?? ((s) => Promise.resolve(s)),
		options.streaming ?? true,
		options.adapterName,
		options.clientDirectives ?? getDefaultClientDirectives(),
		options.inlinedScripts ?? new Map(),
		options.compressHTML,
		options.i18n,
		options.middleware,
		options.routeCache ?? new RouteCache(options.logging ?? defaultLogger, mode),
		options.site,
	);
}

export async function createBasicSettings(inlineConfig: AstroInlineConfig = {}) {
	if (!inlineConfig.root) {
		inlineConfig.root = fileURLToPath(new URL('.', import.meta.url));
	}
	const { astroConfig } = await resolveConfig(inlineConfig, 'dev');
	return createBaseSettings(astroConfig, inlineConfig.logLevel);
}

export interface RunInContainerOptions {
	fs?: typeof realFS;
	inlineConfig?: AstroInlineConfig;
	logging?: LogOptions;
}

export async function runInContainer(
	options: RunInContainerOptions = {},
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

export class SpyLogger {
	#logs: Array<{ type: string; label: string | null; message: string }> = [];

	get logs() {
		return this.#logs;
	}

	debug(label: string | null, ...messages: string[]) {
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
 * Creates a mock `MiddlewareNext` function for testing middleware handlers.
 *
 * The returned function satisfies the `MiddlewareNext` interface and returns
 * the given `response` when called. It also exposes a `called` boolean that
 * starts as `false` and flips to `true` the first time the function is invoked,
 * so tests can assert whether middleware passed control to `next()` or
 * short-circuited by returning a response directly.
 *
 * @example
 * const next = createMockNext(new Response('Page content'));
 * await myMiddleware(context, next);
 * assert.ok(next.called);          // middleware called next()
 * assert.equal(next.called, false); // middleware short-circuited
 */
export function createMockNext(
	response = new Response('OK'),
): MiddlewareNext & { called: boolean } {
	const nextFn = Object.assign(
		async () => {
			nextFn.called = true;
			return response;
		},
		{ called: false },
	);
	return nextFn;
}
