import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createLogger, createServer, type EnvironmentOptions, type Plugin } from 'vite';
import { extractScripts } from '../../../dist/vite-plugin-environment/rolldown-plugin-astro-scan.js';
import { vitePluginEnvironment } from '../../../dist/vite-plugin-environment/index.js';
import { createBasicSettings, createFixture } from '../test-utils.ts';

function getConfigEnvironmentHook(plugin: Plugin) {
	const hook = plugin.configEnvironment;
	return typeof hook === 'function' ? hook : hook?.handler;
}

function createEnvironmentPlugin(settings: Awaited<ReturnType<typeof createBasicSettings>>) {
	return vitePluginEnvironment({
		command: 'dev',
		settings,
		astroPkgsConfig: {
			optimizeDeps: { include: [], exclude: [] },
			ssr: { noExternal: [], external: [] },
		},
	});
}

async function runColdDependencyScan(files: Record<string, string>) {
	const fixture = await createFixture(files);
	const messages: string[] = [];
	const logger = createLogger('silent');
	logger.warn = (message) => messages.push(message);
	logger.error = (message) => messages.push(message);
	const settings = await createBasicSettings({ root: fixture.path });
	let server: Awaited<ReturnType<typeof createServer>> | undefined;

	try {
		server = await createServer({
			root: fixture.path,
			configFile: false,
			cacheDir: fixture.getPath('node_modules/.vite'),
			customLogger: logger,
			server: { middlewareMode: true },
			plugins: [createEnvironmentPlugin(settings)],
		});
		const optimizer = server.environments.client.depsOptimizer;
		assert.ok(optimizer?.scanProcessing, 'client dependency scan should run');
		await optimizer.scanProcessing;
		return {
			messages,
			dependencies: new Set([
				...Object.keys(optimizer.metadata.discovered),
				...Object.keys(optimizer.metadata.optimized),
			]),
		};
	} finally {
		await server?.close();
		await fixture.rm();
	}
}

function assertScanSucceeded(messages: string[]) {
	assert.equal(
		messages.some((message) => message.includes('Failed to run dependency scan')),
		false,
		messages.join('\n'),
	);
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

		const scripts = extractScripts(raw);
		assert.equal(scripts.inline.length, 1);
		assert.ok(
			scripts.inline[0].content.includes("import { greet } from '../lib/greet'"),
			'should contain the import',
		);
		assert.ok(scripts.inline[0].content.includes('greet()'), 'should contain the function call');
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

		const scripts = extractScripts(raw);
		assert.equal(scripts.inline.length, 1);
		const js = scripts.inline[0].content;
		assert.ok(!js.includes('.widget'), 'should not contain CSS rules');
		assert.ok(!js.includes('const label'), 'should not contain frontmatter code');
		assert.ok(!js.includes('notes.ts'), 'should not contain frontmatter comment text');
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

		const scripts = extractScripts(raw);
		assert.deepEqual(scripts.imports, ['./my-script.ts']);
	});

	it('skips non-JS script types', () => {
		const raw = `<script type="application/ld+json">{"name": "test"}</script>
<script>console.log("hello")</script>`;

		const scripts = extractScripts(raw);
		assert.equal(scripts.inline.length, 1);
		assert.ok(scripts.inline[0].content.includes('console.log'));
	});

	it('preserves supported script loaders', () => {
		const scripts = extractScripts(`<script lang="jsx">const jsx = <div />;</script>
<script lang="tsx">const tsx: unknown = <div />;</script>
<script lang="ts">const ts: string = 'value';</script>`);

		assert.deepEqual(
			scripts.inline.map((script) => script.loader),
			['jsx', 'tsx', 'ts'],
		);
	});

	it('handles files with no frontmatter', () => {
		const scripts = extractScripts(`<div>hello</div>
<script>
  import foo from 'bar';
</script>`);

		assert.equal(scripts.inline.length, 1);
		assert.ok(scripts.inline[0].content.includes("import foo from 'bar'"));
	});

	it('handles files with no scripts', () => {
		const scripts = extractScripts(`---
const x = 1;
---
<div>hello</div>`);

		assert.deepEqual(scripts, { imports: [], inline: [] });
	});
});

describe('rolldownAstroClientScanPlugin', () => {
	it('is included in client optimizeDeps plugins', async () => {
		const settings = await createBasicSettings();
		const plugin = createEnvironmentPlugin(settings);
		const configEnvironment = getConfigEnvironmentHook(plugin);
		assert.ok(configEnvironment, 'configEnvironment hook should exist');

		const result = await configEnvironment.call({} as any, 'client', {} as any, {} as any);
		const plugins = (result as EnvironmentOptions)?.optimizeDeps?.rolldownOptions?.plugins;
		assert.ok(Array.isArray(plugins));
		assert.ok(
			(plugins as Plugin[]).some((scanPlugin) => scanPlugin.name === 'astro:client-dep-scan'),
			'should include the Astro client dependency scan plugin',
		);
	});

	it('completes a cold scan when frontmatter contains a script tag', async () => {
		const result = await runColdDependencyScan({
			'src/pages/index.astro': `---
// emits \`<script src="">\`
---
<style>.widget { color: rebeccapurple; }</style>
<script>import 'html-escaper';</script>`,
		});

		assertScanSucceeded(result.messages);
		assert.ok(result.dependencies.has('html-escaper'));
	});

	it('keeps separate inline script scopes during a cold scan', async () => {
		const result = await runColdDependencyScan({
			'src/pages/index.astro': `<script is:inline>
const duplicate = 1;
console.log(duplicate);
</script>
<script is:inline>
const duplicate = 2;
console.log(duplicate);
</script>`,
		});

		assertScanSucceeded(result.messages);
	});

	it('scans import.meta.glob from scripts with explicit loaders', async () => {
		const result = await runColdDependencyScan({
			'src/pages/index.astro': `<script lang="tsx">
const element: HTMLElement | undefined = undefined;
const modules = import.meta.glob('../modules/*.ts');
console.log(element, modules);
</script>`,
			'src/modules/dependency.ts': `import 'html-escaper';`,
		});

		assertScanSucceeded(result.messages);
		assert.ok(result.dependencies.has('html-escaper'));
	});
});
