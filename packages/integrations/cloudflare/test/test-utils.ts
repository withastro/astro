import type { PreviewServer } from 'astro';
import {
	loadFixture as baseLoadFixture,
	type AstroInlineConfig,
	type DevServer,
	type Fixture,
} from 'astro/_internal/test/test-utils';

export type { AstroInlineConfig, DevServer, Fixture, PreviewServer };

export async function loadFixture(inlineConfig: AstroInlineConfig): Promise<Fixture> {
	if (!inlineConfig?.root) throw new Error("Must provide { root: './fixtures/...' }");

	// resolve the relative root (i.e. "./fixtures/tailwindcss") to a full filepath
	// without this, the main `loadFixture` helper will resolve relative to `packages/astro/test`
	const fixture = await baseLoadFixture({
		...inlineConfig,
		root: new URL(inlineConfig.root as string, import.meta.url).toString(),
	});

	return fixture;
}
