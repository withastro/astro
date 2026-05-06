import fsMod from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroSettings } from '../../../types/astro.js';
import type { AllPagesData } from '../types.js';
import { shouldAppendForwardSlash } from '../util.js';
import { arraysEqual } from './common.js';
import {
	createDataDigests,
	createDependencyDigests,
	dataDigestsEqual,
	dependencyDigestsEqual,
	getPublicDirDigest,
} from './dependencies.js';
import { FULL_STATIC_REUSE_BLOCKING_HOOKS, type IncrementalBuildState } from './types.js';
import { normalizePath } from '../../viteUtils.js';

export function getFullStaticBuildReuseInvalidationReason({
	settings,
	allPages,
	previousState,
	fs = fsMod,
}: {
	settings: AstroSettings;
	allPages: AllPagesData;
	previousState: IncrementalBuildState;
	fs?: typeof fsMod;
}): string | undefined {
	const blockingHooks = getFullStaticReuseBlockingHooks(settings);
	if (blockingHooks.length > 0) {
		return `${blockingHooks.join(', ')} ${
			blockingHooks.length === 1 ? 'hook requires' : 'hooks require'
		} fresh generation`;
	}
	if (!previousState.pages) {
		return 'missing previous pages';
	}
	if (!previousState.dependencyDigests) {
		return 'missing previous dependency digests';
	}
	if (!previousState.dataDigests) {
		return 'missing previous data digests';
	}
	if (previousState.publicDirDigest === undefined) {
		return 'missing previous public directory digest';
	}
	if (hasDynamicPrerenderedRoutes(allPages)) {
		return 'dynamic routes require fresh path generation';
	}
	if (!outputDirectoryExists(previousState, fs)) {
		return 'persisted output directory missing';
	}
	const currentPageKeys = Object.keys(allPages).sort((left, right) => left.localeCompare(right));
	const previousPageKeys = previousState.pages
		.map((page) => page.key)
		.sort((left, right) => left.localeCompare(right));
	if (!arraysEqual(currentPageKeys, previousPageKeys)) {
		return 'routes changed';
	}
	const trackedDependencyKeys = Object.keys(previousState.dependencyDigests);
	const currentDependencyDigests = createDependencyDigests(
		settings,
		new Set(trackedDependencyKeys),
		fs,
	);
	if (!dependencyDigestsEqual(previousState.dependencyDigests, currentDependencyDigests)) {
		return 'tracked dependencies changed';
	}
	const trackedDataKeys = Object.keys(previousState.dataDigests);
	const currentDataDigests = createDataDigests(settings, new Set(trackedDataKeys), fs);
	if (!dataDigestsEqual(previousState.dataDigests, currentDataDigests)) {
		return 'data dependencies changed';
	}
	if (previousState.publicDirDigest !== getPublicDirDigest(settings, fs)) {
		return 'public directory changed';
	}
	if (!persistedOutputsExist(previousState, fs)) {
		return 'persisted outputs missing';
	}
	if (!persistedAssetsExist(settings, previousState, fs)) {
		return 'persisted assets missing';
	}
	return undefined;
}

export function restoreFullStaticBuildOutputs({
	settings,
	allPages,
	previousState,
	pageNames,
}: {
	settings: AstroSettings;
	allPages: AllPagesData;
	previousState: IncrementalBuildState;
	pageNames: string[];
}) {
	if (!previousState.pages) {
		return;
	}
	const currentPages = new Map(Object.values(allPages).map((pageData) => [pageData.key, pageData]));
	for (const previousPage of previousState.pages) {
		const currentPage = currentPages.get(previousPage.key);
		if (!currentPage) {
			continue;
		}
		currentPage.route.distURL = previousPage.generatedPaths.flatMap((generatedPath) =>
			generatedPath.output &&
			persistedFileExists(generatedPath.output, [previousState.artifacts.outDir], fsMod)
				? [new URL(generatedPath.output)]
				: [],
		);
		if (previousPage.routeType === 'page') {
			for (const generatedPath of previousPage.generatedPaths) {
				pageNames.push(pathnameToPageName(settings, generatedPath.pathname));
			}
		}
	}
}

function getFullStaticReuseBlockingHooks(settings: AstroSettings): string[] {
	return FULL_STATIC_REUSE_BLOCKING_HOOKS.filter((hookName) =>
		settings.config.integrations.some(
			(integration) => typeof integration.hooks[hookName] === 'function',
		),
	);
}

