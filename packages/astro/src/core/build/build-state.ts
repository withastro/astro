import fsMod from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import type { AstroSettings } from '../../types/astro.js';
import type { RuntimeMode } from '../../types/public/config.js';
import type { Logger } from '../logger/core.js';
import { prependForwardSlash } from '../path.js';
import { normalizePath } from '../viteUtils.js';
import { cleanUrl, normalizeFilename } from '../../vite-plugin-utils/index.js';
import { BEFORE_HYDRATION_SCRIPT_ID, PAGE_SCRIPT_ID } from '../../vite-plugin-scripts/index.js';
import type { BuildInternals, PageBuildDependencies } from './internal.js';
import { cssOrder, mergeInlineCss } from './runtime.js';
import type { AllPagesData } from './types.js';
import { shouldAppendForwardSlash } from './util.js';

const INCREMENTAL_BUILD_STATE_FILE_BASENAME = 'incremental-build-state';
const INCREMENTAL_BUILD_STATE_FILE_REGEX =
	/^incremental-build-state(?:\.[a-f0-9]+)?\.json(?:\.\d+\.\d+\.tmp)?$/;
const INCREMENTAL_BUILD_STATE_VERSION = 3 as const;
const FULL_STATIC_REUSE_BLOCKING_HOOKS = [
	'astro:build:setup',
	'astro:build:ssr',
	'astro:build:generated',
] as const;
const PROJECT_METADATA_FILES = [
	'package.json',
	'pnpm-lock.yaml',
	'package-lock.json',
	'yarn.lock',
	'bun.lock',
	'bun.lockb',
] as const;
const BUILD_IMPLEMENTATION_FILES = [
	'build-state',
	'index',
	'generate',
	'static-build',
	'internal',
	'default-prerenderer',
	'plugins/plugin-analyzer',
	'plugins/plugin-manifest',
] as const;

export interface IncrementalBuildFingerprint {
	astroVersion: string;
	mode: string;
	runtimeMode: RuntimeMode;
	buildOutput: NonNullable<AstroSettings['buildOutput']>;
	adapterName: string | null;
	prerendererName: string | null;
	integrationNames: string[];
	rendererNames: string[];
	configDigest: string;
	viteConfigDigest: string;
	integrationHooksDigest: string;
	projectMetadataDigest: string;
	buildImplementationDigest: string;
}

export interface IncrementalBuildArtifacts {
	outDir: string;
	clientDir: string;
	serverDir: string;
	cacheDir: string;
}

export interface IncrementalBuildSummary {
	pageCount: number;
	buildTimeMs: number;
}

export interface IncrementalBuildGeneratedPath {
	pathname: string;
	output: string | null;
}

interface IncrementalBuildPageDependencies {
	modules: string[];
	hydratedComponents: string[];
	clientOnlyComponents: string[];
	scripts: string[];
	usesDataStore: boolean;
}

export interface IncrementalBuildPage {
	key: string;
	route: string;
	component: string;
	moduleSpecifier: string;
	routeType: string;
	prerender: boolean;
	dependencies: IncrementalBuildPageDependencies;
	assets: IncrementalBuildPageAssets;
	generatedPaths: IncrementalBuildGeneratedPath[];
}

interface IncrementalBuildPageAssets {
	styles: string[];
	scripts: string[];
}

export interface IncrementalBuildState {
	version: typeof INCREMENTAL_BUILD_STATE_VERSION;
	generatedAt: string;
	fingerprint: IncrementalBuildFingerprint;
	artifacts: IncrementalBuildArtifacts;
	summary: IncrementalBuildSummary;
	inputDigests?: Record<string, string>;
	dataStoreDigest?: string | null;
	publicDirDigest?: string | null;
	pages?: IncrementalBuildPage[];
}

export interface IncrementalBuildSnapshot {
	inputDigests: Record<string, string>;
	dataStoreDigest: string | null;
	pages: IncrementalBuildPage[];
}

export interface IncrementalPageRenderPlan {
	pageKey: string;
	renderPathnames: string[];
	reusedPathnames: string[];
	outputsToDelete: string[];
	reason?: string;
}

export interface IncrementalBuildRenderPlan {
	pagePlans: Map<string, IncrementalPageRenderPlan>;
	staleOutputsToDelete: string[];
	renderedPathCount: number;
	reusedPathCount: number;
	deletedOutputCount: number;
}

export interface LoadedIncrementalBuildState {
	stateFile: URL;
	currentFingerprint: IncrementalBuildFingerprint;
	currentArtifacts: IncrementalBuildArtifacts;
	previousState: IncrementalBuildState | undefined;
	invalidationReason: string | undefined;
}

interface IncrementalBuildStateOptions {
	settings: AstroSettings;
	mode: string;
	runtimeMode: RuntimeMode;
}

interface PersistIncrementalBuildStateOptions extends IncrementalBuildStateOptions {
	pageCount: number;
	buildTimeMs: number;
	allPages?: AllPagesData;
	internals?: BuildInternals;
}

interface StaticBuildReuseOptions {
	settings: AstroSettings;
	allPages: AllPagesData;
	previousState: IncrementalBuildState;
	fs?: typeof fsMod;
}

export function getIncrementalBuildStateFile({
	settings,
	mode,
	runtimeMode,
}: IncrementalBuildStateOptions): URL {
	return new URL(
		getIncrementalBuildStateFileName({ settings, mode, runtimeMode }),
		settings.config.cacheDir,
	);
}

