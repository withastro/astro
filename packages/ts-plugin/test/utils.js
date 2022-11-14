/* MIT License

Copyright (c) Microsoft Corporation. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE */

// @vscode/test-electron doesn't export this, so copying it here
// https://github.com/microsoft/vscode-test/blob/c6092b087a9c795c6d2097e864ab13e89d825226/lib/util.ts

const path = require('path');

/**
 * @type {string}
 */
let systemDefaultPlatform;
const windowsPlatforms = new Set(['win32-archive', 'win32-x64-archive', 'win32-arm64-archive']);
const darwinPlatforms = new Set(['darwin-arm64', 'darwin']);

switch (process.platform) {
	case 'darwin':
		systemDefaultPlatform = process.arch === 'arm64' ? 'darwin-arm64' : 'darwin';
		break;
	case 'win32':
		systemDefaultPlatform =
			process.arch === 'arm64'
				? 'win32-arm64-archive'
				: process.arch === 'ia32'
				? 'win32-archive'
				: 'win32-x64-archive';
		break;
	default:
		systemDefaultPlatform =
			process.arch === 'arm64' ? 'linux-arm64' : process.arch === 'arm' ? 'linux-armhf' : 'linux-x64';
}

/**
 * @param {string} dir
 */
function downloadDirToExecutablePath(dir) {
	if (windowsPlatforms.has(systemDefaultPlatform)) {
		return path.resolve(dir, 'Code.exe');
	} else if (darwinPlatforms.has(systemDefaultPlatform)) {
		return path.resolve(dir, 'Visual Studio Code.app/Contents/MacOS/Electron');
	} else {
		return path.resolve(dir, 'code');
	}
}

module.exports = { downloadDirToExecutablePath };
