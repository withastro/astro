'use strict';
var __createBinding =
	(this && this.__createBinding) ||
	(Object.create
		? function (o, m, k, k2) {
				if (k2 === undefined) k2 = k;
				var desc = Object.getOwnPropertyDescriptor(m, k);
				if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
					desc = {
						enumerable: true,
						get: function () {
							return m[k];
						},
					};
				}
				Object.defineProperty(o, k2, desc);
			}
		: function (o, m, k, k2) {
				if (k2 === undefined) k2 = k;
				o[k2] = m[k];
			});
var __setModuleDefault =
	(this && this.__setModuleDefault) ||
	(Object.create
		? function (o, v) {
				Object.defineProperty(o, 'default', { enumerable: true, value: v });
			}
		: function (o, v) {
				o['default'] = v;
			});
var __importStar =
	(this && this.__importStar) ||
	(function () {
		var ownKeys = function (o) {
			ownKeys =
				Object.getOwnPropertyNames ||
				function (o) {
					var ar = [];
					for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
					return ar;
				};
			return ownKeys(o);
		};
		return function (mod) {
			if (mod && mod.__esModule) return mod;
			var result = {};
			if (mod != null)
				for (var k = ownKeys(mod), i = 0; i < k.length; i++)
					if (k[i] !== 'default') __createBinding(result, mod, k[i]);
			__setModuleDefault(result, mod);
			return result;
		};
	})();
Object.defineProperty(exports, '__esModule', { value: true });
exports.getLanguageServerTypesDir = getLanguageServerTypesDir;
exports.getAstroInstall = getAstroInstall;
const path = __importStar(require('node:path'));
const importPackage_js_1 = require('./importPackage.js');
function getLanguageServerTypesDir(ts) {
	return ts.sys.resolvePath(path.resolve(__dirname, '../types'));
}
function getAstroInstall(basePaths, checkForAstro) {
	if (checkForAstro && checkForAstro.nearestPackageJson) {
		basePaths.push(path.dirname(checkForAstro.nearestPackageJson));
		let deps = new Set();
		try {
			const packageJSON = require(checkForAstro.nearestPackageJson);
			[
				...Object.keys(packageJSON.dependencies ?? {}),
				...Object.keys(packageJSON.devDependencies ?? {}),
				...Object.keys(packageJSON.peerDependencies ?? {}),
			].forEach((dep) => deps.add(dep));
		} catch {}
		if (!deps.has('astro')) {
			const directoryContent = checkForAstro.readDirectory(
				path.dirname(checkForAstro.nearestPackageJson),
				['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts'],
				undefined,
				undefined,
				1,
			);
			if (!directoryContent.some((file) => path.basename(file).startsWith('astro.config'))) {
				return 'not-an-astro-project';
			}
		}
	}
	let astroPackage = (0, importPackage_js_1.getPackageInfo)('astro', basePaths);
	if (!astroPackage) {
		// If we couldn't find it inside the workspace's node_modules, it might means we're in the Astro development monorepo
		astroPackage = (0, importPackage_js_1.getPackageInfo)('./packages/astro', basePaths);
		if (!astroPackage) {
			console.error(
				`${basePaths[0]} seems to be an Astro project, but we couldn't find Astro or Astro is not installed`,
			);
			// If we still couldn't find it, it probably just doesn't exist
			return 'not-found';
		}
	}
	return astroPackage;
}
//# sourceMappingURL=utils.js.map
