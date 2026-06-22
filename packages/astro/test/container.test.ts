import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import testAdapter from './test-adapter.ts';
import { type App, type Fixture, loadFixture } from './test-utils.ts';

describe('Container with renderers', () => {
	let fixture: Fixture;
	let app: App;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/container-custom-renderers/', import.meta.url),
			output: 'server',
			adapter: testAdapter(),
			outDir: './dist/container/',
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	it('the endpoint should return the HTML of the React component', async () => {
		const request = new Request('https://example.com/react');
		const response = await app.render(request);
		const html = await response.text();

		assert.match(html, /I am a react button/);
		assert.doesNotMatch(html, /<!DOCTYPE html>/);
	});

	it('the endpoint should return the HTML of the React component, with DOCTYPE when rendered when partial is off', async () => {
		const request = new Request('https://example.com/react-as-page');
		const response = await app.render(request);
		const html = await response.text();

		assert.match(html, /I am a react button/);
		assert.match(html, /<!DOCTYPE html>/);
	});

	it('the endpoint should return the HTML of the Vue component', async () => {
		const request = new Request('https://example.com/vue');
		const response = await app.render(request);
		const html = await response.text();

		assert.match(html, /I am a vue button/);
		assert.doesNotMatch(html, /<!DOCTYPE html>/);
	});

	it('Should render a component with directives', async () => {
		const request = new Request('https://example.com/button-directive');
		const response = await app.render(request);
		const html = await response.text();

		assert.match(html, /Button not rendered/);
		assert.match(html, /I am a react button/);
		assert.doesNotMatch(html, /<!DOCTYPE html>/);
	});
});
