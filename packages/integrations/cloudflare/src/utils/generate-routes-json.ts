import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	prependForwardSlash,
	removeLeadingForwardSlash,
	removeTrailingForwardSlash,
} from '@astrojs/internal-helpers/path';
import type {
	AstroConfig,
	AstroIntegrationLogger,
	IntegrationResolvedRoute,
	RoutePart,
} from 'astro';
import { glob } from 'tinyglobby';

// Copied from https://github.com/withastro/astro/blob/3776ecf0aa9e08a992d3ae76e90682fd04093721/packages/astro/src/core/routing/manifest/create.ts#L45-L70
// We're not sure how to improve this regex yet
// eslint-disable-next-line regexp/no-super-linear-backtracking
const ROUTE_DYNAMIC_SPLIT = /\[(.+?\(.+?\)|.+?)\]/;
const ROUTE_SPREAD = /^\.{3}.+$/;
export function getParts(part: string) {
	const result: RoutePart[] = [];
	part.split(ROUTE_DYNAMIC_SPLIT).map((str, i) => {
		if (!str) return;
		const dynamic = i % 2 === 1;

		const [, content] = dynamic ? /([^(]+)$/.exec(str) || [null, null] : [null, str];

		if (!content || (dynamic && !/^(?:\.\.\.)?[\w$]+$/.test(content))) {
			throw new Error('Parameter name must match /^[a-zA-Z0-9_$]+$/');
		}

		result.push({
			content,
			dynamic,
			spread: dynamic && ROUTE_SPREAD.test(content),
		});
	});

	return result;
}

async function writeRoutesFileToOutDir(
	_config: AstroConfig,
	logger: AstroIntegrationLogger,
	include: string[],
	exclude: string[],
) {
	try {
		await writeFile(
			new URL('./_routes.json', _config.outDir),
			JSON.stringify(
				{
					version: 1,
					include: include,
					exclude: exclude,
				},
				null,
				2,
			),
			'utf-8',
		);
	} catch (_error) {
		logger.error("There was an error writing the '_routes.json' file to the output directory.");
	}
}

function segmentsToCfSyntax(segments: IntegrationResolvedRoute['segments'], _config: AstroConfig) {
	const pathSegments = [];
	if (removeLeadingForwardSlash(removeTrailingForwardSlash(_config.base)).length > 0) {
		pathSegments.push(removeLeadingForwardSlash(removeTrailingForwardSlash(_config.base)));
	}
	for (const segment of segments.flat()) {
		if (segment.dynamic) pathSegments.push('*');
		else pathSegments.push(segment.content);
	}
	return pathSegments;
}

class TrieNode {
	children = new Map<string, TrieNode>();
	isEndOfPath = false;
	hasWildcardChild = false;
}

class PathTrie {
	root: TrieNode;
	returnHasWildcard = false;

	constructor() {
		this.root = new TrieNode();
	}

	insert(thisPath: string[]) {
		let node = this.root;
		for (const segment of thisPath) {
			if (segment === '*') {
				node.hasWildcardChild = true;
				break;
			}
			if (!node.children.has(segment)) {
				node.children.set(segment, new TrieNode());
			}

			node = node.children.get(segment)!;
		}

		node.isEndOfPath = true;
	}

	/**
	 * Depth-first search (dfs), traverses the "graph"  segment by segment until the end or wildcard (*).
	 * It makes sure that all necessary paths are returned, but not paths with an existing wildcard prefix.
	 * e.g. if we have a path like /foo/* and /foo/bar, we only want to return /foo/*
	 */
	private dfs(node: TrieNode, thisPath: string[], allPaths: string[][]): void {
		if (node.hasWildcardChild) {
			this.returnHasWildcard = true;
			allPaths.push([...thisPath, '*']);
			return;
		}

		if (node.isEndOfPath) {
			allPaths.push([...thisPath]);
		}

		for (const [segment, childNode] of node.children) {
			this.dfs(childNode, [...thisPath, segment], allPaths);
		}
	}

	/**
	 * The reduce function is used to remove unnecessary paths from the trie.
	 * It receives a trie node to compare with the current node.
	 */
	private reduce(compNode: TrieNode, node: TrieNode): void {
		if (node.hasWildcardChild || compNode.hasWildcardChild) return;

		for (const [segment, childNode] of node.children) {
			if (childNode.children.size === 0) continue;

			const compChildNode = compNode.children.get(segment);
			if (compChildNode === undefined) {
				childNode.hasWildcardChild = true;
				continue;
			}

			this.reduce(compChildNode, childNode);
		}
	}

	reduceAllPaths(compTrie: PathTrie): this {
		this.reduce(compTrie.root, this.root);
		return this;
	}

	getAllPaths(): [string[][], boolean] {
		const allPaths: string[][] = [];
		this.dfs(this.root, [], allPaths);
		return [allPaths, this.returnHasWildcard];
	}
}

export async function createRoutesFile(
	_config: AstroConfig,
	logger: AstroIntegrationLogger,
	routes: IntegrationResolvedRoute[],
	pages: {
		pathname: string;
	}[],
	redirects: IntegrationResolvedRoute['segments'][],
	includeExtends:
		| {
				pattern: string;
		  }[]
		| undefined,
	excludeExtends:
		| {
				pattern: string;
		  }[]
		| undefined,
) {
	const includePaths: string[][] = [];
	const excludePaths: string[][] = [];

	/**
	 * All files in the `_config.build.assets` path, e.g. `_astro`
	 * are considered static assets and should not be handled by the function
	 * therefore we exclude a wildcard for that, e.g. `/_astro/*`
	 */
	const assetsPath = segmentsToCfSyntax(
		[
			[{ content: _config.build.assets, dynamic: false, spread: false }],
			[{ content: '', dynamic: true, spread: false }],
		],
		_config,
	);
	excludePaths.push(assetsPath);

	for (const redirect of redirects) {
		excludePaths.push(segmentsToCfSyntax(redirect, _config));
	}

	if (existsSync(fileURLToPath(_config.publicDir))) {
		const staticFiles = await glob(`**/*`, {
			cwd: fileURLToPath(_config.publicDir),
			dot: true,
		});
		for (const staticFile of staticFiles) {
			if (['_headers', '_redirects', '_routes.json'].includes(staticFile)) continue;
			const staticPath = staticFile;

			const segments = removeLeadingForwardSlash(staticPath)
				.split(path.sep)
				.filter(Boolean)
				.map((s: string) => {
					return getParts(s);
				});
			excludePaths.push(segmentsToCfSyntax(segments, _config));
		}
	}

	let hasPrerendered404 = false;
	for (const route of routes) {
		const convertedPath = segmentsToCfSyntax(route.segments, _config);
		if (route.pathname === '/404' && route.isPrerendered === true) hasPrerendered404 = true;

		// eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
		switch (route.type) {
			case 'page':
				if (route.isPrerendered === false) includePaths.push(convertedPath);

				break;

			case 'endpoint':
				if (route.isPrerendered === false) includePaths.push(convertedPath);
				else excludePaths.push(convertedPath);

				break;

			case 'redirect':
				excludePaths.push(convertedPath);

				break;

			default:
				/**
				 * We don't know the type, so we are conservative!
				 * Invoking the function on these is a safe-bet because
				 * the function will fallback to static asset fetching
				 */
				includePaths.push(convertedPath);

				break;
		}
	}

	for (const page of pages) {
		if (page.pathname === '404') hasPrerendered404 = true;
		const pageSegments = removeLeadingForwardSlash(page.pathname)
			.split(path.posix.sep)
			.filter(Boolean)
			.map((s) => {
				return getParts(s);
			});
		excludePaths.push(segmentsToCfSyntax(pageSegments, _config));
	}

	const includeTrie = new PathTrie();
	for (const includePath of includePaths) {
		includeTrie.insert(includePath);
	}

	const excludeTrie = new PathTrie();
	for (const excludePath of excludePaths) {
		/**
		 * A excludePath with starts with a wildcard (*) is a catch-all
		 * that would mean all routes are static, that would be equal to a full SSG project
		 * the adapter is not needed in this case, so we do not consider such paths
		 */
		if (excludePath[0] === '*') continue;
		excludeTrie.insert(excludePath);
	}

	const [deduplicatedIncludePaths, includedPathsHaveWildcard] = includeTrie
		.reduceAllPaths(excludeTrie)
		.getAllPaths();

	const [deduplicatedExcludePaths, _excludedPathsHaveWildcard] = excludeTrie
		.reduceAllPaths(includeTrie)
		.getAllPaths();

	/**
	 * Cloudflare allows no more than 100 include/exclude rules combined
	 * https://developers.cloudflare.com/pages/functions/routing/#limits
	 */
	const CLOUDFLARE_COMBINED_LIMIT = 100;
	/**
	 * Caluclate the number of automated and extended include rules
	 */
	const AUTOMATIC_INCLUDE_RULES_COUNT = deduplicatedIncludePaths.length;
	const EXTENDED_INCLUDE_RULES_COUNT = includeExtends?.length ?? 0;
	const INCLUDE_RULES_COUNT = AUTOMATIC_INCLUDE_RULES_COUNT + EXTENDED_INCLUDE_RULES_COUNT;
	/**
	 * Caluclate the number of automated and extended exclude rules
	 */
	const AUTOMATIC_EXCLUDE_RULES_COUNT = deduplicatedExcludePaths.length;
	const EXTENDED_EXCLUDE_RULES_COUNT = excludeExtends?.length ?? 0;
	const EXCLUDE_RULES_COUNT = AUTOMATIC_EXCLUDE_RULES_COUNT + EXTENDED_EXCLUDE_RULES_COUNT;

	const OPTION2_TOTAL_COUNT =
		INCLUDE_RULES_COUNT + (includedPathsHaveWildcard ? EXCLUDE_RULES_COUNT : 0);

	if (!hasPrerendered404 || OPTION2_TOTAL_COUNT > CLOUDFLARE_COMBINED_LIMIT) {
		await writeRoutesFileToOutDir(
			_config,
			logger,
			['/*'].concat(includeExtends?.map((entry) => entry.pattern) ?? []),
			deduplicatedExcludePaths
				.map((thisPath) => `${prependForwardSlash(thisPath.join('/'))}`)
				.slice(
					0,
					CLOUDFLARE_COMBINED_LIMIT -
						EXTENDED_INCLUDE_RULES_COUNT -
						EXTENDED_EXCLUDE_RULES_COUNT -
						1,
				)
				.concat(excludeExtends?.map((entry) => entry.pattern) ?? []),
		);
	} else {
		await writeRoutesFileToOutDir(
			_config,
			logger,
			deduplicatedIncludePaths
				.map((thisPath) => `${prependForwardSlash(thisPath.join('/'))}`)
				.concat(includeExtends?.map((entry) => entry.pattern) ?? []),
			includedPathsHaveWildcard
				? deduplicatedExcludePaths
						.map((thisPath) => `${prependForwardSlash(thisPath.join('/'))}`)
						.concat(excludeExtends?.map((entry) => entry.pattern) ?? [])
				: [],
		);
	}
}
