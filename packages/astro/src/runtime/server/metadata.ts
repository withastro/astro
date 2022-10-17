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

	constructor(filePathname: string, opts: CreateMetadataOptions) {
		this.modules = opts.modules;
		this.hoisted = opts.hoisted;
		this.hydratedComponents = opts.hydratedComponents;
		this.clientOnlyComponents = opts.clientOnlyComponents;
		this.hydrationDirectives = opts.hydrationDirectives;
		this.filePath = removeLeadingForwardSlashWindows(filePathname);
	}
}

export function createMetadata(filePathname: string, options: CreateMetadataOptions) {
	return new Metadata(filePathname, options);
}
