import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { chunkToString } from '../../../dist/runtime/server/render/common.js';
import { createRenderInstruction } from '../../../dist/runtime/server/render/instruction.js';

function createStubResult() {
	return {
		clientDirectives: new Map([['load', 'console.log("directive")']]),
		_metadata: {
			hasHydrationScript: false,
			rendererSpecificHydrationScripts: new Set<string>(),
			hasRenderedHead: false,
			renderedScripts: new Set<string>(),
			hasDirectives: new Set<string>(),
			hasRenderedServerIslandRuntime: false,
			headInTree: false,
			extraHead: [],
			extraStyleHashes: [],
			extraScriptHashes: [],
			propagators: new Set(),
			templateDepth: 0,
		},
	};
}

describe('inert context dedup behavior', () => {
	it('does not consume directive or hydration dedup inside templates', () => {
		const result = createStubResult();
		result._metadata.templateDepth = 1;

		const instruction = createRenderInstruction({
			type: 'directive',
			hydration: {
				directive: 'load',
				value: '',
				componentUrl: '',
				componentExport: { value: '' },
			},
		});

		const inertOutput = chunkToString(result as any, instruction).toString();
		assert.match(inertOutput, /<script>/);
		assert.equal(result._metadata.hasHydrationScript, false);
		assert.equal(result._metadata.hasDirectives.has('load'), false);

		result._metadata.templateDepth = 0;
		const executableOutput = chunkToString(result as any, instruction).toString();
		assert.match(executableOutput, /<script>/);
		assert.equal(result._metadata.hasHydrationScript, true);
		assert.equal(result._metadata.hasDirectives.has('load'), true);
	});

	it('does not emit inert directive scripts when already deduplicated', () => {
		const result = createStubResult();
		const instruction = createRenderInstruction({
			type: 'directive',
			hydration: {
				directive: 'load',
				value: '',
				componentUrl: '',
				componentExport: { value: '' },
			},
		});

		result._metadata.hasHydrationScript = true;
		result._metadata.hasDirectives.add('load');
		result._metadata.templateDepth = 1;

		const inertOutput = chunkToString(result as any, instruction);
		assert.equal(inertOutput, '');
	});

	it('does not consume renderer hydration dedup inside templates', () => {
		const result = createStubResult();
		const rendererInstruction = createRenderInstruction({
			type: 'renderer-hydration-script',
			rendererName: 'react',
			render: () => '<script>window.__react = true;</script>',
		});

		result._metadata.templateDepth = 1;
		const inertOutput = chunkToString(result as any, rendererInstruction).toString();
		assert.match(inertOutput, /__react/);
		assert.equal(result._metadata.rendererSpecificHydrationScripts.has('react'), false);

		result._metadata.templateDepth = 0;
		const executableOutput = chunkToString(result as any, rendererInstruction).toString();
		assert.match(executableOutput, /__react/);
		assert.equal(result._metadata.rendererSpecificHydrationScripts.has('react'), true);
	});

	it('does not consume server-island runtime dedup inside templates', () => {
		const result = createStubResult();
		const instruction = createRenderInstruction({ type: 'server-island-runtime' });

		result._metadata.templateDepth = 1;
		const inertOutput = chunkToString(result as any, instruction).toString();
		assert.match(inertOutput, /replaceServerIsland/);
		assert.equal(result._metadata.hasRenderedServerIslandRuntime, false);

		result._metadata.templateDepth = 0;
		const executableOutput = chunkToString(result as any, instruction).toString();
		assert.match(executableOutput, /replaceServerIsland/);
		assert.equal(result._metadata.hasRenderedServerIslandRuntime, true);
	});
});
