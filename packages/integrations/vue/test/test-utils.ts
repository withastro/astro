import {
	cli,
	loadFixture as baseLoadFixture,
	type Fixture,
	type DevServer,
	type AstroInlineConfig,
} from '../../../astro/test/test-utils.js';

export { cli };
export type { Fixture, DevServer };

export function loadFixture(inlineConfig: AstroInlineConfig) {
	if (!inlineConfig?.root) throw new Error("Must provide { root: './fixtures/...' }");

	// resolve the relative root (i.e. "./fixtures/tailwindcss") to a full filepath
	// without this, the main `loadFixture` helper will resolve relative to `packages/astro/test`
	return baseLoadFixture({
		...inlineConfig,
		root: new URL(inlineConfig.root, import.meta.url).toString(),
	});
}
