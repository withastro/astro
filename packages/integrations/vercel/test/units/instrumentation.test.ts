import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	createInstrumentationModule,
	findInstrumentationFile,
} from '../../dist/vite-plugin-instrumentation.js';

describe('instrumentation', () => {
	it('uses a pass-through module when no instrumentation file exists', () => {
		const module = createInstrumentationModule();

		assert.doesNotMatch(module, /opentelemetry/);
		assert.match(module, /return callback\(\)/);
	});

	it('awaits instrumentation registration before the context helper', () => {
		const instrumentationFile = new URL('file:///project/instrumentation.ts');
		const module = createInstrumentationModule(instrumentationFile);

		assert.match(module, /^import \{ register \} from "\/project\/instrumentation\.ts";/);
		assert.match(module, /from '@opentelemetry\/api'/);
		assert.match(module, /await register\(\);/);
		assert.match(module, /propagation\.extract/);
		assert.match(module, /context\.with/);
	});

	it('finds one supported instrumentation file in the root or source directory', () => {
		const root = new URL('file:///project/');
		const srcDir = new URL('source/', root);
		const rootInstrumentationFile = new URL('instrumentation.ts', root);
		const sourceInstrumentationFile = new URL('instrumentation.mjs', srcDir);

		assert.equal(
			findInstrumentationFile([root, srcDir], (file) => file.href === rootInstrumentationFile.href)
				?.href,
			rootInstrumentationFile.href,
		);
		assert.equal(
			findInstrumentationFile(
				[root, srcDir],
				(file) => file.href === sourceInstrumentationFile.href,
			)?.href,
			sourceInstrumentationFile.href,
		);
	});

	it('rejects multiple instrumentation files', () => {
		const root = new URL('file:///project/');
		const srcDir = new URL('src/', root);
		const files = new Set([
			new URL('instrumentation.ts', root).href,
			new URL('instrumentation.mjs', srcDir).href,
		]);

		assert.throws(
			() => findInstrumentationFile([root, srcDir], (file) => files.has(file.href)),
			/instrumentation\.ts[\s\S]*instrumentation\.mjs/,
		);
	});
});
