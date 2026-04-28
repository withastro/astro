import fsMod from 'node:fs';
import { createHash } from 'node:crypto';
import type { AstroSettings } from '../../../types/astro.js';
import { BEFORE_HYDRATION_SCRIPT_ID, PAGE_SCRIPT_ID } from '../../../vite-plugin-scripts/index.js';
import type { BuildInternals, PageBuildDependencies } from '../internal.js';
import { cssOrder, mergeInlineCss } from '../runtime.js';
import type { AllPagesData } from '../types.js';
import {
	CONTENT_STORE_DATA_DEPENDENCY_KEY,
	type IncrementalBuildDependencyKey,
	type IncrementalBuildGeneratedPath,
	type IncrementalBuildPageAssets,
	type IncrementalBuildSnapshot,
} from './types.js';
import {
	addDependencyKeys,
	createDataDigests,
	createDependencyDigests,
	createFileDependencyKey,
	createFileDependencyKeys,
	normalizeTrackedDependencyId,
	usesContentDataStore,
} from './dependencies.js';

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
	const trackedDependencyKeys = new Set<IncrementalBuildDependencyKey>();
	const trackedDataKeys = new Set<IncrementalBuildDependencyKey>();

	const pages = Object.values(allPages)
		.map((pageData) => {
			const pageDependencies = internals.pageDependencies.get(pageData.key);
			const normalizedModuleSpecifier = normalizeTrackedDependencyId(
				settings,
				pageData.moduleSpecifier,
			);
			const modules = new Set<IncrementalBuildDependencyKey>();
			const data = new Set<IncrementalBuildDependencyKey>();
			const pageModuleKey = createFileDependencyKey(settings, pageData.moduleSpecifier, fs);
			const hydratedComponentKeys = createFileDependencyKeys(
				settings,
				pageDependencies?.hydratedComponents,
				fs,
			);
			const clientOnlyComponentKeys = createFileDependencyKeys(
				settings,
				pageDependencies?.clientOnlyComponents,
				fs,
			);
			const scriptKeys = createFileDependencyKeys(settings, pageDependencies?.scripts, fs);

			if (pageModuleKey) {
				modules.add(pageModuleKey);
				trackedDependencyKeys.add(pageModuleKey);
			}

			for (const rawModuleId of pageDependencies?.modules ?? []) {
				if (usesContentDataStore(rawModuleId)) {
					data.add(CONTENT_STORE_DATA_DEPENDENCY_KEY);
					trackedDataKeys.add(CONTENT_STORE_DATA_DEPENDENCY_KEY);
				}
				const moduleKey = createFileDependencyKey(settings, rawModuleId, fs);
				if (!moduleKey) {
					continue;
				}
				modules.add(moduleKey);
				trackedDependencyKeys.add(moduleKey);
			}
			addDependencyKeys(trackedDependencyKeys, hydratedComponentKeys);
			addDependencyKeys(trackedDependencyKeys, clientOnlyComponentKeys);
			addDependencyKeys(trackedDependencyKeys, scriptKeys);

			return {
				key: pageData.key,
				route: pageData.route.route,
				component: pageData.component,
				moduleSpecifier: normalizedModuleSpecifier,
				routeType: pageData.route.type,
				prerender: pageData.route.prerender,
				dependencies: {
					modules: Array.from(modules).sort((left, right) => left.localeCompare(right)),
					hydratedComponents: hydratedComponentKeys,
					clientOnlyComponents: clientOnlyComponentKeys,
					scripts: scriptKeys,
					data: Array.from(data).sort((left, right) => left.localeCompare(right)),
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
		dependencyDigests: createDependencyDigests(settings, trackedDependencyKeys, fs),
		dataDigests: createDataDigests(settings, trackedDataKeys, fs),
		pages,
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