export async function clearIncrementalBuildState({
	settings,
	logger,
	fs = fsMod,
}: {
	settings: Pick<AstroSettings, 'config'>;
	logger: Logger;
	fs?: typeof fsMod;
}) {
	if (!fs.existsSync(settings.config.cacheDir)) {
		return;
	}

	logger.debug('build', 'clearing incremental build state');
	try {
		const cacheDir = appendDirectoryUrl(settings.config.cacheDir);
		const stateFiles = (await fs.promises.readdir(cacheDir, { withFileTypes: true }))
			.filter((entry) => entry.isFile() && isIncrementalBuildStateFileName(entry.name))
			.map((entry) => new URL(entry.name, cacheDir));
		if (stateFiles.length === 0) {
			return;
		}
		await Promise.all(stateFiles.map((stateFile) => fs.promises.rm(stateFile, { force: true })));
		logger.warn('build', 'incremental build state cleared (force)');
	} catch (error) {
		logger.warn('build', `Failed to clear incremental build state: ${getErrorMessage(error)}`);
	}
}

export async function loadIncrementalBuildState({
	settings,
	logger,
	mode,
	runtimeMode,
	fs = fsMod,
}: IncrementalBuildStateOptions & {
	logger: Logger;
	fs?: typeof fsMod;
}): Promise<LoadedIncrementalBuildState> {
	const stateFile = getIncrementalBuildStateFile({ settings, mode, runtimeMode });
	const currentFingerprint = createIncrementalBuildFingerprint({ settings, mode, runtimeMode });
	const currentArtifacts = createIncrementalBuildArtifacts(settings);

	if (!fs.existsSync(stateFile)) {
		return {
			stateFile,
			currentFingerprint,
			currentArtifacts,
			previousState: undefined,
			invalidationReason: undefined,
		};
	}

	let rawState: string;
	try {
		rawState = await fs.promises.readFile(stateFile, 'utf-8');
	} catch (error) {
		logger.warn('build', `Ignoring cached incremental build state: ${getErrorMessage(error)}`);
		return {
			stateFile,
			currentFingerprint,
			currentArtifacts,
			previousState: undefined,
			invalidationReason: 'state file could not be read',
		};
	}

	let parsedState: unknown;
	try {
		parsedState = JSON.parse(rawState);
	} catch (error) {
		logger.warn('build', `Ignoring cached incremental build state: ${getErrorMessage(error)}`);
		return {
			stateFile,
			currentFingerprint,
			currentArtifacts,
			previousState: undefined,
			invalidationReason: 'state file contains invalid JSON',
		};
	}

	if (!isIncrementalBuildState(parsedState)) {
		logger.warn('build', 'Ignoring cached incremental build state: unsupported state format');
		return {
			stateFile,
			currentFingerprint,
			currentArtifacts,
			previousState: undefined,
			invalidationReason: 'state file has an unsupported format',
		};
	}

	const invalidationReason = getInvalidationReason(parsedState.fingerprint, currentFingerprint);
	if (invalidationReason) {
		logger.debug('build', `Ignoring cached incremental build state: ${invalidationReason}`);
		return {
			stateFile,
			currentFingerprint,
			currentArtifacts,
			previousState: undefined,
			invalidationReason,
		};
	}

	logger.debug('build', 'Loaded cached incremental build state');
	return {
		stateFile,
		currentFingerprint,
		currentArtifacts,
		previousState: parsedState,
		invalidationReason: undefined,
	};
}

export function createIncrementalBuildState({
	settings,
	mode,
	runtimeMode,
	pageCount,
	buildTimeMs,
	allPages,
	internals,
}: PersistIncrementalBuildStateOptions): IncrementalBuildState {
	const snapshot =
		allPages && internals
			? createIncrementalBuildSnapshot({
					settings,
					allPages,
					internals,
				})
			: undefined;

	return {
		version: INCREMENTAL_BUILD_STATE_VERSION,
		generatedAt: new Date().toISOString(),
		fingerprint: createIncrementalBuildFingerprint({ settings, mode, runtimeMode }),
		artifacts: createIncrementalBuildArtifacts(settings),
		summary: {
			pageCount,
			buildTimeMs,
		},
		publicDirDigest: getPublicDirDigest(settings),
		...(snapshot
			? {
					inputDigests: snapshot.inputDigests,
					dataStoreDigest: snapshot.dataStoreDigest,
					pages: snapshot.pages,
				}
			: {}),
	};
}

