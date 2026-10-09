import type { PathWithRoute } from '../../types/public/integrations.js';
import { VIRTUAL_PAGE_RESOLVED_MODULE_ID } from '../../vite-plugin-pages/const.js';

export interface PrerenderChunk {
	fileName: string;
	facadeModuleId: string | null;
	imports: string[];
	dynamicImports: string[];
	code: string;
}

export function computeRouteUniqueBytes(chunks: PrerenderChunk[]): Map<string, number> {
	const chunksByFileName = new Map(chunks.map((chunk) => [chunk.fileName, chunk]));
	const routeEntries = new Map<string, PrerenderChunk>();
	for (const chunk of chunks) {
		if (!chunk.facadeModuleId?.startsWith(VIRTUAL_PAGE_RESOLVED_MODULE_ID)) continue;
		const component = chunk.facadeModuleId
			.slice(VIRTUAL_PAGE_RESOLVED_MODULE_ID.length)
			.replaceAll('@_@', '.');
		routeEntries.set(component, chunk);
	}

	const collectClosure = (entry: PrerenderChunk) => {
		const closure = new Set<PrerenderChunk>();
		const pending = [entry];
		while (pending.length > 0) {
			const chunk = pending.pop()!;
			if (closure.has(chunk)) continue;
			closure.add(chunk);
			for (const fileName of chunk.imports) {
				const dependency = chunksByFileName.get(fileName);
				if (dependency) pending.push(dependency);
			}
			for (const fileName of chunk.dynamicImports) {
				const dependency = chunksByFileName.get(fileName);
				if (dependency) pending.push(dependency);
			}
		}
		return closure;
	};

	const usage = new Map<PrerenderChunk, number>();
	for (const entry of routeEntries.values()) {
		for (const chunk of collectClosure(entry)) usage.set(chunk, (usage.get(chunk) ?? 0) + 1);
	}

	const routeUniqueBytes = new Map<string, number>();
	for (const [component, entry] of routeEntries) {
		let uniqueBytes = 0;
		for (const chunk of collectClosure(entry)) {
			if (usage.get(chunk) === 1) uniqueBytes += Buffer.byteLength(chunk.code);
		}
		routeUniqueBytes.set(component, uniqueBytes);
	}
	return routeUniqueBytes;
}

export function assignRouteWorkers(
	paths: PathWithRoute[],
	routeUniqueBytes: Map<string, number>,
	workerCount: number,
	uniqueByteThreshold = 256 * 1024,
): Map<string, Set<number>> {
	const jobCountByComponent = new Map<string, number>();
	const routeTypeByComponent = new Map<string, PathWithRoute['route']['type']>();
	for (const { route } of paths) {
		jobCountByComponent.set(route.component, (jobCountByComponent.get(route.component) ?? 0) + 1);
		routeTypeByComponent.set(route.component, route.type);
	}

	const averageJobsPerWorker = Math.max(paths.length / workerCount, 1);
	const assignments = new Map<string, Set<number>>();
	let cursor = 0;
	for (const [component, jobCount] of jobCountByComponent) {
		const endpoint = routeTypeByComponent.get(component) === 'endpoint';
		if (!endpoint && (routeUniqueBytes.get(component) ?? 0) < uniqueByteThreshold) continue;

		const width = endpoint
			? Math.min(2, workerCount)
			: Math.min(workerCount, Math.max(1, Math.ceil(jobCount / averageJobsPerWorker)));
		const workers = new Set<number>();
		for (let offset = 0; offset < width; offset++) workers.add((cursor + offset) % workerCount);
		assignments.set(component, workers);
		cursor = (cursor + width) % workerCount;
	}
	return assignments;
}
