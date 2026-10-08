import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { generateEdgeMiddleware } from '../../dist/serverless/middleware.js';
import { SpyLogger } from '../test-utils.ts';

describe('generateEdgeMiddleware', () => {
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
