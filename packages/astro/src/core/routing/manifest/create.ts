import type { AstroConfig, ManifestData, RouteData } from '../../../@types/astro';
import type { LogOptions } from '../../logger/core';

import fs from 'fs';
import path from 'path';
import { compile } from 'path-to-regexp';
import slash from 'slash';
import { fileURLToPath } from 'url';
import { warn } from '../../logger/core.js';
import { resolvePages } from '../../util.js';

interface Part {
	content: string;
	dynamic: boolean;
	spread: boolean;
}

interface Item {
	basename: string;
	ext: string;
	parts: Part[];
	file: string;
	isDir: boolean;
	isIndex: boolean;
	isPage: boolean;
	routeSuffix: string;
}

function countOccurrences(needle: string, haystack: string) {
	let count = 0;
	for (let i = 0; i < haystack.length; i += 1) {
		if (haystack[i] === needle) count += 1;
	}
	return count;
}

function getParts(part: string, file: string) {
	const result: Part[] = [];
	part.split(/\[(.+?\(.+?\)|.+?)\]/).map((str, i) => {
		if (!str) return;
		const dynamic = i % 2 === 1;

		const [, content] = dynamic ? /([^(]+)$/.exec(str) || [null, null] : [null, str];

		if (!content || (dynamic && !/^(\.\.\.)?[a-zA-Z0-9_$]+$/.test(content))) {
			throw new Error(`Invalid route ${file} — parameter name must match /^[a-zA-Z0-9_$]+$/`);
		}

		result.push({
			content,
			dynamic,
			spread: dynamic && /^\.{3}.+$/.test(content),
		});
	});

	return result;
}

function getPattern(segments: Part[][], addTrailingSlash: AstroConfig['trailingSlash']) {
	const pathname = segments
		.map((segment) => {
			return segment[0].spread
				? '(?:\\/(.*?))?'
				: '\\/' +
						segment
							.map((part) => {
								if (part)
									return part.dynamic
										? '([^/]+?)'
										: part.content
												.normalize()
												.replace(/\?/g, '%3F')
												.replace(/#/g, '%23')
												.replace(/%5B/g, '[')
												.replace(/%5D/g, ']')
												.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
							})
							.join('');
		})
		.join('');

	const trailing =
		addTrailingSlash && segments.length ? getTrailingSlashPattern(addTrailingSlash) : '$';
	return new RegExp(`^${pathname || '\\/'}${trailing}`);
}

function getTrailingSlashPattern(addTrailingSlash: AstroConfig['trailingSlash']): string {
	if (addTrailingSlash === 'always') {
		return '\\/$';
	}
	if (addTrailingSlash === 'never') {
		return '$';
	}
	return '\\/?$';
}

function getGenerator(segments: Part[][], addTrailingSlash: AstroConfig['trailingSlash']) {
	const template = segments
		.map((segment) => {
			return segment[0].spread
				? `/:${segment[0].content.substr(3)}(.*)?`
				: '/' +
						segment
							.map((part) => {
								if (part)
									return part.dynamic
										? `:${part.content}`
										: part.content
												.normalize()
												.replace(/\?/g, '%3F')
												.replace(/#/g, '%23')
												.replace(/%5B/g, '[')
												.replace(/%5D/g, ']')
												.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
							})
							.join('');
		})
		.join('');

	const trailing = addTrailingSlash !== 'never' && segments.length ? '/' : '';
	const toPath = compile(template + trailing);
	return toPath;
}

function isSpread(str: string) {
	const spreadPattern = /\[\.{3}/g;
	return spreadPattern.test(str);
}

function comparator(a: Item, b: Item) {
	if (a.isIndex !== b.isIndex) {
		if (a.isIndex) return isSpread(a.file) ? 1 : -1;

		return isSpread(b.file) ? -1 : 1;
	}

	const max = Math.max(a.parts.length, b.parts.length);

	for (let i = 0; i < max; i += 1) {
		const aSubPart = a.parts[i];
		const bSubPart = b.parts[i];

		if (!aSubPart) return 1; // b is more specific, so goes first
		if (!bSubPart) return -1;

		// if spread && index, order later
		if (aSubPart.spread && bSubPart.spread) {
			return a.isIndex ? 1 : -1;
		}

		// If one is ...spread order it later
		if (aSubPart.spread !== bSubPart.spread) return aSubPart.spread ? 1 : -1;

		if (aSubPart.dynamic !== bSubPart.dynamic) {
			return aSubPart.dynamic ? 1 : -1;
		}

		if (!aSubPart.dynamic && aSubPart.content !== bSubPart.content) {
			return (
				bSubPart.content.length - aSubPart.content.length ||
				(aSubPart.content < bSubPart.content ? -1 : 1)
			);
		}
	}

	if (a.isPage !== b.isPage) {
		return a.isPage ? 1 : -1;
	}

	// otherwise sort alphabetically
	return a.file < b.file ? -1 : 1;
}

/** Create manifest of all static routes */
export function createRouteManifest(
	{ config, cwd }: { config: AstroConfig; cwd?: string },
	logging: LogOptions
): ManifestData {
	const components: string[] = [];
	const routes: RouteData[] = [];
	const validPageExtensions: Set<string> = new Set(['.astro', '.md']);
	const validEndpointExtensions: Set<string> = new Set(['.js', '.ts']);

	function walk(dir: string, parentSegments: Part[][], parentParams: string[]) {
		let items: Item[] = [];
		fs.readdirSync(dir).forEach((basename) => {
			const resolved = path.join(dir, basename);
			const file = slash(path.relative(cwd || fileURLToPath(config.root), resolved));
			const isDir = fs.statSync(resolved).isDirectory();

			const ext = path.extname(basename);
			const name = ext ? basename.slice(0, -ext.length) : basename;

			if (name[0] === '_') {
				return;
			}
			if (basename[0] === '.' && basename !== '.well-known') {
				return;
			}
			// filter out "foo.astro_tmp" files, etc
			if (!isDir && !validPageExtensions.has(ext) && !validEndpointExtensions.has(ext)) {
				return;
			}
			const segment = isDir ? basename : name;
			if (/^\$/.test(segment)) {
				throw new Error(
					`Invalid route ${file} — Astro's Collections API has been replaced by dynamic route params.`
				);
			}
			if (/\]\[/.test(segment)) {
				throw new Error(`Invalid route ${file} — parameters must be separated`);
			}
			if (countOccurrences('[', segment) !== countOccurrences(']', segment)) {
				throw new Error(`Invalid route ${file} — brackets are unbalanced`);
			}
			if (/.+\[\.\.\.[^\]]+\]/.test(segment) || /\[\.\.\.[^\]]+\].+/.test(segment)) {
				throw new Error(`Invalid route ${file} — rest parameter must be a standalone segment`);
			}

			const parts = getParts(segment, file);
			const isIndex = isDir ? false : basename.startsWith('index.');
			const routeSuffix = basename.slice(basename.indexOf('.'), -ext.length);
			const isPage = validPageExtensions.has(ext);

			items.push({
				basename,
				ext,
				parts,
				file: file.replace(/\\/g, '/'),
				isDir,
				isIndex,
				isPage,
				routeSuffix,
			});
		});
		items = items.sort(comparator);

		items.forEach((item) => {
			const segments = parentSegments.slice();

			if (item.isIndex) {
				if (item.routeSuffix) {
					if (segments.length > 0) {
						const lastSegment = segments[segments.length - 1].slice();
						const lastPart = lastSegment[lastSegment.length - 1];

						if (lastPart.dynamic) {
							lastSegment.push({
								dynamic: false,
								spread: false,
								content: item.routeSuffix,
							});
						} else {
							lastSegment[lastSegment.length - 1] = {
								dynamic: false,
								spread: false,
								content: `${lastPart.content}${item.routeSuffix}`,
							};
						}

						segments[segments.length - 1] = lastSegment;
					} else {
						segments.push(item.parts);
					}
				}
			} else {
				segments.push(item.parts);
			}

			const params = parentParams.slice();
			params.push(...item.parts.filter((p) => p.dynamic).map((p) => p.content));

			if (item.isDir) {
				walk(path.join(dir, item.basename), segments, params);
			} else {
				components.push(item.file);
				const component = item.file;
				const trailingSlash = item.isPage ? config.trailingSlash : 'never';
				const pattern = getPattern(segments, trailingSlash);
				const generate = getGenerator(segments, trailingSlash);
				const pathname = segments.every((segment) => segment.length === 1 && !segment[0].dynamic)
					? `/${segments.map((segment) => segment[0].content).join('/')}`
					: null;

				routes.push({
					type: item.isPage ? 'page' : 'endpoint',
					pattern,
					params,
					component,
					generate,
					pathname: pathname || undefined,
				});
			}
		});
	}

	const pages = resolvePages(config);

	if (fs.existsSync(pages)) {
		walk(fileURLToPath(pages), [], []);
	} else {
		const pagesDirRootRelative = pages.href.slice(config.root.href.length);

		warn(logging, 'astro', `Missing pages directory: ${pagesDirRootRelative}`);
	}

	return {
		routes,
	};
}
