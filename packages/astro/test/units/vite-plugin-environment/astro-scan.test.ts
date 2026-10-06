import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createLogger, createServer, type EnvironmentOptions, type Plugin } from 'vite';
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

	it('completes a cold scan when a template expression contains a script tag', async () => {
		const result = await runColdDependencyScan({
			'src/pages/index.astro': `<p>{'<script src="">'}</p>
<style>/* \` */ p { color: red; }</style>
<script>import 'html-escaper';</script>`,
		});

		assertScanSucceeded(result.messages);
		assert.ok(result.dependencies.has('html-escaper'));
	});

	it('keeps separate script scopes during a cold scan', async () => {
		const result = await runColdDependencyScan({
			'src/pages/index.astro': `<script>
import escape from 'html-escaper';
const duplicate = 1;
console.log(duplicate, escape);
</script>
<script>
import escape from 'html-escaper';
const duplicate = 2;
console.log(duplicate, escape);
</script>`,
		});

		assertScanSucceeded(result.messages);
		assert.ok(result.dependencies.has('html-escaper'));
	});

	it('scans external scripts and import.meta.glob', async () => {
		const result = await runColdDependencyScan({
			'src/pages/index.astro': `<script src="../lib/external.ts"></script>
<script>
const element: HTMLElement | null = null;
const modules = import.meta.glob('../modules/*.ts');
console.log(element, modules);
</script>`,
			'src/lib/external.ts': `import 'clsx';`,
			'src/modules/dependency.ts': `import 'html-escaper';`,
		});

		assertScanSucceeded(result.messages);
		assert.ok(result.dependencies.has('clsx'));
		assert.ok(result.dependencies.has('html-escaper'));
	});

	it('keeps imports that TypeScript would remove as unused', async () => {
		const result = await runColdDependencyScan({
			'src/pages/index.astro': `<script>import { clsx } from 'clsx';</script>`,
		});

		assertScanSucceeded(result.messages);
		assert.ok(result.dependencies.has('clsx'));
	});

	it('skips scripts that Astro renders inline', async () => {
		const result = await runColdDependencyScan({
			'src/pages/index.astro': `<script is:inline>import 'clsx';</script>
<script lang="tsx">import 'html-escaper';</script>`,
		});

		assertScanSucceeded(result.messages);
		assert.equal(result.dependencies.has('clsx'), false);
		assert.equal(result.dependencies.has('html-escaper'), false);
	});
});
