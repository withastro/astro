#!/usr/bin/env node

'use strict';

const currentVersion = process.versions.node;
const requiredMajorVersion = Number.parseInt(currentVersion.split('.')[0], 10);
const minimumMajorVersion = 22;

if (requiredMajorVersion < minimumMajorVersion) {
	console.error(`Node.js v${currentVersion} is out-of-date and unsupported!`);
	console.error(`Please use Node.js v${minimumMajorVersion} or higher.`);
	process.exit(1);
}

// If proxy env vars are set but --use-env-proxy is not active, re-exec with it.
// This makes Node.js native fetch() respect HTTP_PROXY/HTTPS_PROXY/NO_PROXY,
// which is needed because @bluwy/giget-core uses native fetch() for template downloads.
// --use-env-proxy is available in Node.js v22.21.0+ and v24.5.0+.
const hasProxyEnv =
	process.env.HTTP_PROXY ||
	process.env.HTTPS_PROXY ||
	process.env.http_proxy ||
	process.env.https_proxy;

if (hasProxyEnv && !process.execArgv.includes('--use-env-proxy')) {
	const { execFileSync } = await import('node:child_process');
	try {
		execFileSync(process.execPath, ['--use-env-proxy', ...process.argv.slice(1)], {
			stdio: 'inherit',
		});
		process.exit(0);
	} catch (e) {
		// If --use-env-proxy is not supported (Node.js < 22.21.0), fall through
		// and run without proxy support. If the child exited with a non-zero status,
		// propagate it.
		if (e.status != null) process.exit(e.status);
	}
}

void import('./dist/index.js').then(({ main }) => main());
