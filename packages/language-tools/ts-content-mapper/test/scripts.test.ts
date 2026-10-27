import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { transform } from '../dist/transform.js';

const VERBATIM = 0;

function transformAstro(content: string) {
	return transform({ content, fileName: 'Card.astro', projectHandle: 'test' });
}

describe('supplemental scripts', () => {
	it('emits processed and browser module scripts as virtual modules', () => {
		const processed = 'const answer: number = 42;';
		const browserModule = 'console.log(answer);';
		const content = [
			`<script>${processed}</script>`,
			`<script type="module">${browserModule}</script>`,
		].join('\n');
		const result = transformAstro(content);

		assert.deepEqual(
			result.supplemental?.map(({ text, extension }) => ({ text, extension })),
			[
				{ text: processed, extension: '.mts' },
				{ text: browserModule, extension: '.mjs' },
			],
		);
	});

	it('maps script contents verbatim to their utf-16 source ranges', () => {
		const script = 'const message = "𝒳";';
		const content = `<script>${script}</script>`;
		const result = transformAstro(content);
		const supplemental = result.supplemental?.[0];

		assert.ok(supplemental);
		assert.deepEqual(supplemental.mappings, [[0, script.length, 8, script.length, VERBATIM]]);
		assert.equal(
			content.slice(
				supplemental.mappings[0][2],
				supplemental.mappings[0][2] + supplemental.mappings[0][3],
			),
			supplemental.text,
		);
	});

	it('merges inline, event attribute, and unknown scripts into one module', () => {
		const inline = 'first()';
		const event = 'second()';
		const unknown = 'third()';
		const content = [
			`<script is:inline>${inline}</script>`,
			`<button onclick="${event}"></button>`,
			`<script type={kind}>${unknown}</script>`,
		].join('\n');
		const supplemental = transformAstro(content).supplemental?.[0];

		assert.ok(supplemental);
		assert.equal(supplemental.extension, '.mjs');
		assert.equal(supplemental.text, `${inline};${event};${unknown};`);
		assert.deepEqual(supplemental.mappings, [
			[0, inline.length, content.indexOf(inline), inline.length, VERBATIM],
			[inline.length + 1, event.length, content.indexOf(event), event.length, VERBATIM],
			[
				inline.length + event.length + 2,
				unknown.length,
				content.indexOf(unknown),
				unknown.length,
				VERBATIM,
			],
		]);
	});

	it('does not emit data or raw scripts', () => {
		const content = [
			'<script type="application/json">{"answer":42}</script>',
			'<script is:raw>not necessarily javascript</script>',
		].join('\n');

		assert.deepEqual(transformAstro(content).supplemental, []);
	});
});
