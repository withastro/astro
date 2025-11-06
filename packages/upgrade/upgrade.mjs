#!/usr/bin/env node

'use strict';

const currentVersion = process.versions.node;
const requiredMajorVersion = parseInt(currentVersion.split('.')[0], 10);
// TODO: remove once Stackblitz supports Node 22
const IS_STACKBLITZ = !!process.versions.webcontainer;
const minimumMajorVersion = IS_STACKBLITZ ? 20 : 22;

if (requiredMajorVersion < minimumMajorVersion) {
	console.error(`Node.js v${currentVersion} is out of date and unsupported!`);
	console.error(`Please use Node.js v${minimumMajorVersion} or higher.`);
	process.exit(1);
}

import('./dist/index.js').then(({ main }) => main());