function hasDynamicPrerenderedRoutes(allPages: AllPagesData): boolean {
	return Object.values(allPages).some(
		(pageData) => pageData.route.prerender && pageData.route.route.includes('['),
	);
}

function outputDirectoryExists(state: IncrementalBuildState, fs: typeof fsMod = fsMod): boolean {
	try {
		return fs.existsSync(new URL(state.artifacts.outDir));
	} catch {
		return false;
	}
}

function persistedOutputsExist(state: IncrementalBuildState, fs: typeof fsMod = fsMod): boolean {
	return (
		state.pages?.every((page) =>
			page.generatedPaths.every(
				(generatedPath) =>
					!generatedPath.output ||
					persistedFileExists(generatedPath.output, [state.artifacts.outDir], fs),
			),
		) ?? true
	);
}

function persistedAssetsExist(
	settings: AstroSettings,
	state: IncrementalBuildState,
	fs: typeof fsMod = fsMod,
): boolean {
	return (
		state.pages?.every((page) => {
			const externalStyles = page.assets.styles
				.filter((assetRef) => assetRef.startsWith('external:'))
				.map((assetRef) => assetRef.slice('external:'.length));
			return [...externalStyles, ...page.assets.scripts].every((assetPath) =>
				persistedAssetExists(settings, state, assetPath, fs),
			);
		}) ?? true
	);
}

function persistedAssetExists(
	settings: AstroSettings,
	state: IncrementalBuildState,
	assetPath: string,
	fs: typeof fsMod = fsMod,
): boolean {
	const cleanedAssetPath = assetPath.split('?')[0];
	if (
		!cleanedAssetPath ||
		cleanedAssetPath.startsWith('data:') ||
		/^(?:https?:)?\/\//.test(cleanedAssetPath)
	) {
		return true;
	}
	const relativeAssetPath = normalizePersistedAssetPath(settings, cleanedAssetPath);
	return [state.artifacts.outDir, state.artifacts.clientDir, state.artifacts.serverDir].some(
		(root) => {
			const resolvedAssetPath = resolveContainedArtifactPath(root, relativeAssetPath);
			return resolvedAssetPath ? fs.existsSync(resolvedAssetPath) : false;
		},
	);
}

function normalizePersistedAssetPath(settings: AstroSettings, assetPath: string): string {
	let normalizedAssetPath = assetPath.replace(/\\/g, '/');
	const base = settings.config.base.replace(/\\/g, '/');
	if (base !== '/' && normalizedAssetPath.startsWith(base)) {
		normalizedAssetPath = normalizedAssetPath.slice(base.length);
	}
	return path.posix.normalize(normalizedAssetPath).replace(/^\/+/, '');
}

function pathnameToPageName(settings: AstroSettings, pathname: string): string {
	return shouldAppendForwardSlash(settings.config.trailingSlash, settings.config.build.format)
		? pathname.replace(/\/?$/, '/').replace(/^\//, '')
		: pathname.replace(/^\//, '');
}

function persistedFileExists(
	fileUrlValue: string,
	artifactRoots: string[],
	fs: typeof fsMod = fsMod,
): boolean {
	try {
		const fileUrl = new URL(fileUrlValue);
		if (fileUrl.protocol !== 'file:') {
			return false;
		}
		return isContainedWithinArtifactRoots(fileUrl, artifactRoots) && fs.existsSync(fileUrl);
	} catch {
		return false;
	}
}

function isContainedWithinArtifactRoots(fileUrl: URL, artifactRoots: string[]): boolean {
	const filePath = normalizePath(fileURLToPath(fileUrl));
	return artifactRoots.some((root) => {
		try {
			const rootPath = normalizePath(fileURLToPath(new URL(root))).replace(/\/$/, '');
			return filePath === rootPath || filePath.startsWith(`${rootPath}/`);
		} catch {
			return false;
		}
	});
}

function resolveContainedArtifactPath(root: string, relativeAssetPath: string): string | undefined {
	try {
		const rootPath = normalizePath(fileURLToPath(new URL(root))).replace(/\/$/, '');
		const resolvedPath = normalizePath(
			path.resolve(rootPath, relativeAssetPath.replace(/\//g, path.sep)),
		);
		return resolvedPath === rootPath || resolvedPath.startsWith(`${rootPath}/`)
			? resolvedPath
			: undefined;
	} catch {
		return undefined;
	}
}
