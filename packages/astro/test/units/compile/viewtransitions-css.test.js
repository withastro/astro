import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { resolveConfig } from 'vite';
import { compile } from '../../../dist/core/compile/index.js';

describe('astro/src/core/compile', () => {
	describe('ViewTransitions CSS import', () => {
		it('does not include viewtransitions.css when only server:defer is used', async () => {
			const result = await compile({
				astroConfig: {
					root: pathToFileURL('/'),
					experimental: {},
				},
				viteConfig: await resolveConfig({ configFile: false }, 'serve'),
				filename: '/src/pages/index.astro',
				source: `---
import Island from '../components/Island.astro';
---
<html>
<head><title>Test</title></head>
<body>
	<Island server:defer />
</body>
</html>
`,
			});

			assert.equal(
				result.code.includes('viewtransitions.css'),
				false,
				'should not import viewtransitions.css when only server:defer is used',
			);
		});

		it('includes viewtransitions.css when transition:name is used', async () => {
			const result = await compile({
				astroConfig: {
					root: pathToFileURL('/'),
					experimental: {},
				},
				viteConfig: await resolveConfig({ configFile: false }, 'serve'),
				filename: '/src/pages/index.astro',
				source: `---
---
<html>
<head><title>Test</title></head>
<body>
	<div transition:name="hero">Hello</div>
</body>
</html>
`,
			});

			assert.equal(
				result.code.includes('viewtransitions.css'),
				true,
				'should import viewtransitions.css when transition:name is used',
			);
		});

		it('includes viewtransitions.css when transition:animate is used', async () => {
			const result = await compile({
				astroConfig: {
					root: pathToFileURL('/'),
					experimental: {},
				},
				viteConfig: await resolveConfig({ configFile: false }, 'serve'),
				filename: '/src/pages/index.astro',
				source: `---
---
<html>
<head><title>Test</title></head>
<body>
	<div transition:animate="slide">Hello</div>
</body>
</html>
`,
			});

			assert.equal(
				result.code.includes('viewtransitions.css'),
				true,
				'should import viewtransitions.css when transition:animate is used',
			);
		});

		it('includes viewtransitions.css when server:defer and transition:name are both used', async () => {
			const result = await compile({
				astroConfig: {
					root: pathToFileURL('/'),
					experimental: {},
				},
				viteConfig: await resolveConfig({ configFile: false }, 'serve'),
				filename: '/src/pages/index.astro',
				source: `---
import Island from '../components/Island.astro';
---
<html>
<head><title>Test</title></head>
<body>
	<Island server:defer />
	<div transition:name="hero">Hello</div>
</body>
</html>
`,
			});

			assert.equal(
				result.code.includes('viewtransitions.css'),
				true,
				'should import viewtransitions.css when transition directives are used alongside server:defer',
			);
		});
	});
});
