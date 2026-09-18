import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type * as vite from 'vite';
import { extractScripts } from '../../../dist/vite-plugin-environment/rolldown-plugin-astro-scan.js';
import { vitePluginEnvironment } from '../../../dist/vite-plugin-environment/index.js';
import { createBasicSettings } from '../test-utils.ts';

function getConfigEnvironmentHook(plugin: vite.Plugin) {
	const hook = plugin.configEnvironment;
	return typeof hook === 'function' ? hook : hook?.handler;
}

describe('extractScripts', () => {
	it('extracts inline script content from an .astro file', () => {
		const raw = `---
const x = 1;
---
<div>hello</div>
<script>
  import { greet } from '../lib/greet';
  greet();
</script>`;

		const js = extractScripts(raw);
		assert.ok(js.includes("import { greet } from '../lib/greet'"), 'should contain the import');
		assert.ok(js.includes('greet()'), 'should contain the function call');
	});

	it('ignores <script in frontmatter JS comments (#18068)', () => {
		const raw = `---
// emits \`<script src="">\`; see notes.ts
const label = 'hello';
---
<p>{label}</p>

<style>
  .widget { color: rebeccapurple; }
</style>

<script>
  import { greet } from '../lib/greet';
  greet();
</script>`;

		const js = extractScripts(raw);
		// The extracted JS must not contain CSS or frontmatter code
		assert.ok(!js.includes('.widget'), 'should not contain CSS rules');
		assert.ok(!js.includes('const label'), 'should not contain frontmatter code');
		assert.ok(!js.includes('notes.ts'), 'should not contain frontmatter comment text');
		// It should still extract the real script
		assert.ok(
			js.includes("import { greet } from '../lib/greet'"),
			'should contain the real import',
		);
	});

	it('extracts src attribute from external scripts', () => {
		const raw = `---
const x = 1;
---
<script src="./my-script.ts"></script>`;

		const js = extractScripts(raw);
		assert.ok(js.includes('import "./my-script.ts"'), 'should emit import for src script');
	});

	it('skips non-JS script types', () => {
		const raw = `<script type="application/ld+json">{"name": "test"}</script>
<script>console.log("hello")</script>`;

		const js = extractScripts(raw);
		assert.ok(!js.includes('"name"'), 'should not contain ld+json content');
		assert.ok(js.includes('console.log'), 'should contain JS script content');
	});

	it('handles files with no frontmatter', () => {
		const raw = `<div>hello</div>
<script>
  import foo from 'bar';
</script>`;

		const js = extractScripts(raw);
		assert.ok(
			js.includes("import foo from 'bar'"),
			'should extract script from file without frontmatter',
		);
	});

	it('handles files with no scripts', () => {
		const raw = `---
const x = 1;
---
<div>hello</div>`;

		const js = extractScripts(raw);
		assert.equal(js, '', 'should return empty string for file with no scripts');
	});
});

describe('rolldownAstroClientScanPlugin wiring', () => {
	it('client environment includes the scan plugin in optimizeDeps.rolldownOptions.plugins', async () => {
		const settings = await createBasicSettings();
		const plugin = vitePluginEnvironment({
			command: 'dev',
			settings,
			astroPkgsConfig: {
				optimizeDeps: { include: [], exclude: [] },
				ssr: { noExternal: [], external: [] },
			},
		});

		const configEnvironment = getConfigEnvironmentHook(plugin);
		assert.ok(configEnvironment, 'configEnvironment hook should exist');

		const result = await configEnvironment!.call({} as any, 'client', {} as any, {} as any);

		const plugins = (result as vite.EnvironmentOptions)?.optimizeDeps?.rolldownOptions?.plugins;
		assert.ok(plugins, 'client environment should have optimizeDeps.rolldownOptions.plugins');
		assert.ok(Array.isArray(plugins), 'plugins should be an array');

		const scanPlugin = (plugins as vite.Plugin[]).find(
			(p) => (p as vite.Plugin).name === 'astro:client-dep-scan',
		);
		assert.ok(scanPlugin, 'should include the astro:client-dep-scan plugin');
	});
});
