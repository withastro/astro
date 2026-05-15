import { isRelativePath } from '@astrojs/internal-helpers/path';
import _Markdoc from '@markdoc/markdoc';
import { heading } from './heading-ids.js';
import { componentConfigSymbol } from './utils.js';
const Markdoc = _Markdoc;
const nodes = { ...Markdoc.nodes, heading };
function defineMarkdocConfig(config) {
	return config;
}
function component(pathnameOrPkgName, namedExport) {
	return {
		type: isNpmPackageName(pathnameOrPkgName) ? 'package' : 'local',
		path: pathnameOrPkgName,
		namedExport,
		[componentConfigSymbol]: true,
	};
}
function isNpmPackageName(pathname) {
	return !isRelativePath(pathname) && !pathname.startsWith('/');
}
export { Markdoc, component, defineMarkdocConfig, nodes };
