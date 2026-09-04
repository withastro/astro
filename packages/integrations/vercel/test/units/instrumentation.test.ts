import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
	createInstrumentationModule,
	findInstrumentationFile,
} from '../../dist/vite-plugin-instrumentation.js';

const projectRoot = new URL('./fixtures/project/', import.meta.url);

describe('instrumentation', () => {
	it('uses a pass-through module when no instrumentation file exists', () => {
		const module = createInstrumentationModule();

		assert.doesNotMatch(module, /opentelemetry/);
		assert.match(module, /return callback\(\)/);
	});

	it('awaits instrumentation registration before the context helper', () => {
		const instrumentationFile = new URL('instrumentation.ts', projectRoot);
		const module = createInstrumentationModule(instrumentationFile);

		assert.equal(
			module.split('\n', 1)[0],
			`import { register } from ${JSON.stringify(fileURLToPath(instrumentationFile))};`,
		);
		assert.match(module, /from '@opentelemetry\/api'/);
		assert.match(module, /await register\(\);/);
		assert.match(module, /propagation\.extract/);
		assert.match(module, /context\.with/);
	});

	it('finds one supported instrumentation file in the root or source directory', () => {
		const srcDir = new URL('source/', projectRoot);
		const rootInstrumentationFile = new URL('instrumentation.ts', projectRoot);
		const sourceInstrumentationFile = new URL('instrumentation.mjs', srcDir);

		assert.equal(
			findInstrumentationFile(
				[projectRoot, srcDir],
				(file) => file.href === rootInstrumentationFile.href,
			)?.href,
			rootInstrumentationFile.href,
		);
		assert.equal(
			findInstrumentationFile(
				[projectRoot, srcDir],
				(file) => file.href === sourceInstrumentationFile.href,
			)?.href,
			sourceInstrumentationFile.href,
		);
	});

	it('rejects multiple instrumentation files', () => {
		const srcDir = new URL('src/', projectRoot);
		const files = new Set([
			new URL('instrumentation.ts', projectRoot).href,
			new URL('instrumentation.mjs', srcDir).href,
		]);

		assert.throws(
			() => findInstrumentationFile([projectRoot, srcDir], (file) => files.has(file.href)),
			/instrumentation\.ts[\s\S]*instrumentation\.mjs/,
		);
	});
});
