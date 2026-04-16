import path from 'node:path';
import { fileURLToPath } from 'node:url';
// @ts-expect-error
import { cli } from '../../../astro/test/test-utils.js';

// Copied from utils.ts so we don't have to import TS code for Node 20
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixtureDir = path.join(__dirname, './fixture');

export default async function setup() {
	// We only run the tests that require sync on Node.js versions other than 20 because the language server supports
	// a lower minimum version than Astro itself due to our lowest supported VS Code version, which mean we can't run Astro
	if (Number.parseInt(process.versions.node) !== 20) {
		const res = await cli('sync', '--root', fixtureDir).getResult();
		if (res.exitCode !== 0) {
			throw new Error(res.stderr);
		}
	}
}