export function getFullStaticBuildReuseInvalidationReason({
	settings,
	allPages,
	previousState,
	fs = fsMod,
}: StaticBuildReuseOptions): string | undefined {
	const blockingHooks = getFullStaticReuseBlockingHooks(settings);
	if (blockingHooks.length > 0) {
		return `${blockingHooks.join(', ')} ${
			blockingHooks.length === 1 ? 'hook requires' : 'hooks require'
		} fresh generation`;
	}
	if (!previousState.pages) {
		return 'missing previous pages';
	}
	if (!previousState.inputDigests) {
		return 'missing previous input digests';
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
	const trackedIds = Object.keys(previousState.inputDigests);
	const currentInputDigests = createInputDigests(settings, new Set(trackedIds), fs);
	if (!inputDigestsEqual(previousState.inputDigests, currentInputDigests)) {
		return 'tracked inputs changed';
	}
	if (previousState.dataStoreDigest !== getDataStoreDigest(settings, fs)) {
		return 'content store changed';
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

export function createReusedIncrementalBuildState({
	settings,
	mode,
	runtimeMode,
	previousState,
	pageCount,
	buildTimeMs,
}: IncrementalBuildStateOptions & {
	previousState: IncrementalBuildState;
	pageCount: number;
	buildTimeMs: number;
}): IncrementalBuildState {
	return {
		...previousState,
		version: INCREMENTAL_BUILD_STATE_VERSION,
		generatedAt: new Date().toISOString(),
		fingerprint: createIncrementalBuildFingerprint({ settings, mode, runtimeMode }),
		artifacts: createIncrementalBuildArtifacts(settings),
		summary: {
			pageCount,
			buildTimeMs,
		},
		publicDirDigest: getPublicDirDigest(settings),
	};
}

export async function writeIncrementalBuildState({
	settings,
	logger,
	state,
	fs = fsMod,
}: {
	settings: AstroSettings;
	logger: Logger;
	state: IncrementalBuildState;
	fs?: typeof fsMod;
}) {
	const stateFileName = getIncrementalBuildStateFileName({
		settings,
		mode: state.fingerprint.mode,
		runtimeMode: state.fingerprint.runtimeMode,
	});
	const stateFile = new URL(stateFileName, settings.config.cacheDir);
	try {
		await fs.promises.mkdir(new URL('./', stateFile), { recursive: true });
		const tempStateFile = new URL(
			`${stateFileName}.${process.pid}.${Date.now()}.tmp`,
			settings.config.cacheDir,
		);
		await fs.promises.writeFile(tempStateFile, `${JSON.stringify(state, null, 2)}\n`, 'utf-8');
		try {
			await fs.promises.rename(tempStateFile, stateFile);
		} catch (error) {
			const renameError = error as NodeJS.ErrnoException;
			if (renameError.code !== 'EEXIST' && renameError.code !== 'EPERM') {
				throw error;
			}
			await fs.promises.rm(stateFile, { force: true });
			await fs.promises.rename(tempStateFile, stateFile);
		}
		logger.debug('build', 'Persisted incremental build state');
	} catch (error) {
		logger.warn('build', `Unable to persist incremental build state: ${getErrorMessage(error)}`);
	}
}

export function createIncrementalBuildSnapshot({
	settings,
	allPages,
	internals,
	generatedPathsByPage,
	fs = fsMod,
}: {
	settings: AstroSettings;
	allPages: AllPagesData;
	internals: BuildInternals;
	generatedPathsByPage?: Map<string, IncrementalBuildGeneratedPath[]>;
	fs?: typeof fsMod;
}): IncrementalBuildSnapshot {
	const trackedInputIds = new Set<string>();

	const pages = Object.values(allPages)
		.map((pageData) => {
			const pageDependencies = internals.pageDependencies.get(pageData.key);
			const normalizedModuleSpecifier = normalizeTrackedDependencyId(
				settings,
				pageData.moduleSpecifier,
			);
			const modules = new Set<string>();
			let usesDataStore = false;

			if (
				pageData.moduleSpecifier &&
				shouldTrackDependencyId(settings, normalizedModuleSpecifier)
			) {
				modules.add(normalizedModuleSpecifier);
				trackedInputIds.add(normalizedModuleSpecifier);
			}

			for (const rawModuleId of pageDependencies?.modules ?? []) {
				if (usesContentDataStore(rawModuleId)) {
					usesDataStore = true;
				}
				const normalizedModuleId = normalizeTrackedDependencyId(settings, rawModuleId);
				if (!shouldTrackDependencyId(settings, normalizedModuleId)) {
					continue;
				}
				modules.add(normalizedModuleId);
				trackedInputIds.add(normalizedModuleId);
			}

			return {
				key: pageData.key,
				route: pageData.route.route,
				component: pageData.component,
				moduleSpecifier: normalizedModuleSpecifier,
				routeType: pageData.route.type,
				prerender: pageData.route.prerender,
				dependencies: {
					modules: Array.from(modules).sort((left, right) => left.localeCompare(right)),
					hydratedComponents: normalizeTrackedDependencyIds(
						settings,
						pageDependencies?.hydratedComponents,
					),
					clientOnlyComponents: normalizeTrackedDependencyIds(
						settings,
						pageDependencies?.clientOnlyComponents,
					),
					scripts: normalizeTrackedDependencyIds(settings, pageDependencies?.scripts),
					usesDataStore,
				},
				assets: createPageAssetSnapshot({
					settings,
					pageData,
					pageDependencies,
					internals,
				}),
				generatedPaths: getGeneratedPathsForPage(
					pageData.key,
					pageDependencies,
					generatedPathsByPage,
				),
			};
		})
		.sort(
			(left, right) =>
				left.component.localeCompare(right.component) || left.route.localeCompare(right.route),
		);

	return {
		inputDigests: createInputDigests(settings, trackedInputIds, fs),
		dataStoreDigest: getDataStoreDigest(settings, fs),
		pages,
	};
}

export function planIncrementalPageGeneration({
	previousState,
	currentSnapshot,
	fs = fsMod,
}: {
	previousState: IncrementalBuildState;
	currentSnapshot: IncrementalBuildSnapshot;
	fs?: typeof fsMod;
}): IncrementalBuildRenderPlan {
	const previousPages = new Map((previousState.pages ?? []).map((page) => [page.key, page]));
	const currentPages = new Map(currentSnapshot.pages.map((page) => [page.key, page]));
	const pagePlans = new Map<string, IncrementalPageRenderPlan>();
	const staleOutputsToDelete: string[] = [];
	let renderedPathCount = 0;
	let reusedPathCount = 0;
	let deletedOutputCount = 0;

	for (const previousPage of previousPages.values()) {
		if (currentPages.has(previousPage.key)) {
			continue;
		}
		for (const generatedPath of previousPage.generatedPaths) {
			if (generatedPath.output) {
				staleOutputsToDelete.push(generatedPath.output);
				deletedOutputCount++;
			}
		}
	}

	for (const currentPage of currentSnapshot.pages) {
		const previousPage = previousPages.get(currentPage.key);
		const reason = getReuseInvalidationReason(
			previousState,
			currentSnapshot,
			previousPage,
			currentPage,
		);

		if (!previousPage || reason) {
			const renderPathnames = currentPage.generatedPaths.map(
				(generatedPath) => generatedPath.pathname,
			);
			renderedPathCount += renderPathnames.length;
			const outputsToDelete = previousPage
				? previousPage.generatedPaths.flatMap((generatedPath) =>
						generatedPath.output ? [generatedPath.output] : [],
					)
				: [];
			deletedOutputCount += outputsToDelete.length;
			pagePlans.set(currentPage.key, {
				pageKey: currentPage.key,
				renderPathnames,
				reusedPathnames: [],
				outputsToDelete,
				reason,
			});
			continue;
		}

		const previousPaths = new Map(
			previousPage.generatedPaths.map((generatedPath) => [generatedPath.pathname, generatedPath]),
		);
		const currentPaths = new Map(
			currentPage.generatedPaths.map((generatedPath) => [generatedPath.pathname, generatedPath]),
		);
		const renderPathnames: string[] = [];
		const reusedPathnames: string[] = [];
		const outputsToDelete: string[] = [];

		for (const previousPath of previousPage.generatedPaths) {
			const currentPath = currentPaths.get(previousPath.pathname);
			if (!currentPath || currentPath.output !== previousPath.output) {
				if (previousPath.output) {
					outputsToDelete.push(previousPath.output);
					deletedOutputCount++;
				}
			}
		}

		for (const currentPath of currentPage.generatedPaths) {
			const previousPath = previousPaths.get(currentPath.pathname);
			const previousOutputMissing = previousPath?.output
				? !fs.existsSync(new URL(previousPath.output))
				: false;
			if (!previousPath || previousPath.output !== currentPath.output || previousOutputMissing) {
				renderPathnames.push(currentPath.pathname);
				renderedPathCount++;
			} else {
				reusedPathnames.push(currentPath.pathname);
				reusedPathCount++;
			}
		}

		pagePlans.set(currentPage.key, {
			pageKey: currentPage.key,
			renderPathnames,
			reusedPathnames,
			outputsToDelete,
		});
	}

	return {
		pagePlans,
		staleOutputsToDelete,
		renderedPathCount,
		reusedPathCount,
		deletedOutputCount,
	};
}

function getGeneratedPathsForPage(
	pageKey: string,
	pageDependencies: PageBuildDependencies | undefined,
	generatedPathsByPage: Map<string, IncrementalBuildGeneratedPath[]> | undefined,
): IncrementalBuildGeneratedPath[] {
	if (generatedPathsByPage?.has(pageKey)) {
		return generatedPathsByPage.get(pageKey)!;
	}
	return Array.from(pageDependencies?.generatedPaths.entries() ?? [])
		.map(([pathname, output]) => ({ pathname, output }))
		.sort((left, right) => left.pathname.localeCompare(right.pathname));
}

function createPageAssetSnapshot({
	settings,
	pageData,
	pageDependencies,
	internals,
}: {
	settings: AstroSettings;
	pageData: AllPagesData[string];
	pageDependencies: PageBuildDependencies | undefined;
	internals: BuildInternals;
}): IncrementalBuildPageAssets {
	const styles = [...pageData.styles]
		.sort(cssOrder)
		.map(({ sheet }) => sheet)
		.reduce(mergeInlineCss, [])
		.map((sheet) =>
			sheet.type === 'external'
				? `external:${sheet.src}`
				: `inline:${createHash('sha256').update(sheet.content).digest('hex')}`,
		);

	const scripts = new Set<string>();
	const hasHydrationDependencies =
		Boolean(pageDependencies?.hydratedComponents.size) ||
		Boolean(pageDependencies?.clientOnlyComponents.size);

	if (settings.scripts.some((script) => script.stage === 'page')) {
		addBundleAssetRef(scripts, internals.entrySpecifierToBundleMap.get(PAGE_SCRIPT_ID));
	}

	for (const scriptId of pageDependencies?.scripts ?? []) {
		addBundleAssetRef(scripts, internals.entrySpecifierToBundleMap.get(scriptId));
	}

	for (const componentId of pageDependencies?.hydratedComponents ?? []) {
		addBundleAssetRef(scripts, internals.entrySpecifierToBundleMap.get(componentId));
	}

	for (const componentId of pageDependencies?.clientOnlyComponents ?? []) {
		addBundleAssetRef(scripts, internals.entrySpecifierToBundleMap.get(componentId));
	}

	if (hasHydrationDependencies) {
		addBundleAssetRef(scripts, internals.entrySpecifierToBundleMap.get(BEFORE_HYDRATION_SCRIPT_ID));
		for (const renderer of settings.renderers) {
			if (typeof renderer.clientEntrypoint === 'string') {
				addBundleAssetRef(
					scripts,
					internals.entrySpecifierToBundleMap.get(renderer.clientEntrypoint),
				);
			}
		}
	}

	return {
		styles,
		scripts: Array.from(scripts).sort((left, right) => left.localeCompare(right)),
	};
}

function addBundleAssetRef(assetRefs: Set<string>, fileName: string | undefined) {
	if (fileName) {
		assetRefs.add(fileName);
	}
}

function normalizeTrackedDependencyIds(
	settings: AstroSettings,
	ids: Iterable<string> | undefined,
): string[] {
	const normalizedIds = new Set<string>();
	for (const id of ids ?? []) {
		normalizedIds.add(normalizeTrackedDependencyId(settings, id));
	}
	return Array.from(normalizedIds).sort((left, right) => left.localeCompare(right));
}

function normalizeTrackedDependencyId(settings: AstroSettings, id: string): string {
	if (!id) {
		return id;
	}

	const cleanedId = cleanUrl(id);
	if (
		cleanedId.startsWith('\0') ||
		cleanedId.startsWith('/@id/') ||
		cleanedId.startsWith('virtual:')
	) {
		return cleanedId;
	}
	if (cleanedId.startsWith('file://')) {
		return toProjectRelativeId(settings, normalizePath(fileURLToPath(cleanedId)));
	}
	if (cleanedId.startsWith('/')) {
		return toProjectRelativeId(
			settings,
			normalizePath(normalizeFilename(cleanedId, settings.config.root)),
		);
	}
	if (path.isAbsolute(cleanedId)) {
		return toProjectRelativeId(settings, normalizePath(cleanedId));
	}
	if (/^[a-z]+:/i.test(cleanedId)) {
		return cleanedId;
	}
	return cleanedId;
}

function shouldTrackDependencyId(settings: AstroSettings, id: string): boolean {
	if (!id || id.startsWith('\0') || id.startsWith('/@id/') || id.startsWith('virtual:')) {
		return false;
	}
	if (id.startsWith('/.astro/')) {
		return false;
	}
	if (/^[a-z]+:/i.test(id)) {
		return false;
	}
	if (id.startsWith('/')) {
		const resolvedPath = fileURLToPath(new URL(`.${id}`, settings.config.root));
		return !normalizePath(resolvedPath).includes('/node_modules/');
	}
	if (path.isAbsolute(id)) {
		if (id.includes('/node_modules/') || id.includes('/dist/')) {
			return false;
		}
		return true;
	}
	return false;
}

function usesContentDataStore(id: string): boolean {
	const cleanedId = cleanUrl(id);
	return (
		cleanedId === '\0astro:data-layer-content' ||
		cleanedId === '\0astro:content' ||
		cleanedId === '/.astro/content-assets.mjs' ||
		cleanedId === '/.astro/content-modules.mjs'
	);
}

function createInputDigests(
	settings: AstroSettings,
	ids: Set<string>,
	fs: typeof fsMod,
): Record<string, string> {
	return Object.fromEntries(
		Array.from(ids)
			.sort((left, right) => left.localeCompare(right))
			.map((id) => [id, createFileDigest(resolveTrackedDependencyPath(settings, id), fs)]),
	);
}

function resolveTrackedDependencyPath(settings: AstroSettings, id: string): string {
	if (id.startsWith('/')) {
		return fileURLToPath(new URL(`.${id}`, settings.config.root));
	}
	if (path.isAbsolute(id)) {
		return id;
	}
	return fileURLToPath(new URL(`./${id}`, settings.config.root));
}

function createFileDigest(filePath: string, fs: typeof fsMod): string {
	try {
		return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
	} catch {
		return fs.existsSync(filePath) ? 'unreadable' : 'missing';
	}
}

function getDataStoreDigest(settings: AstroSettings, fs: typeof fsMod): string | null {
	const dataStoreFile = new URL('./data-store.json', settings.config.cacheDir);
	try {
		if (!fs.existsSync(dataStoreFile)) {
			return null;
		}
		return createHash('sha256').update(fs.readFileSync(dataStoreFile)).digest('hex');
	} catch {
		return fs.existsSync(dataStoreFile) ? 'unreadable' : null;
	}
}

function getPublicDirDigest(settings: AstroSettings, fs: typeof fsMod = fsMod): string | null {
	try {
		if (!fs.existsSync(settings.config.publicDir)) {
			return null;
		}
		const files = collectDirectoryFiles(settings.config.publicDir, fs);
		const digest = createHash('sha256');
		for (const file of files) {
			digest.update(file);
			digest.update('\0');
			digest.update(
				createHash('sha256')
					.update(fs.readFileSync(new URL(file, appendDirectoryUrl(settings.config.publicDir))))
					.digest('hex'),
			);
			digest.update('\0');
		}
		return digest.digest('hex');
	} catch {
		return fs.existsSync(settings.config.publicDir) ? 'unreadable' : null;
	}
}

function getReuseInvalidationReason(
	previousState: IncrementalBuildState,
	currentSnapshot: IncrementalBuildSnapshot,
	previousPage: IncrementalBuildPage | undefined,
	currentPage: IncrementalBuildPage,
): string | undefined {
	if (!previousPage) {
		return 'new page';
	}
	if (!previousState.inputDigests) {
		return 'missing previous input digests';
	}
	if (currentPage.routeType !== previousPage.routeType) {
		return 'route type changed';
	}
	if (previousPage.prerender !== currentPage.prerender) {
		return 'prerender setting changed';
	}
	if (previousPage.dependencies.usesDataStore !== currentPage.dependencies.usesDataStore) {
		return 'data store dependency changed';
	}
	if (!arraysEqual(previousPage.dependencies.modules, currentPage.dependencies.modules)) {
		return 'page dependencies changed';
	}
	if (
		!arraysEqual(
			previousPage.dependencies.hydratedComponents,
			currentPage.dependencies.hydratedComponents,
		)
	) {
		return 'hydrated components changed';
	}
	if (
		!arraysEqual(
			previousPage.dependencies.clientOnlyComponents,
			currentPage.dependencies.clientOnlyComponents,
		)
	) {
		return 'client-only components changed';
	}
	if (!arraysEqual(previousPage.dependencies.scripts, currentPage.dependencies.scripts)) {
		return 'page scripts changed';
	}
	if (!arraysEqual(previousPage.assets.styles, currentPage.assets.styles)) {
		return 'page styles changed';
	}
	if (!arraysEqual(previousPage.assets.scripts, currentPage.assets.scripts)) {
		return 'page scripts assets changed';
	}
	if (previousPage.generatedPaths.some((generatedPath) => generatedPath.output === null)) {
		return 'page previously required a fresh render';
	}
	if (currentPage.generatedPaths.some((generatedPath) => generatedPath.output === null)) {
		return 'page currently requires a fresh render';
	}
	for (const inputId of currentPage.dependencies.modules) {
		if (previousState.inputDigests[inputId] !== currentSnapshot.inputDigests[inputId]) {
			return 'page inputs changed';
		}
	}
	if (currentPage.dependencies.usesDataStore && shouldInvalidateFromDataStoreDigest(currentPage)) {
		if (previousState.dataStoreDigest !== currentSnapshot.dataStoreDigest) {
			return 'content store changed';
		}
	}
	return undefined;
}

function shouldInvalidateFromDataStoreDigest(page: IncrementalBuildPage): boolean {
	return !page.dependencies.modules.some((moduleId) => moduleId.startsWith('/src/content/'));
}

function getFullStaticReuseBlockingHooks(settings: AstroSettings): string[] {
	return FULL_STATIC_REUSE_BLOCKING_HOOKS.filter((hookName) =>
		settings.config.integrations.some(
			(integration) => typeof integration.hooks[hookName] === 'function',
		),
	);
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

function inputDigestsEqual(left: Record<string, string>, right: Record<string, string>): boolean {
	const leftKeys = Object.keys(left).sort((first, second) => first.localeCompare(second));
	const rightKeys = Object.keys(right).sort((first, second) => first.localeCompare(second));
	return arraysEqual(leftKeys, rightKeys) && leftKeys.every((key) => left[key] === right[key]);
}

function collectDirectoryFiles(directory: URL, fs: typeof fsMod): string[] {
	const rootPath = normalizePath(fileURLToPath(directory)).replace(/\/$/, '');
	return collectDirectoryFilesAt(directory, fs)
		.map((fileUrl) => normalizePath(fileURLToPath(fileUrl)).slice(rootPath.length + 1))
		.sort((left, right) => left.localeCompare(right));
}

function collectDirectoryFilesAt(directory: URL, fs: typeof fsMod): URL[] {
	const entries = fs
		.readdirSync(directory, { withFileTypes: true })
		.sort((left, right) => left.name.localeCompare(right.name));
	return entries.flatMap((entry) => {
		const entryUrl = new URL(entry.name, appendDirectoryUrl(directory));
		if (entry.isSymbolicLink()) {
			return [];
		}
		if (entry.isDirectory()) {
			return collectDirectoryFilesAt(entryUrl, fs);
		}
		return entry.isFile() ? [entryUrl] : [];
	});
}

function toProjectRelativeId(settings: AstroSettings, id: string): string {
	const normalizedRoot = normalizePath(fileURLToPath(settings.config.root)).replace(/\/$/, '');
	return id === normalizedRoot || id.startsWith(`${normalizedRoot}/`)
		? prependForwardSlash(id.slice(normalizedRoot.length))
		: id;
}

function createIncrementalBuildFingerprint({
	settings,
	mode,
	runtimeMode,
}: IncrementalBuildStateOptions): IncrementalBuildFingerprint {
	const buildOutput = settings.buildOutput;
	if (!buildOutput) {
		throw new Error('Cannot create incremental build state before the build output is known.');
	}

	const {
		adapter: _adapter,
		integrations: _integrations,
		vite: _vite,
		...hashableConfig
	} = settings.config;

	return {
		astroVersion: process.env.ASTRO_VERSION ?? 'unknown',
		mode,
		runtimeMode,
		buildOutput,
		adapterName: settings.adapter?.name ?? null,
		prerendererName: getPrerendererName(settings),
		integrationNames: settings.config.integrations.map((integration) => integration.name),
		rendererNames: settings.renderers.map((renderer) => renderer.name),
		configDigest: createDigest(hashableConfig),
		viteConfigDigest: createDigest(settings.config.vite ?? null),
		integrationHooksDigest: createDigest(
			settings.config.integrations.map((integration) => ({
				name: integration.name,
				hooks: Object.keys(integration.hooks)
					.filter((hookName) => hookName.startsWith('astro:build:'))
					.sort((left, right) => left.localeCompare(right)),
			})),
		),
		projectMetadataDigest: getProjectMetadataDigest(settings, mode),
		buildImplementationDigest: getBuildImplementationDigest(),
	};
}

function createIncrementalBuildArtifacts(
	settings: Pick<AstroSettings, 'config'>,
): IncrementalBuildArtifacts {
	return {
		outDir: settings.config.outDir.toString(),
		clientDir: settings.config.build.client.toString(),
		serverDir: settings.config.build.server.toString(),
		cacheDir: settings.config.cacheDir.toString(),
	};
}

function getPrerendererName(settings: Pick<AstroSettings, 'prerenderer'>): string | null {
	const prerenderer = settings.prerenderer;
	if (!prerenderer) {
		return null;
	}
	if (typeof prerenderer === 'function') {
		return 'factory';
	}
	return prerenderer.name ?? 'custom';
}

function createDigest(value: unknown): string {
	const serialized = JSON.stringify(normalizeDigestValue(value, new WeakSet<object>()));
	return createHash('sha256').update(serialized).digest('hex');
}

function normalizeDigestValue(value: unknown, seen: WeakSet<object>): unknown {
	if (
		value === null ||
		typeof value === 'string' ||
		typeof value === 'number' ||
		typeof value === 'boolean'
	) {
		return value;
	}
	if (typeof value === 'bigint') {
		return value.toString();
	}
	if (typeof value === 'symbol') {
		return value.description ?? '';
	}
	if (typeof value === 'function') {
		return `[Function:${value.name || 'anonymous'}]`;
	}
	if (value instanceof URL || value instanceof Date || value instanceof RegExp) {
		return value.toString();
	}
	if (Array.isArray(value)) {
		return value.map((entry) => normalizeDigestValue(entry, seen));
	}
	if (value instanceof Map) {
		return Array.from(value.entries())
			.map(([key, entryValue]) => [
				normalizeDigestValue(key, seen),
				normalizeDigestValue(entryValue, seen),
			])
			.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
	}
	if (value instanceof Set) {
		return Array.from(value.values())
			.map((entry) => normalizeDigestValue(entry, seen))
			.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
	}
	if (value && typeof value === 'object') {
		if (seen.has(value)) {
			return '[Circular]';
		}
		seen.add(value);
		const normalized = Object.fromEntries(
			Object.entries(value)
				.filter(([, entryValue]) => entryValue !== undefined)
				.sort(([left], [right]) => left.localeCompare(right))
				.map(([key, entryValue]) => [key, normalizeDigestValue(entryValue, seen)]),
		);
		seen.delete(value);
		return normalized;
	}
	return String(value);
}

function getInvalidationReason(
	previous: IncrementalBuildFingerprint,
	current: IncrementalBuildFingerprint,
): string | undefined {
	if (previous.astroVersion !== current.astroVersion) {
		return 'Astro version changed';
	}
	if (previous.mode !== current.mode) {
		return 'build mode changed';
	}
	if (previous.runtimeMode !== current.runtimeMode) {
		return 'runtime mode changed';
	}
	if (previous.buildOutput !== current.buildOutput) {
		return 'build output changed';
	}
	if (previous.adapterName !== current.adapterName) {
		return 'adapter changed';
	}
	if (previous.prerendererName !== current.prerendererName) {
		return 'prerenderer changed';
	}
	if (!arraysEqual(previous.integrationNames, current.integrationNames)) {
		return 'integrations changed';
	}
	if (!arraysEqual(previous.rendererNames, current.rendererNames)) {
		return 'renderers changed';
	}
	if (previous.configDigest !== current.configDigest) {
		return 'Astro config changed';
	}
	if (previous.viteConfigDigest !== current.viteConfigDigest) {
		return 'Vite config changed';
	}
	if (previous.integrationHooksDigest !== current.integrationHooksDigest) {
		return 'integration build hooks changed';
	}
	if (previous.projectMetadataDigest !== current.projectMetadataDigest) {
		return 'project metadata changed';
	}
	if (previous.buildImplementationDigest !== current.buildImplementationDigest) {
		return 'Astro build implementation changed';
	}
	return undefined;
}

function arraysEqual(left: string[], right: string[]) {
	if (left.length !== right.length) {
		return false;
	}
	return left.every((value, index) => value === right[index]);
}

function pathnameToPageName(settings: AstroSettings, pathname: string): string {
	return shouldAppendForwardSlash(settings.config.trailingSlash, settings.config.build.format)
		? pathname.replace(/\/?$/, '/').replace(/^\//, '')
		: pathname.replace(/^\//, '');
}

function appendDirectoryUrl(directory: URL | string): URL {
	const value = typeof directory === 'string' ? directory : directory.toString();
	return new URL(value.endsWith('/') ? value : `${value}/`);
}

function getIncrementalBuildStateFileName({
	settings,
	mode,
	runtimeMode,
}: IncrementalBuildStateOptions): string {
	return `${INCREMENTAL_BUILD_STATE_FILE_BASENAME}.${createIncrementalBuildStateConsumerKey({
		settings,
		mode,
		runtimeMode,
	})}.json`;
}

function createIncrementalBuildStateConsumerKey({
	settings,
	mode,
	runtimeMode,
}: IncrementalBuildStateOptions): string {
	const buildOutput = settings.buildOutput;
	if (!buildOutput) {
		throw new Error('Cannot resolve incremental build state before the build output is known.');
	}
	return createDigest({
		root: settings.config.root.toString(),
		mode,
		runtimeMode,
		buildOutput,
		outDir: settings.config.outDir.toString(),
		clientDir: settings.config.build.client.toString(),
		serverDir: settings.config.build.server.toString(),
	}).slice(0, 12);
}

function isIncrementalBuildStateFileName(fileName: string): boolean {
	return INCREMENTAL_BUILD_STATE_FILE_REGEX.test(fileName);
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

function getProjectMetadataDigest(
	settings: AstroSettings,
	mode: string,
	fs: typeof fsMod = fsMod,
): string {
	const rootDirectory = appendDirectoryUrl(settings.config.root);
	const metadataFiles = [
		...PROJECT_METADATA_FILES,
		'.env',
		'.env.local',
		`.env.${mode}`,
		`.env.${mode}.local`,
	];
	return createHash('sha256')
		.update(
			JSON.stringify(
				metadataFiles
					.map((relativePath) => [
						relativePath,
						createFileDigest(fileURLToPath(new URL(relativePath, rootDirectory)), fs),
					])
					.sort(([left], [right]) => left.localeCompare(right)),
			),
		)
		.digest('hex');
}

function getBuildImplementationDigest(fs: typeof fsMod = fsMod): string {
	const currentFilePath = fileURLToPath(import.meta.url);
	const currentExtension = path.extname(currentFilePath);
	const currentDirectory = path.dirname(currentFilePath);
	return createHash('sha256')
		.update(
			JSON.stringify(
				BUILD_IMPLEMENTATION_FILES.map((relativePath) => [
					relativePath,
					createFileDigest(path.join(currentDirectory, `${relativePath}${currentExtension}`), fs),
				]),
			),
		)
		.digest('hex');
}

function isIncrementalBuildState(value: unknown): value is IncrementalBuildState {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const candidate = value as Partial<IncrementalBuildState>;
	return (
		candidate.version === INCREMENTAL_BUILD_STATE_VERSION &&
		typeof candidate.generatedAt === 'string' &&
		isFingerprint(candidate.fingerprint) &&
		isArtifacts(candidate.artifacts) &&
		isSummary(candidate.summary) &&
		(candidate.inputDigests === undefined || isInputDigests(candidate.inputDigests)) &&
		(candidate.dataStoreDigest === undefined ||
			typeof candidate.dataStoreDigest === 'string' ||
			candidate.dataStoreDigest === null) &&
		(candidate.publicDirDigest === undefined ||
			typeof candidate.publicDirDigest === 'string' ||
			candidate.publicDirDigest === null) &&
		(candidate.pages === undefined || isPages(candidate.pages))
	);
}

function isFingerprint(value: unknown): value is IncrementalBuildFingerprint {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const candidate = value as Partial<IncrementalBuildFingerprint>;
	return (
		typeof candidate.astroVersion === 'string' &&
		typeof candidate.mode === 'string' &&
		(candidate.runtimeMode === 'development' || candidate.runtimeMode === 'production') &&
		(candidate.buildOutput === 'static' || candidate.buildOutput === 'server') &&
		(typeof candidate.adapterName === 'string' || candidate.adapterName === null) &&
		(typeof candidate.prerendererName === 'string' || candidate.prerendererName === null) &&
		Array.isArray(candidate.integrationNames) &&
		candidate.integrationNames.every((entry) => typeof entry === 'string') &&
		Array.isArray(candidate.rendererNames) &&
		candidate.rendererNames.every((entry) => typeof entry === 'string') &&
		typeof candidate.configDigest === 'string' &&
		typeof candidate.viteConfigDigest === 'string' &&
		typeof candidate.integrationHooksDigest === 'string' &&
		typeof candidate.projectMetadataDigest === 'string' &&
		typeof candidate.buildImplementationDigest === 'string'
	);
}

function isArtifacts(value: unknown): value is IncrementalBuildArtifacts {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const candidate = value as Partial<IncrementalBuildArtifacts>;
	return (
		typeof candidate.outDir === 'string' &&
		typeof candidate.clientDir === 'string' &&
		typeof candidate.serverDir === 'string' &&
		typeof candidate.cacheDir === 'string'
	);
}

function isSummary(value: unknown): value is IncrementalBuildSummary {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const candidate = value as Partial<IncrementalBuildSummary>;
	return typeof candidate.pageCount === 'number' && typeof candidate.buildTimeMs === 'number';
}

function isPages(value: unknown): value is IncrementalBuildPage[] {
	if (!Array.isArray(value)) {
		return false;
	}
	return value.every((page) => isPage(page));
}

function isPage(value: unknown): value is IncrementalBuildPage {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const candidate = value as Partial<IncrementalBuildPage>;
	return (
		typeof candidate.key === 'string' &&
		typeof candidate.route === 'string' &&
		typeof candidate.component === 'string' &&
		typeof candidate.moduleSpecifier === 'string' &&
		typeof candidate.routeType === 'string' &&
		typeof candidate.prerender === 'boolean' &&
		isPageDependencies(candidate.dependencies) &&
		isPageAssets(candidate.assets) &&
		isGeneratedPaths(candidate.generatedPaths)
	);
}

function isPageDependencies(value: unknown): value is IncrementalBuildPageDependencies {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const candidate = value as Partial<IncrementalBuildPageDependencies>;
	return (
		Array.isArray(candidate.modules) &&
		candidate.modules.every((entry) => typeof entry === 'string') &&
		Array.isArray(candidate.hydratedComponents) &&
		candidate.hydratedComponents.every((entry) => typeof entry === 'string') &&
		Array.isArray(candidate.clientOnlyComponents) &&
		candidate.clientOnlyComponents.every((entry) => typeof entry === 'string') &&
		Array.isArray(candidate.scripts) &&
		candidate.scripts.every((entry) => typeof entry === 'string') &&
		typeof candidate.usesDataStore === 'boolean'
	);
}

function isPageAssets(value: unknown): value is IncrementalBuildPageAssets {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const candidate = value as Partial<IncrementalBuildPageAssets>;
	return (
		Array.isArray(candidate.styles) &&
		candidate.styles.every((entry) => typeof entry === 'string') &&
		Array.isArray(candidate.scripts) &&
		candidate.scripts.every((entry) => typeof entry === 'string')
	);
}

function isInputDigests(value: unknown): value is Record<string, string> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	return Object.values(value).every((entry) => typeof entry === 'string');
}

function isGeneratedPaths(value: unknown): value is IncrementalBuildGeneratedPath[] {
	if (!Array.isArray(value)) {
		return false;
	}
	return value.every((entry) => {
		if (!entry || typeof entry !== 'object') {
			return false;
		}
		const candidate = entry as Partial<IncrementalBuildGeneratedPath>;
		return (
			typeof candidate.pathname === 'string' &&
			(typeof candidate.output === 'string' || candidate.output === null)
		);
	});
}

function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
