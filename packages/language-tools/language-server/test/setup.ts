// @ts-expect-error
import { cli } from '../../../astro/test/test-utils.js';
import { fixtureDir } from './utils.ts';

export default async function setup() {
	// We only run the tests that require sync on Node.js versions other than 20 because the language server supports
	// a lower minimum version than Astro itself due to our lowest supported VS Code version, which mean we can't run Astro
	if (parseInt(process.versions.node) !== 20) {
		const res = await cli('sync', '--root', fixtureDir).getResult();
		if (res.exitCode !== 0) {
			throw new Error(res.stderr);
		}
	}
}
