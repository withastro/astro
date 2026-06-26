import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { astro2tsx } from '../../dist/astro2tsx.js';

describe('astro2tsx', () => {
	it('excludes script tag content from TSX output', () => {
		const input = `---
import { Utils } from "../utils/utilClass";
---
<html>
	<body>
		<h1>{new Utils().toUpper("Astro")}</h1>
	</body>
	<script>
		import {STR} from "../utils/utilClass"
		console.log(STR)
	</script>
</html>`;

		const { virtualFile } = astro2tsx(input, 'test.astro');
		const code = virtualFile.snapshot.getText(0, virtualFile.snapshot.getLength());

		// Frontmatter import should be preserved
		assert.ok(code.includes('Utils'), 'Should preserve frontmatter imports');

		// Script tag content should be stripped (not wrapped in arrow functions)
		assert.ok(
			!code.includes('import {STR}'),
			'Should not include script tag imports in TSX output',
		);
		assert.ok(!code.includes('{() => {'), 'Should not wrap script content in arrow functions');
	});

	it('excludes style tag content from TSX output', () => {
		const input = `---
---
<html>
	<head>
		<style>
			h1 { color: red; }
		</style>
	</head>
	<body><h1>Hello</h1></body>
</html>`;

		const { virtualFile } = astro2tsx(input, 'test.astro');
		const code = virtualFile.snapshot.getText(0, virtualFile.snapshot.getLength());

		assert.ok(!code.includes('color: red'), 'Should not include style content in TSX output');
	});
});
