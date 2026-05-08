import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

// Regression test for https://github.com/withastro/astro/issues/16291
//
// Adapters like `@astrojs/cloudflare` load prerendered page modules in a
// dedicated `prerender` Vite environment. The `astro:head-metadata` dev
// plugin used to track only the `ssr` environment, so `containsHead` /
// `propagation` were never computed for those modules and `maybeRenderHead()`
// could fire inside an unrelated component's `<template>` element, trapping
// the hoisted `<style data-vite-dev-id>` blocks that Vite injects in dev.
// Because `<template>` content is inert per the HTML spec, any style block
// trapped inside is non-functional and the page renders unstyled.
//
// The fixture mirrors the Starlight `<ThemeProvider>` shape from the bug
// report (a `<template id="theme-icons">` inside `<head>` holding Icon
// components with their own scoped CSS) and the integration mirrors what
// `@astrojs/cloudflare` does in dev (registers a `prerender` Vite
// environment and flips on the core dev-prerender middleware).
describe('Head propagation across ssr and prerender envs in dev', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/head-propagation-prerender-env/',
			outDir: './dist/head-propagation-prerender-env/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer?.stop();
	});

	it('does not trap hoisted dev styles inside a <template> on prerendered routes', async () => {
		const res = await fixture.fetch('/');
		const html = await res.text();

		const templateOpen = html.indexOf('<template');
		const templateClose = html.indexOf('</template>');
		assert.ok(
			templateOpen !== -1 && templateClose !== -1 && templateOpen < templateClose,
			'Expected the fixture to render a <template> element',
		);

		// The regression is an inline `<style data-vite-dev-id>` block emitted
		// between the template's opening tag and its first child. Mirrors the
		// one-liner from the bug report so the failure mode is easy to
		// recognize in the output.
		const styleInsideTemplate = html.indexOf('<style data-vite-dev-id', templateOpen);
		assert.ok(
			styleInsideTemplate === -1 || styleInsideTemplate > templateClose,
			'Hoisted <style data-vite-dev-id> block must not be nested inside <template>',
		);
	});
});
