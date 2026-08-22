import assert from 'node:assert';
import { describe, it } from 'node:test';
import { astro2tsx } from '../../dist/core/astro2tsx.js';

describe('astro2tsx - virtual code mappings', () => {
	it('produces ascending, in-bounds, non-overlapping runs', () => {
		const input = [
			'---',
			'const title = "hi";',
			'---',
			'<div class=unquoted title=\'say "hi"\' onclick="go()">',
			'  {title} <br> <!-- note -->',
			'  <style>.a{color:red}</style>',
			'</div>',
		].join('\n');

		const { virtualCode } = astro2tsx(input, 'Card.astro');
		const generated = virtualCode.snapshot.getText(0, virtualCode.snapshot.getLength());
		const [mapping] = virtualCode.mappings;

		assert.ok(mapping.generatedOffsets.length > 0);
		for (let i = 0; i < mapping.generatedOffsets.length; i++) {
			const gen = mapping.generatedOffsets[i];
			const src = mapping.sourceOffsets[i];
			const len = mapping.lengths[i];
			assert.ok(len > 0, `run ${i} is empty`);
			assert.ok(gen + len <= generated.length, `run ${i} runs past the generated code`);
			assert.ok(src + len <= input.length, `run ${i} runs past the source`);
			if (i > 0) {
				const previousEnd = mapping.generatedOffsets[i - 1] + mapping.lengths[i - 1];
				assert.ok(gen >= previousEnd, `run ${i} overlaps its predecessor`);
			}
		}
	});

	it('resolves attribute values to their own source text', () => {
		const input = '<div class=unquoted onclick="go()"></div>';
		const { virtualCode, ranges } = astro2tsx(input, 'Card.astro');
		const [mapping] = virtualCode.mappings;

		const sourceOffsetOf = (generatedOffset: number) => {
			for (let i = 0; i < mapping.generatedOffsets.length; i++) {
				const delta = generatedOffset - mapping.generatedOffsets[i];
				if (delta >= 0 && delta < mapping.lengths[i]) return mapping.sourceOffsets[i] + delta;
			}
			return null;
		};

		const generated = virtualCode.snapshot.getText(0, virtualCode.snapshot.getLength());
		for (const needle of ['unquoted', 'go()']) {
			const source = sourceOffsetOf(generated.indexOf(needle));
			assert.notEqual(source, null, `${needle} is unmapped`);
			assert.equal(input.slice(source, source + needle.length), needle);
		}

		// Extracted tags carry source ranges the embedded documents rely on.
		assert.equal(
			input.slice(ranges.scripts[0].position.start, ranges.scripts[0].position.end),
			ranges.scripts[0].content,
		);
	});
});
