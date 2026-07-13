import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { chunkToString } from '../../../dist/runtime/server/render/common.js';
import { createRenderInstruction } from '../../../dist/runtime/server/render/instruction.js';
import { markHTMLString } from '../../../dist/runtime/server/escape.js';
import { renderSlotToString } from '../../../dist/runtime/server/render/slot.js';

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
		const occurrences = rendered.split(SCRIPT_HTML).length - 1;
		assert.equal(occurrences, 1, `expected the script to render once, got ${occurrences}`);
		// Position must be preserved between the surrounding markup.
		assert.ok(
			rendered.indexOf('<p>before</p>') <
				rendered.indexOf(SCRIPT_HTML) &&
				rendered.indexOf(SCRIPT_HTML) < rendered.indexOf('<p>after</p>'),
			`script should render in its original position, got: ${rendered}`,
		);
	});
});
