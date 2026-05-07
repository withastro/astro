import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadFixture, type Fixture } from '../test-utils.ts';

const fixture: Fixture = await loadFixture({
	root: './fixtures/standard-static/',
});

// Build when:
// - ASTRO_TEST_PREAMBLE is set (CI preamble step, or manual rebuild)
// - dist/ doesn't exist (local DX fallback — first run)
const shouldBuild =
	process.env.ASTRO_TEST_PREAMBLE ||
	!existsSync(fileURLToPath(new URL('.', fixture.config.outDir)));

if (shouldBuild) {
	await fixture.build();
}

export { fixture };
