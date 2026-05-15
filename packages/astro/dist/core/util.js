import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasSpecialQueries } from '../vite-plugin-utils/index.js';
import { SUPPORTED_MARKDOWN_FILE_EXTENSIONS } from './constants.js';
import { removeQueryString, removeTrailingForwardSlash, slash } from './path.js';
function isMarkdownFile(fileId, option) {
	if (hasSpecialQueries(fileId)) {
		return false;
	}
	const id = removeQueryString(fileId);
	const _suffix = option?.suffix ?? '';
	for (let markdownFileExtension of SUPPORTED_MARKDOWN_FILE_EXTENSIONS) {
		if (id.endsWith(`${markdownFileExtension}${_suffix}`)) return true;
	}
	return false;
}
const STATUS_CODE_PAGES = /* @__PURE__ */ new Set(['/404', '/500']);
function getOutputFilename(buildFormat, name, routeData) {
	if (routeData.type === 'endpoint') {
		return name;
	}
	if (name === '/' || name === '') {
		return path.posix.join(name, 'index.html');
	}
	if (buildFormat === 'file' || STATUS_CODE_PAGES.has(name)) {
		return `${removeTrailingForwardSlash(name || 'index')}.html`;
	}
	if (buildFormat === 'preserve' && !routeData.isIndex) {
		return `${removeTrailingForwardSlash(name || 'index')}.html`;
	}
	return path.posix.join(name, 'index.html');
}
function parseNpmName(spec) {
	if (!spec || spec[0] === '.' || spec[0] === '/') return void 0;
	let scope;
	let name = '';
	let parts = spec.split('/');
	if (parts[0][0] === '@') {
		scope = parts[0];
		name = parts.shift() + '/';
	}
	name += parts.shift();
	let subpath = parts.length ? `./${parts.join('/')}` : void 0;
	return {
		scope,
		name,
		subpath,
	};
}
function viteID(filePath) {
	return slash(fileURLToPath(filePath) + filePath.search);
}
const VALID_ID_PREFIX = `/@id/`;
const NULL_BYTE_PLACEHOLDER = `__x00__`;
const NULL_BYTE_REGEX = /^\0/;
function unwrapId(id) {
	return id.startsWith(VALID_ID_PREFIX)
		? id.slice(VALID_ID_PREFIX.length).replace(NULL_BYTE_PLACEHOLDER, '\0')
		: id;
}
function wrapId(id) {
	return id.replace(NULL_BYTE_REGEX, `${VALID_ID_PREFIX}${NULL_BYTE_PLACEHOLDER}`);
}
function resolvePages(config) {
	return new URL('./pages', config.srcDir);
}
function isInPagesDir(file, config) {
	const pagesDir = resolvePages(config);
	return file.toString().startsWith(pagesDir.toString());
}
function isInjectedRoute(file, settings) {
	let fileURL = file.toString();
	for (const route of settings.resolvedInjectedRoutes) {
		if (
			route.resolvedEntryPoint &&
			removeQueryString(fileURL) === removeQueryString(route.resolvedEntryPoint.toString())
		)
			return true;
	}
	return false;
}
function isPublicRoute(file, config) {
	const rootDir = config.root.toString();
	const pagesDir = resolvePages(config).toString();
	const fileDir = file.toString();
	const normalizedDir = fileDir.startsWith(pagesDir)
		? fileDir.slice(pagesDir.length)
		: fileDir.slice(rootDir.length);
	const parts = normalizedDir.replace(pagesDir.toString(), '').split('/').slice(1);
	for (const part of parts) {
		if (part.startsWith('_')) return false;
	}
	return true;
}
function endsWithPageExt(file, settings) {
	for (const ext of settings.pageExtensions) {
		if (file.toString().endsWith(ext)) return true;
	}
	return false;
}
function isPage(file, settings) {
	if (!isInPagesDir(file, settings.config) && !isInjectedRoute(file, settings)) return false;
	if (!isPublicRoute(file, settings.config)) return false;
	return endsWithPageExt(file, settings);
}
function isEndpoint(file, settings) {
	if (!isInPagesDir(file, settings.config) && !isInjectedRoute(file, settings)) return false;
	if (!isPublicRoute(file, settings.config)) return false;
	return !endsWithPageExt(file, settings) && !file.toString().includes('?astro');
}
function resolveJsToTs(filePath) {
	if (filePath.endsWith('.jsx') && !fs.existsSync(filePath)) {
		const tryPath = filePath.slice(0, -4) + '.tsx';
		if (fs.existsSync(tryPath)) {
			return tryPath;
		}
	}
	return filePath;
}
function ensureProcessNodeEnv(defaultNodeEnv) {
	if (!process.env.NODE_ENV) {
		process.env.NODE_ENV = defaultNodeEnv;
	}
}
export {
	VALID_ID_PREFIX,
	ensureProcessNodeEnv,
	getOutputFilename,
	isEndpoint,
	isMarkdownFile,
	isPage,
	parseNpmName,
	resolveJsToTs,
	resolvePages,
	unwrapId,
	viteID,
	wrapId,
};
