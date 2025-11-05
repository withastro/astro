#!/usr/bin/env node
'use strict';

const CI_INSTRUCTIONS = {
	NETLIFY: 'https://docs.netlify.com/configure-builds/manage-dependencies/#node-js-and-javascript',
	GITHUB_ACTIONS:
		'https://docs.github.com/en/actions/guides/building-and-testing-nodejs#specifying-the-nodejs-version',
	VERCEL: 'https://vercel.com/docs/runtimes#official-runtimes/node-js/node-js-version',
};

// TODO: remove once Stackblitz supports Node 22
const IS_STACKBLITZ = !!process.versions.webcontainer;

// Hardcode supported Node.js version so we don't have to read differently in CJS & ESM.
const engines = IS_STACKBLITZ ? '>=20.19.5' : '>=22.12.0';
const skipSemverCheckIfAbove = IS_STACKBLITZ ? 21 : 23;

/** `astro *` */
async function main() {
	if (process.env.SKIP_NODE_VERSION_CHECK !== 'true') {
		const version = process.versions.node;
		// Fast-path for higher Node.js versions
		if ((parseInt(version) || 0) <= skipSemverCheckIfAbove) {
			const semver = await import('semver');
			try {
				if (!semver.satisfies(version, engines)) {
					await errorNodeUnsupported();
					return;
				}
			} catch {
				await errorNodeUnsupported();
				return;
			}
		}
	}

	// windows drive letters can sometimes be lowercase, which vite cannot process
	if (process.platform === 'win32') {
		const cwd = process.cwd();
		const correctedCwd = cwd.slice(0, 1).toUpperCase() + cwd.slice(1);
		if (correctedCwd !== cwd) process.chdir(correctedCwd);
	}

	return import('../dist/cli/index.js')
		.then(({ cli }) => cli(process.argv))
		.catch((error) => {
			console.error(error);
			process.exit(1);
		});
}

async function errorNodeUnsupported() {
	console.error(`\
Node.js v${process.versions.node} is not supported by Astro!
Please upgrade Node.js to a supported version: "${engines}"\n`);

	const ci = await import('ci-info');

	// Special instructions for CI environments, which may have special steps needed.
	// This is a common issue that we can help users with proactively.
	if (ci.isCI) {
		let platform;
		for (const [key, value] of Object.entries(ci)) {
			if (value === true) {
				platform = key;
				break;
			}
		}
		console.log(
			`${ci.name} CI Environment Detected!\nAdditional steps may be needed to set your Node.js version:`,
		);
		console.log(`Documentation: https://docs.astro.build/en/guides/deploy/`);
		if (CI_INSTRUCTIONS[platform]) {
			console.log(`${ci.name} Documentation: ${CI_INSTRUCTIONS[platform]}`);
		}
		console.log(``);
	}

	process.exit(1);
}

main()
	.then(() => process.exit(0))
	.catch(() => process.exit(1));
