import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderTemplate } from '../../../dist/runtime/server/index.js';
import { chunkToString } from '../../../dist/runtime/server/render/common.js';
import { createRenderInstruction } from '../../../dist/runtime/server/render/instruction.js';

function createStubResult() {
	return {
		_metadata: {
			renderedScripts: new Set<string>(),
			templateDepth: 0,
		},
	};
}

function collectRender(templateResult: ReturnType<typeof renderTemplate>): Promise<string> {
	const result = createStubResult();
	return new Promise((resolve, reject) => {
		let str = '';
		const destination = {
			write(chunk: any) {
				str += chunkToString(result as any, chunk);
			},
		};
		try {
			const renderResult = templateResult.render(destination);
			if (renderResult && typeof renderResult.then === 'function') {
				renderResult.then(() => resolve(str), reject);
			} else {
				resolve(str);
			}
		} catch (e) {
			reject(e);
		}
	});
}

describe('script instruction whitespace stripping', () => {
	it('strips trailing whitespace from html part before a script instruction', async () => {
		const scriptInstruction = createRenderInstruction({
			type: 'script',
			id: 'test-script',
			content: '',
		});
		// Simulates the compiler output: `</a> ${renderScript(...)}`
		const result = renderTemplate`</a> ${scriptInstruction}`;
		const output = await collectRender(result);
		assert.equal(output, '</a>');
	});

	it('strips leading whitespace from html part after a script instruction', async () => {
		const scriptInstruction = createRenderInstruction({
			type: 'script',
			id: 'test-script',
			content: '',
		});
		// Simulates: `${renderScript(...)} .rest`
		const result = renderTemplate`${scriptInstruction} .rest`;
		const output = await collectRender(result);
		assert.equal(output, '.rest');
	});

	it('strips whitespace on both sides of a script instruction', async () => {
		const scriptInstruction = createRenderInstruction({
			type: 'script',
			id: 'test-script',
			content: '',
		});
		// Simulates: `</a> ${renderScript(...)} .`
		const result = renderTemplate`</a> ${scriptInstruction} .`;
		const output = await collectRender(result);
		assert.equal(output, '</a>.');
	});

	it('preserves non-whitespace content adjacent to script instructions', async () => {
		const scriptInstruction = createRenderInstruction({
			type: 'script',
			id: 'test-script',
			content: '<script type="module">console.log("hi")</script>',
		});
		const result = renderTemplate`</a> ${scriptInstruction} .`;
		const output = await collectRender(result);
		assert.equal(output, '</a><script type="module">console.log("hi")</script>.');
	});

	it('does not strip whitespace around non-script expressions', async () => {
		const result = renderTemplate`</a> ${'text'} .`;
		const output = await collectRender(result);
		assert.equal(output, '</a> text .');
	});
});
