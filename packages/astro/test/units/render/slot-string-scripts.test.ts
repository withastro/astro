import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { chunkToString } from '../../../dist/runtime/server/render/common.js';
import { createRenderInstruction } from '../../../dist/runtime/server/render/instruction.js';
import { markHTMLString } from '../../../dist/runtime/server/escape.js';
import { renderSlots, renderSlotToString } from '../../../dist/runtime/server/render/slot.js';

function createStubResult() {
	return {
		clientDirectives: new Map<string, string>(),
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

const SCRIPT_HTML = '<script type="module" src="/_astro/client-router.js"></script>';

// A slot whose content emits a string, then a position-sensitive <script>
// instruction, then another string. This mirrors what the Astro compiler
// produces for a component that ships a hoisted `<script>` (e.g. `ClientRouter`).
function makeScriptSlot() {
	const scriptInstruction = createRenderInstruction({
		type: 'script',
		id: 'client-router',
		content: SCRIPT_HTML,
	});
	return {
		render(destination: any) {
			destination.write(markHTMLString('<p>before</p>'));
			destination.write(scriptInstruction);
			destination.write(markHTMLString('<p>after</p>'));
		},
	};
}

function makeScriptInstruction(id: string, content: string) {
	return createRenderInstruction({ type: 'script', id, content });
}

function countOccurrences(haystack: string, needle: string) {
	return haystack.split(needle).length - 1;
}

describe('renderSlotToString script handling', () => {
	it('includes <script> content when the slot result is consumed as a plain string', async () => {
		const result = createStubResult();
		const slotString = await renderSlotToString(result as any, makeScriptSlot() as any);

		// Third-party head-management packages (e.g. `astro-capo`) concatenate the
		// slot result into a plain string. `.toString()` must therefore contain the
		// script; otherwise the script is silently dropped and never executes.
		const asString = String(slotString);
		assert.ok(
			asString.includes(SCRIPT_HTML),
			`plain-string slot output should retain the <script>, got: ${asString}`,
		);
		assert.ok(asString.includes('<p>before</p>'), 'content before the script should be present');
		assert.ok(asString.includes('<p>after</p>'), 'content after the script should be present');
	});

	it("renders the script exactly once through Astro's own pipeline (no double render)", async () => {
		const result = createStubResult();
		const slotString = await renderSlotToString(result as any, makeScriptSlot() as any);

		const rendered = chunkToString(result as any, slotString as any).toString();
		const occurrences = countOccurrences(rendered, SCRIPT_HTML);
		assert.equal(occurrences, 1, `expected the script to render once, got ${occurrences}`);
		// Position must be preserved between the surrounding markup.
		assert.ok(
			rendered.indexOf('<p>before</p>') < rendered.indexOf(SCRIPT_HTML) &&
				rendered.indexOf(SCRIPT_HTML) < rendered.indexOf('<p>after</p>'),
			`script should render in its original position, got: ${rendered}`,
		);
	});

	it('retains multiple different scripts within a single slot, in order', async () => {
		// Two distinct scripts must each appear once, at their original positions.
		const scriptA = '<script type="module" src="/_astro/a.js"></script>';
		const scriptB = '<script type="module" src="/_astro/b.js"></script>';
		const slot = {
			render(destination: any) {
				destination.write(makeScriptInstruction('script-a', scriptA));
				destination.write(markHTMLString('<p>between</p>'));
				destination.write(makeScriptInstruction('script-b', scriptB));
			},
		};

		const result = createStubResult();
		const asString = String(await renderSlotToString(result as any, slot as any));

		assert.equal(countOccurrences(asString, scriptA), 1);
		assert.equal(countOccurrences(asString, scriptB), 1);
		assert.ok(
			asString.indexOf(scriptA) < asString.indexOf('<p>between</p>') &&
				asString.indexOf('<p>between</p>') < asString.indexOf(scriptB),
			`scripts should keep their original positions, got: ${asString}`,
		);
	});

	it('preserves every occurrence of a same-id script in the plain-string output', async () => {
		// The fold is occurrence-preserving: the plain-string output keeps both
		// copies, while Astro's own pipeline still dedupes via `renderedScripts`.
		const slot = {
			render(destination: any) {
				destination.write(makeScriptInstruction('client-router', SCRIPT_HTML));
				destination.write(markHTMLString('<p>between</p>'));
				destination.write(makeScriptInstruction('client-router', SCRIPT_HTML));
			},
		};

		const result = createStubResult();
		const slotString = await renderSlotToString(result as any, slot as any);

		assert.equal(
			countOccurrences(String(slotString), SCRIPT_HTML),
			2,
			'plain-string output should preserve each occurrence of the script',
		);
		assert.equal(
			countOccurrences(chunkToString(result as any, slotString as any).toString(), SCRIPT_HTML),
			1,
			'pipeline output should still deduplicate to a single script',
		);
	});

	it('keeps each slot string self-contained when two slots share the same script id', async () => {
		// Each opaque slot string must carry its own copy — a third-party consumer
		// may keep either one — while the pipeline still renders it once overall.
		const makeSlot = () => (_result: any) =>
			({
				render(destination: any) {
					destination.write(makeScriptInstruction('client-router', SCRIPT_HTML));
				},
			}) as any;

		const result = createStubResult();
		const { children } = await renderSlots(
			result as any,
			{
				one: makeSlot(),
				two: makeSlot(),
			} as any,
		);

		assert.equal(countOccurrences(String(children.one), SCRIPT_HTML), 1);
		assert.equal(countOccurrences(String(children.two), SCRIPT_HTML), 1);

		const pipelined =
			chunkToString(result as any, children.one as any).toString() +
			chunkToString(result as any, children.two as any).toString();
		assert.equal(countOccurrences(pipelined, SCRIPT_HTML), 1);
	});

	it('keeps both the inert <template> copy and the live copy of a same-id script', async () => {
		// Scripts inside a <template> are inert and exempt from deduplication (see
		// the `templateDepth` handling in `stringifyChunk`), so the fold must not
		// dedupe by id: the live copy outside the template has to survive.
		const slot = {
			render(destination: any) {
				destination.write(createRenderInstruction({ type: 'template-enter' }));
				destination.write(makeScriptInstruction('client-router', SCRIPT_HTML));
				destination.write(createRenderInstruction({ type: 'template-exit' }));
				destination.write(makeScriptInstruction('client-router', SCRIPT_HTML));
			},
		};

		const result = createStubResult();
		const slotString = await renderSlotToString(result as any, slot as any);

		assert.equal(
			countOccurrences(String(slotString), SCRIPT_HTML),
			2,
			'plain-string output should keep both the inert and the live copy',
		);
		// Template context is lost when replaying through the pipeline:
		// template-enter/exit land in the position-independent `instructions`
		// bucket and are replayed (cancelling out) before the chunk stream, so
		// both scripts replay at `templateDepth` 0 and dedupe to one copy. The
		// plain-string output above is what must keep both copies.
		assert.equal(
			countOccurrences(chunkToString(result as any, slotString as any).toString(), SCRIPT_HTML),
			1,
			'pipeline replay loses template context and dedupes to a single copy',
		);
	});
});
