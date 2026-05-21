import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { astro2tsx } from '../../dist/astro2tsx.js';

describe('astro2tsx', () => {
	it('does not include script tag content in TSX output', () => {
		const input = `---
import { Utils } from "../utils/utilClass";
---

<html>
  <body>
    <h1>{new Utils().toUpper("Astro")}</h1>
  </body>
</html>

<script>
  import {STR} from "../utils/utilClass"
  console.log(STR)
</script>`;

		const result = astro2tsx(input, 'test.astro');
		const tsxCode = result.virtualFile.snapshot.getText(0, result.virtualFile.snapshot.getLength());

		// The frontmatter import should be at the module level
		assert.ok(
			tsxCode.includes('import { Utils } from "../utils/utilClass"'),
			'Should include frontmatter import at module level',
		);

		// Script tag content should NOT be in the TSX output (includeScripts: false)
		assert.ok(
			!tsxCode.includes('{() => {'),
			'Should not contain arrow function wrapper from script tags',
		);
		assert.ok(!tsxCode.includes('console.log(STR)'), 'Should not contain script tag body content');
	});

	it('preserves template expressions in TSX output', () => {
		const input = `---
---

<html>
  <body>
    <h1>{Astro.locals.utils.toUpper("Astro")}</h1>
  </body>
</html>`;

		const result = astro2tsx(input, 'index.astro');
		const tsxCode = result.virtualFile.snapshot.getText(0, result.virtualFile.snapshot.getLength());

		// Template expressions should still be present
		assert.ok(
			tsxCode.includes('Astro.locals.utils.toUpper("Astro")'),
			'Should preserve Astro.locals template expressions',
		);
	});
});
