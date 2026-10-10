import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { RESOLVED_SERVER_VIRTUAL_MODULE_ID } from '../../../dist/env/constants.js';
import { astroEnv } from '../../../dist/env/vite-plugin-env.js';

function loadServerModule(loadedEnv: Record<string, string>) {
	const plugin: any = astroEnv({
		settings: { config: { env: { schema: {}, validateSecrets: false } } } as any,
		sync: false,
		envLoader: { get: () => loadedEnv, getPrivateEnv: () => ({}) },
	});
	plugin.config({}, { command: 'serve' });
	return plugin.load.handler.call(
		{ environment: { name: 'ssr' } },
		RESOLVED_SERVER_VIRTUAL_MODULE_ID,
	).code as string;
}

describe('astro:env/server virtual module', () => {
	it('inlines env values containing `$` replacement patterns verbatim in dev', () => {
		const loadedEnv = { FOO: 'a$`b', BAR: "c$&d$'e$$f" };
		const code = loadServerModule(loadedEnv);
		assert.ok(code.includes(`return (${JSON.stringify(loadedEnv)})[key];`));
	});
});
