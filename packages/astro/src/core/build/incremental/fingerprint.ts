import fsMod from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import type { AstroSettings } from '../../../types/astro.js';
import type { RuntimeMode } from '../../../types/public/config.js';
import { appendDirectoryUrl, arraysEqual, createDigest } from './common.js';
import { createFileDigest } from './dependencies.js';
import type { IncrementalBuildArtifacts, IncrementalBuildFingerprint } from './types.js';

const PROJECT_METADATA_FILES = [
	'package.json',
	'pnpm-lock.yaml',
	'package-lock.json',
	'yarn.lock',
	'bun.lock',
	'bun.lockb',
] as const;

const BUILD_IMPLEMENTATION_FILES = [
	'../build-state',
	'../index',
	'../generate',
	'../static-build',
	'../internal',
	'../default-prerenderer',
	'../plugins/plugin-analyzer',
	'../plugins/plugin-manifest',
	'common',
	'dependencies',
	'fingerprint',
	'planner',
	'reuse',
	'snapshot',
	'state',
	'types',
] as const;

interface IncrementalBuildStateOptions {
	settings: AstroSettings;
	mode: string;
	runtimeMode: RuntimeMode;
}

export function createIncrementalBuildFingerprint({
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

export function createIncrementalBuildArtifacts(
	settings: Pick<AstroSettings, 'config'>,
): IncrementalBuildArtifacts {
	return {
		outDir: settings.config.outDir.toString(),
		clientDir: settings.config.build.client.toString(),
		serverDir: settings.config.build.server.toString(),
		cacheDir: settings.config.cacheDir.toString(),
	};
}

export function getIncrementalBuildInvalidationReason(
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
