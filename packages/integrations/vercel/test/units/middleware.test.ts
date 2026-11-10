import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { generateEdgeMiddleware } from '../../dist/serverless/middleware.js';
import { SpyLogger } from '../test-utils.ts';

// Rolldown's runtime chunk in a server build where a dependency calls `require()` (sharp does).
const rolldownRuntimeChunk = `import { createRequire } from "node:module";
var __esmMin = (fn, res) => () => (fn && (res = fn(fn = 0)), res);
var __require = /* #__PURE__ */ (() => createRequire(import.meta.url))();
export { __require as i, __esmMin as n };
`;

/**
 * Creates a project root with a stubbed `astro/middleware`, Rolldown's runtime chunk and the
 * given middleware module, then builds the edge middleware from it.
 */
async function generateFromRuntimeChunk(middleware: string) {
	const root = await fs.mkdtemp(join(tmpdir(), 'astro-vercel-edge-middleware-'));
	const astroStub = join(root, 'node_modules', 'astro');
	await fs.mkdir(astroStub, { recursive: true });
	await fs.writeFile(
		join(astroStub, 'package.json'),
		JSON.stringify({ name: 'astro', exports: { './middleware': './middleware.js' } }),
	);
	await fs.writeFile(
		join(astroStub, 'middleware.js'),
		'export function createContext() {}\nexport function trySerializeLocals() {}\n',
	);
	await fs.writeFile(join(root, 'rolldown-runtime.mjs'), rolldownRuntimeChunk);
	const middlewarePath = join(root, 'middleware.mjs');
	await fs.writeFile(middlewarePath, middleware);
	const outPath = join(root, 'out', 'middleware.mjs');
	const logger = new SpyLogger();
	const result = generateEdgeMiddleware(
		pathToFileURL(middlewarePath),
		pathToFileURL(root + sep),
		pathToFileURL(join(root, 'vercel-edge-middleware')),
		pathToFileURL(outPath),
		'secret',
		logger.forkIntegrationLogger('test'),
	);
	return { root, outPath, result };
}

describe('generateEdgeMiddleware', () => {
	it("bundles middleware that imports Rolldown's runtime chunk without node:module", async () => {
		const { root, outPath, result } = await generateFromRuntimeChunk(
			`import { n as __esmMin } from './rolldown-runtime.mjs';
var init = __esmMin(() => {});
export function onRequest(_context, next) {
	init();
	return next();
}
`,
		);
		try {
			await result;
			const bundled = await fs.readFile(outPath, 'utf-8');
			assert.equal(bundled.includes('node:module'), false);
			assert.equal(bundled.includes('createRequire'), false);
		} finally {
			await fs.rm(root, { recursive: true, force: true });
		}
	});

	it("rejects middleware that calls Rolldown's require helper", async () => {
		const { root, result } = await generateFromRuntimeChunk(
			`import { i as __require } from './rolldown-runtime.mjs';
export function onRequest(_context, next) {
	__require('node:fs');
	return next();
}
`,
		);
		try {
			await assert.rejects(result, /Node\.js built-ins in edge functions: node:module/);
		} finally {
			await fs.rm(root, { recursive: true, force: true });
		}
	});

	it('logs a hint when the middleware imports a Node.js built-in', async () => {
		const root = await fs.mkdtemp(join(tmpdir(), 'astro-vercel-edge-middleware-'));
		try {
			// Stub `astro/middleware` so the generated entry resolves without the
			// real integration installed in the temporary directory.
			const astroStub = join(root, 'node_modules', 'astro');
			await fs.mkdir(astroStub, { recursive: true });
			await fs.writeFile(
				join(astroStub, 'package.json'),
				JSON.stringify({ name: 'astro', exports: { './middleware': './middleware.js' } }),
			);
			await fs.writeFile(
				join(astroStub, 'middleware.js'),
				'export function createContext() {}\nexport function trySerializeLocals() {}\n',
			);

			const middlewarePath = join(root, 'middleware.js');
			await fs.writeFile(
				middlewarePath,
				`import { readFile } from 'node:fs/promises';

export function onRequest(_context, next) {
	void readFile;
	return next();
}
`,
			);

			const logger = new SpyLogger();

			await assert.rejects(
				() =>
					generateEdgeMiddleware(
						pathToFileURL(middlewarePath),
						pathToFileURL(root + sep),
						pathToFileURL(join(root, 'vercel-edge-middleware')),
						pathToFileURL(join(root, 'middleware.mjs')),
						'secret',
						logger.forkIntegrationLogger('test'),
					),
				/Node\.js built-ins/,
			);

			assert.ok(
				logger.logs.some(
					(log) => log.level === 'error' && log.message.includes('Node.js built-ins'),
				),
			);
		} finally {
			await fs.rm(root, { recursive: true, force: true });
		}
	});
});
