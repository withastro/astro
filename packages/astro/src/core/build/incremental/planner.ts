import fsMod from 'node:fs';
import { arraysEqual } from './common.js';
import {
	CONTENT_STORE_DATA_DEPENDENCY_KEY,
	FILE_DEPENDENCY_KEY_PREFIX,
	type IncrementalBuildDependencyKey,
	type IncrementalBuildRenderPlan,
	type IncrementalBuildSnapshot,
	type IncrementalBuildState,
	type IncrementalBuildPage,
	type IncrementalPageRenderPlan,
} from './types.js';

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

function getReuseInvalidationReason(
	previousState: IncrementalBuildState,
	currentSnapshot: IncrementalBuildSnapshot,
	previousPage: IncrementalBuildPage | undefined,
	currentPage: IncrementalBuildPage,
): string | undefined {
	if (!previousPage) {
		return 'new page';
	}
	if (!previousState.dependencyDigests) {
		return 'missing previous dependency digests';
	}
	if (!previousState.dataDigests) {
		return 'missing previous data digests';
	}
	if (currentPage.routeType !== previousPage.routeType) {
		return 'route type changed';
	}
	if (previousPage.prerender !== currentPage.prerender) {
		return 'prerender setting changed';
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
	if (!arraysEqual(previousPage.dependencies.data, currentPage.dependencies.data)) {
		return 'page data dependencies changed';
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
	for (const dependencyKey of getPageFileDependencyKeys(currentPage)) {
		if (
			previousState.dependencyDigests[dependencyKey] !==
			currentSnapshot.dependencyDigests[dependencyKey]
		) {
			return 'page dependencies changed';
		}
	}
	for (const dataDependencyKey of currentPage.dependencies.data) {
		if (!shouldInvalidateFromDataDependency(currentPage, dataDependencyKey)) {
			continue;
		}
		if (
			previousState.dataDigests[dataDependencyKey] !==
			currentSnapshot.dataDigests[dataDependencyKey]
		) {
			return dataDependencyKey === CONTENT_STORE_DATA_DEPENDENCY_KEY
				? 'content store changed'
				: 'data dependencies changed';
		}
	}
	return undefined;
}

function shouldInvalidateFromDataDependency(
	page: IncrementalBuildPage,
	key: IncrementalBuildDependencyKey,
): boolean {
	if (key !== CONTENT_STORE_DATA_DEPENDENCY_KEY) {
		return true;
	}
	return !page.dependencies.modules.some((moduleId) =>
		moduleId.startsWith(`${FILE_DEPENDENCY_KEY_PREFIX}/src/content/`),
	);
}

function getPageFileDependencyKeys(page: IncrementalBuildPage): IncrementalBuildDependencyKey[] {
	return Array.from(
		new Set([
			...page.dependencies.modules,
			...page.dependencies.hydratedComponents,
			...page.dependencies.clientOnlyComponents,
			...page.dependencies.scripts,
		]),
	).sort((left, right) => left.localeCompare(right));
}
