import { hydrationSpecifier } from './util.js';

interface ModuleInfo {
	module: Record<string, any>;
	specifier: string;
}

interface ComponentMetadata {
	componentExport: string;
	componentUrl: string;
}

interface CreateMetadataOptions {
	modules: ModuleInfo[];
	hydratedComponents: any[];
	hydrationDirectives: Set<string>;
	hoisted: any[];
}

export class Metadata {
	public mockURL: URL;
	public modules: ModuleInfo[];
	public hoisted: any[];
	public hydratedComponents: any[];
	public hydrationDirectives: Set<string>;

	private metadataCache: Map<any, ComponentMetadata | null>;

	constructor(filePathname: string, opts: CreateMetadataOptions) {
		this.modules = opts.modules;
		this.hoisted = opts.hoisted;
		this.hydratedComponents = opts.hydratedComponents;
		this.hydrationDirectives = opts.hydrationDirectives;
		this.mockURL = new URL(filePathname, 'http://example.com');
		this.metadataCache = new Map<any, ComponentMetadata | null>();
	}

	resolvePath(specifier: string): string {
		return specifier.startsWith('.') ? new URL(specifier, this.mockURL).pathname : specifier;
	}

	getPath(Component: any): string | null {
		const metadata = this.getComponentMetadata(Component);
		return metadata?.componentUrl || null;
	}

	getExport(Component: any): string | null {
		const metadata = this.getComponentMetadata(Component);
		return metadata?.componentExport || null;
	}

	/**
	 * Gets the paths of all hydrated components within this component
	 * and children components.
	 */
	*hydratedComponentPaths() {
		const found = new Set<string>();
		for (const metadata of this.deepMetadata()) {
			for (const component of metadata.hydratedComponents) {
				const path = metadata.getPath(component);
				if (path && !found.has(path)) {
					found.add(path);
					yield path;
				}
			}
		}
	}

	/**
	 * Gets all of the hydration specifiers used within this component.
	 */
	*hydrationDirectiveSpecifiers() {
		const found = new Set<string>();
		for (const metadata of this.deepMetadata()) {
			for (const directive of metadata.hydrationDirectives) {
				if (!found.has(directive)) {
					found.add(directive);
					yield hydrationSpecifier(directive);
				}
			}
		}
	}

	* hoistedScriptPaths() {
		for(const metadata of this.deepMetadata()) {
			let i = 0, pathname = metadata.mockURL.pathname;
			while(i < metadata.hoisted.length) {
				yield `${pathname}?astro&type=script&index=${i}`;
				i++;
			}
		}
	}

	private *deepMetadata(): Generator<Metadata, void, unknown> {
		// Yield self
		yield this;
		// Keep a Set of metadata objects so we only yield them out once.
		const seen = new Set<Metadata>();
		for (const { module: mod } of this.modules) {
			if (typeof mod.$$metadata !== 'undefined') {
				const md = mod.$$metadata as Metadata;
				// Call children deepMetadata() which will yield the child metadata
				// and any of its children metadatas
				for (const childMetdata of md.deepMetadata()) {
					if (!seen.has(childMetdata)) {
						seen.add(childMetdata);
						yield childMetdata;
					}
				}
			}
		}
	}

	private getComponentMetadata(Component: any): ComponentMetadata | null {
		if (this.metadataCache.has(Component)) {
			return this.metadataCache.get(Component)!;
		}
		const metadata = this.findComponentMetadata(Component);
		this.metadataCache.set(Component, metadata);
		return metadata;
	}

	private findComponentMetadata(Component: any): ComponentMetadata | null {
		const isCustomElement = typeof Component === 'string';
		for (const { module, specifier } of this.modules) {
			const id = this.resolvePath(specifier);
			for (const [key, value] of Object.entries(module)) {
				if (isCustomElement) {
					if (key === 'tagName' && Component === value) {
						return {
							componentExport: key,
							componentUrl: id,
						};
					}
				} else if (Component === value) {
					return {
						componentExport: key,
						componentUrl: id,
					};
				}
			}
		}
		return null;
	}
}

export function createMetadata(filePathname: string, options: CreateMetadataOptions) {
	return new Metadata(filePathname, options);
}
