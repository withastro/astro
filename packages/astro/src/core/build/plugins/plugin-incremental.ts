import crypto from 'node:crypto';
import fs from 'node:fs';
import type { Plugin as VitePlugin } from 'vite';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../../constants.js';
import { moduleIsTopLevelPage } from '../graph.js';
import type { BuildInternals } from '../internal.js';
import { getPageDataByViteID } from '../internal.js';

/**
 * Captures a dependency hash for each prerendered page route during the Rolldown build.
 * The hash is derived from the sorted set of all transitive module dependencies of the page,
 * so any change to the page's template, layouts, components, or utilities will produce a
 * different hash.
 */
export function pluginIncremental(internals: BuildInternals): VitePlugin {
	return {
		name: '@astro/plugin-incremental',
		applyToEnvironment(environment) {
			return environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender;
		},
		generateBundle() {
			const hashes = new Map<string, string>();

			for (const id of this.getModuleIds()) {
				const info = this.getModuleInfo(id);
				if (!info) continue;
				if (!moduleIsTopLevelPage(info)) continue;

				const pageData = getPageDataByViteID(internals, info.id);
				if (!pageData) continue;

				// Walk downward through the dependency graph to collect all transitive deps
				const deps = new Set<string>();
				const queue = [info.id];
				while (queue.length > 0) {
					const current = queue.pop()!;
					if (deps.has(current)) continue;
					deps.add(current);

					const modInfo = this.getModuleInfo(current);
					if (!modInfo) continue;

					for (const dep of modInfo.importedIds) {
						if (!deps.has(dep)) queue.push(dep);
					}
					for (const dep of modInfo.dynamicallyImportedIds) {
						if (!deps.has(dep)) queue.push(dep);
					}
				}

				// Hash the sorted dependency set and any source file contents we can read.
				const sorted = [...deps].sort();
				const hasher = crypto.createHash('sha256');
				for (const dep of sorted) {
					hasher.update(dep);
					hasher.update('\n');
					const filePath = getReadableFilePath(dep);
					if (filePath) {
						try {
							hasher.update(fs.readFileSync(filePath));
						} catch {
							// The dependency may be virtual or generated. The module id above still
							// participates in the hash, which is enough to track graph shape changes.
						}
					}
					hasher.update('\n');
				}
				const hash = hasher.digest('hex');

				// Key by component path (e.g. "src/pages/blog/[slug].astro")
				hashes.set(pageData.component, hash);
			}

			internals.pageDependencyHashes = hashes;
		},
	};
}

function getReadableFilePath(id: string): string | undefined {
	if (id[0] === '\0') return undefined;
	const [pathWithoutQuery] = id.replace(/^\/@fs/, '').split('?');
	if (!pathWithoutQuery || !fs.existsSync(pathWithoutQuery)) return undefined;
	return pathWithoutQuery;
}
