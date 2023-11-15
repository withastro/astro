import { slash } from "@astrojs/internal-helpers/path";
import { builtinModules } from "node:module";
import { fileURLToPath } from "node:url";
import fs from 'node:fs';
import { createHash } from 'node:crypto';

export function resolvePackageVersion(specifier: string, require: NodeRequire) {
	try {
		// External packages will not be resolved
		// We try to resolve their package.json version
		const pkgInfo = require(`${specifier}/package.json`);
		if (pkgInfo.version) {
			return pkgInfo.version;
		}
	} catch {}
}

export function checksum(path: fs.PathLike): string {
	return checksumData(fs.readFileSync(path));
}

export function checksumData(data: Buffer | string): string {
	return createHash('sha1').update(data).digest('hex');
}

export interface SerializedModuleGraph {
	/** Track the version of this graph format to invalidate the entire graph in case of format changes */
	version: string;
	checksums: Record<string, string>;
	graph: SerializedModuleNode[];
}

export class ModuleGraph {
	// IMPORTANT: Update this version when making significant changes to the manifest format.
	// Only manifests generated with the same version number can be compared.
	static currentVersion = '1';
	version = ModuleGraph.currentVersion;

	#nodes = new Map<string, ModuleNode>();
	#entrypoints = new Map<string, ModuleNode>();
	#root: string;

	checksums = new Map<string, string>();

	rehydrate(data: SerializedModuleGraph) {
		this.version = data.version;
		this.checksums = new Map(Object.entries(data.checksums));
		for (const item of data.graph) {
			const node = this.get(item.id);
			for (const importer of item.importers) {
				node.addImporter(importer);
			}
			for (const imported of item.imports) {
				node.addImport(imported);
			}
			if (item.isEntry) {
				this.addEntrypoint(item.id);
			}
		}
		return this;
	}

	constructor(root: URL) {
		this.#root = fileURLToPath(root);
	}

	get entrypoints() {
		return this.#entrypoints.values();
	}

	get components() {
		return Array.from(this.#nodes.values()).filter(n => n.id.startsWith('src/components/'));
	}

	normalizeId(id: string): string {
        if (id.includes('?')) id = id.split('?')[0];
		if (id.startsWith(this.#root)) id = id.slice(this.#root.length);
        if (id.includes('\\')) id = slash(id);
		if (id.startsWith('/')) id = id.slice(1);
		if (id.startsWith('node_modules')) {
			return id.split('node_modules').at(-1)?.split('/').filter(x => x).at(0) ?? id;
		}
		return id;
	}

	get(id: string) {
		id = this.normalizeId(id);
		if (this.#nodes.has(id)) return this.#getNode(id);
		return this.#addNode(id);
	}

	addEntrypoint(id: string) {
		id = this.normalizeId(id);
		const node = this.get(id);
		node.isEntry = true;
		this.#entrypoints.set(node.id, node);
	}

	#getNode(id: string) {
		id = this.normalizeId(id);
		return this.#nodes.get(id)!;
	}

	#addNode(id: string) {
		id = this.normalizeId(id);
		const node = new ModuleNode(this, id);
		this.#nodes.set(id, node);
		return node;
	}

	toJSON(): SerializedModuleGraph {
		const checksums = Object.fromEntries(this.checksums.entries());
		const graph = Array.from(this.#nodes.values()).map(node => node.toJSON());
		return { version: this.version, checksums, graph }
	}
}

export class ModuleNode {
	#graph: ModuleGraph;
	#importers = new Set<string>();
	#imports = new Set<string>();
	isEntry = false;

	constructor(graph: ModuleGraph, public id: string) {
		this.#graph = graph;
	}

	addImporter(id: string) {
		this.#importers.add(id);
	}
	addImport(id: string) {
		this.#imports.add(id);
	}
	
	get importers() {
		return new Map(Array.from(this.#importers.values()).map(id => ([id, this.#graph.get(id)])));
	}
	get imports() {
		return new Map(Array.from(this.#imports.values()).map(id => ([id, this.#graph.get(id)])));
	}

	doesImport(id: string, seen = new WeakSet<ModuleNode>()): boolean {
		seen.add(this);
		if (id === this.id) return true;
		if (seen.has(this)) return false;
		for (const imported of this.imports.values()) {
			seen.add(imported);
			if (imported.id === id) return true;
			if (imported.doesImport(id, seen)) return true;
		}
		return false;
	}
	toJSON(): SerializedModuleNode {
		const isEntry = this.isEntry || undefined;
		return { id: this.id, isEntry, importers: Array.from(this.#importers), imports: Array.from(this.#imports) }
	}
}

export interface SerializedModuleNode {
	id: string;
	isEntry?: boolean;
	importers: string[];
	imports: string[];
}

export function isTrackableModule(id: string) {
	if (id.startsWith('\0astro:')) return true;
    if (id.startsWith('\0') || id.startsWith('virtual:')) return false
    if (id.startsWith('node:')) return false
    if (builtinModules.includes(id)) return false
    return true;
}

export function isDependency(id: string) {
    if (!id.includes('node_modules')) return false
    return true;
}
