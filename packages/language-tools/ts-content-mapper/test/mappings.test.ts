import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SpanMapFeature, SpanMapKind } from '../dist/protocol.js';
import { transform } from '../dist/transform.js';

function transformAstro(content: string, fileName = 'Card.astro') {
	return transform({ content, fileName, projectHandle: 'test' });
}

const COMPONENT = [
	'---',
	'const title = "hi";',
	'---',
	'<div class=unquoted title=\'say "hi"\' onclick="go()">',
	'  {title} <br> <!-- note -->',
	'  <style>.a{color:red}</style>',
	'</div>',
].join('\n');

describe('span mappings', () => {
	it('emits tsx with mappings for a component', () => {
		const result = transformAstro(COMPONENT);

		assert.equal(result.extension, '.tsx');
		assert.ok(result.mappings);
		assert.ok(result.mappings.length > 0);
	});

	it('keeps every verbatim span byte-identical to the original', () => {
		const result = transformAstro(COMPONENT);

		for (const [
			virtualStart,
			virtualLength,
			originalStart,
			originalLength,
			kind,
		] of result.mappings!) {
			if (kind !== SpanMapKind.Verbatim) continue;

			assert.equal(
				virtualLength,
				originalLength,
				'verbatim spans must have equal lengths on both sides',
			);
			assert.equal(
				result.text.slice(virtualStart, virtualStart + virtualLength),
				COMPONENT.slice(originalStart, originalStart + originalLength),
			);
		}
	});

	it('keeps virtual spans ordered, disjoint and in bounds', () => {
		const result = transformAstro(COMPONENT);

		let previousEnd = 0;
		for (const [virtualStart, virtualLength, originalStart, originalLength] of result.mappings!) {
			assert.ok(virtualStart >= previousEnd, 'virtual spans must not overlap');
			assert.ok(virtualStart + virtualLength <= result.text.length);
			assert.ok(originalStart + originalLength <= COMPONENT.length);
			previousEnd = virtualStart + virtualLength;
		}
	});

	it('anchors the generated component export to the top of the source', () => {
		const result = transformAstro(COMPONENT);

		const anchor = result.mappings!.find(
			([, , originalStart, originalLength]) => originalStart === 0 && originalLength === 0,
		);

		assert.ok(anchor, 'expected a zero-length anchor for the generated export');
		assert.equal(anchor[4], SpanMapKind.Atom);
		assert.ok((anchor[5]! & SpanMapFeature.Definition) !== 0);
		assert.equal(
			result.text.slice(anchor[0], anchor[0] + anchor[1]),
			'Card__AstroComponent_',
			'the anchor should cover the generated component identifier',
		);
	});

	it('maps multibyte source text at the correct utf-16 offsets', () => {
		const content = ['---', 'const é = "𝒳";', '---', '<div>{é}</div>'].join('\n');
		const result = transformAstro(content, 'Probe.astro');

		for (const [
			virtualStart,
			virtualLength,
			originalStart,
			originalLength,
			kind,
		] of result.mappings!) {
			if (kind !== SpanMapKind.Verbatim) continue;
			assert.equal(
				result.text.slice(virtualStart, virtualStart + virtualLength),
				content.slice(originalStart, originalStart + originalLength),
			);
		}
	});
});

describe('diagnostics', () => {
	it('reports parse errors against the original source with a code', () => {
		const result = transformAstro('---\nconst a = {\n---\n<div>', 'Broken.astro');

		for (const diagnostic of result.diagnostics ?? []) {
			assert.equal(typeof diagnostic.code, 'number');
			assert.ok(diagnostic.start >= 0);
			assert.ok(diagnostic.start + diagnostic.length <= '---\nconst a = {\n---\n<div>'.length);
		}
	});

	it('always returns mappings, never null', () => {
		const result = transformAstro('');

		assert.ok(Array.isArray(result.mappings));
	});
});
