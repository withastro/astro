import { normalizePath, type Plugin } from 'vite';
import type { RouterRegistry } from './internal/registry.js';

/** Module generated from the fetch handler and render context registrations. */
export const PIPELINE_MODULE_ID = 'virtual:astro:pipeline';
const RESOLVED_PIPELINE_MODULE_ID = '\0' + PIPELINE_MODULE_ID;

/**
 * Serves `virtual:astro:pipeline` (a `PipelineModule`) to server environments. Loading it freezes
 * the registry.
 */
export function pipelineModulePlugin(registry: RouterRegistry): Plugin {
	return {
		name: '@astrojs/vite-plugin-router:pipeline',
		applyToEnvironment(environment) {
			return environment.config.consumer === 'server';
		},
		resolveId: {
			filter: { id: new RegExp(`^${PIPELINE_MODULE_ID}$`) },
			handler() {
				return RESOLVED_PIPELINE_MODULE_ID;
			},
		},
		load: {
			filter: { id: new RegExp(`^${RESOLVED_PIPELINE_MODULE_ID}$`) },
			handler() {
				registry.freeze();
				return { code: createPipelineModuleCode(registry) };
			},
		},
	};
}

export function createPipelineModuleCode(registry: RouterRegistry): string {
	const imports: string[] = [];
	const handlers: string[] = [];
	const extensions: string[] = [];
	registry.fetchHandlers.forEach(({ name, entrypoint, order }, i) => {
		imports.push(`import _handler${i} from ${JSON.stringify(normalizePath(entrypoint))};`);
		handlers.push(
			`{ name: ${JSON.stringify(name)}, order: ${JSON.stringify(order)}, handler: _handler${i} }`,
		);
	});
	let i = 0;
	for (const [key, entrypoint] of registry.renderContextExtensions) {
		imports.push(`import _extension${i} from ${JSON.stringify(normalizePath(entrypoint))};`);
		extensions.push(`{ key: ${JSON.stringify(key)}, extension: _extension${i} }`);
		i++;
	}
	return [
		...imports,
		`export const fetchHandlers = [${handlers.join(', ')}];`,
		`export const renderContextExtensions = [${extensions.join(', ')}];`,
	].join('\n');
}

/**
 * Returns the import statements of the `extendRouting()` modules, for the top of the manifest
 * module. Pair with `createManifestExtensionsCode()`, which references the imported bindings.
 */
export function createManifestImportsCode(registry: RouterRegistry): string {
	return registry.routingExtensions
		.map(
			(entrypoint, i) => `import _routing${i} from ${JSON.stringify(normalizePath(entrypoint))};`,
		)
		.join('\n');
}

/**
 * Returns the manifest object-literal entries for the `extendManifest()` registrations and the
 * pipeline module, each as `key: () => import(id),`, and the `routing` list of the
 * `extendRouting()` modules. Freezes the registry.
 */
export function createManifestExtensionsCode(registry: RouterRegistry): string {
	registry.freeze();
	let code = `pipeline: () => import(${JSON.stringify(PIPELINE_MODULE_ID)}),\n`;
	code += `routing: [${registry.routingExtensions.map((_, i) => `_routing${i}`).join(', ')}],\n`;
	for (const [key, moduleId] of registry.manifestExtensions) {
		code += `${JSON.stringify(key)}: () => import(${JSON.stringify(moduleId)}),\n`;
	}
	return code;
}
