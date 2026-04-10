import fsMod from 'node:fs';
import type { AstroSettings } from '../../../types/astro.js';
import type { RuntimeMode } from '../../../types/public/config.js';
import type { AstroLogger } from '../../logger/core.js';
import { appendDirectoryUrl, createDigest, getErrorMessage } from './common.js';
import { getPublicDirDigest } from './dependencies.js';
import {
	createIncrementalBuildArtifacts,
	createIncrementalBuildFingerprint,
	getIncrementalBuildInvalidationReason,
} from './fingerprint.js';
import { createIncrementalBuildSnapshot } from './snapshot.js';
import type { BuildInternals } from '../internal.js';
import type { AllPagesData } from '../types.js';
import {
	INCREMENTAL_BUILD_STATE_VERSION,
	type IncrementalBuildArtifacts,
	type IncrementalBuildDataDigests,
	type IncrementalBuildDependencyDigests,
	type IncrementalBuildFingerprint,
	type IncrementalBuildGeneratedPath,
	type IncrementalBuildPage,
	type IncrementalBuildPageAssets,
	type IncrementalBuildPageDependencies,
	type IncrementalBuildState,
	type IncrementalBuildSummary,
	type LoadedIncrementalBuildState,
} from './types.js';

const INCREMENTAL_BUILD_STATE_FILE_BASENAME = 'incremental-build-state';
const INCREMENTAL_BUILD_STATE_FILE_REGEX =
	/^incremental-build-state(?:\.[a-f0-9]+)?\.json(?:\.\d+\.\d+\.tmp)?$/;

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
	logger: AstroLogger;
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
	logger: AstroLogger;
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

	const invalidationReason = getIncrementalBuildInvalidationReason(
		parsedState.fingerprint,
		currentFingerprint,
	);
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
					dependencyDigests: snapshot.dependencyDigests,
					dataDigests: snapshot.dataDigests,
					pages: snapshot.pages,
				}
			: {}),
	};
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
	logger: AstroLogger;
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
		(candidate.dependencyDigests === undefined ||
			isDependencyDigests(candidate.dependencyDigests)) &&
		(candidate.dataDigests === undefined || isDataDigests(candidate.dataDigests)) &&
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
		Array.isArray(candidate.data) &&
		candidate.data.every((entry) => typeof entry === 'string')
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

function isDependencyDigests(value: unknown): value is IncrementalBuildDependencyDigests {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	return Object.values(value).every((entry) => typeof entry === 'string');
}

function isDataDigests(value: unknown): value is IncrementalBuildDataDigests {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	return Object.values(value).every((entry) => typeof entry === 'string' || entry === null);
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
