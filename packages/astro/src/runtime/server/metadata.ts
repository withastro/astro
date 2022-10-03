import { removeLeadingForwardSlashWindows } from '../../core/path.js';

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
	clientOnlyComponents: any[];
	hydrationDirectives: Set<string>;
	hoisted: any[];
}

export class Metadata {
	public filePath: string;
	public modules: ModuleInfo[];
	public hoisted: any[];
	public hydratedComponents: any[];
	public clientOnlyComponents: any[];
	public hydrationDirectives: Set<string>;

	private mockURL: URL;
	private metadataCache: Map<any, ComponentMetadata | null>;

	constructor(filePathname: string, opts: CreateMetadataOptions) {
		this.modules = opts.modules;
		this.hoisted = opts.hoisted;
		this.hydratedComponents = opts.hydratedComponents;
		this.clientOnlyComponents = opts.clientOnlyComponents;
		this.hydrationDirectives = opts.hydrationDirectives;
		this.filePath = removeLeadingForwardSlashWindows(filePathname);
		this.mockURL = new URL(filePathname, 'http://example.com');
		this.metadataCache = new Map<any, ComponentMetadata | null>();
	}

	resolvePath(specifier: string): string {
		if (specifier.startsWith('.')) {
			// NOTE: ideally we should use `path.resolve` here, but this is part
			// of server output code, which needs to work on platform that doesn't
			// have the `path` module. Use `URL` here since we deal with posix only.
			const url = new URL(specifier, this.mockURL);
			return removeLeadingForwardSlashWindows(decodeURI(url.pathname));
		} else {
			return specifier;
		}
	}

	getPath(Component: any): string | null {
		const metadata = this.getComponentMetadata(Component);
		return metadata?.componentUrl || null;
	}

	getExport(Component: any): string | null {
		const metadata = this.getComponentMetadata(Component);
		return metadata?.componentExport || null;
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
