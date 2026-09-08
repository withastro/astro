#!/usr/bin/env node
if (process.argv.includes('--version')) {
	const pkgJSON = require('../package.json');
	console.info(`${pkgJSON['version']}`);
} else {
	require('../dist/nodeServer.js');
}
