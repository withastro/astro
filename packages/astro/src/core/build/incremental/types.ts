import type { AstroSettings } from '../../../types/astro.js';
import type { RuntimeMode } from '../../../types/public/config.js';

export const INCREMENTAL_BUILD_STATE_VERSION = 4 as const;
export const FILE_DEPENDENCY_KEY_PREFIX = 'file:' as const;
export const DATA_DEPENDENCY_KEY_PREFIX = 'data:' as const;
export const CONTENT_STORE_DATA_DEPENDENCY_KEY =
	`${DATA_DEPENDENCY_KEY_PREFIX}content-store` as const;
export const FULL_STATIC_REUSE_BLOCKING_HOOKS = [
	'astro:build:setup',
	'astro:build:ssr',
	'astro:build:generated',
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

export type IncrementalBuildDependencyKey = string;
export type IncrementalBuildDependencyDigests = Record<IncrementalBuildDependencyKey, string>;
export type IncrementalBuildDataDigests = Record<IncrementalBuildDependencyKey, string | null>;

export interface IncrementalBuildPageDependencies {
	modules: IncrementalBuildDependencyKey[];
	hydratedComponents: IncrementalBuildDependencyKey[];
	clientOnlyComponents: IncrementalBuildDependencyKey[];
	scripts: IncrementalBuildDependencyKey[];
	data: IncrementalBuildDependencyKey[];
}

export interface IncrementalBuildPageAssets {
	styles: string[];
	scripts: string[];
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

export interface IncrementalBuildState {
	version: typeof INCREMENTAL_BUILD_STATE_VERSION;
	generatedAt: string;
	fingerprint: IncrementalBuildFingerprint;
	artifacts: IncrementalBuildArtifacts;
	summary: IncrementalBuildSummary;
	dependencyDigests?: IncrementalBuildDependencyDigests;
	dataDigests?: IncrementalBuildDataDigests;
	publicDirDigest?: string | null;
	pages?: IncrementalBuildPage[];
}

export interface IncrementalBuildSnapshot {
	dependencyDigests: IncrementalBuildDependencyDigests;
	dataDigests: IncrementalBuildDataDigests;
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
