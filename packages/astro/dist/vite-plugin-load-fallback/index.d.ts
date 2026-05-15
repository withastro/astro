import nodeFs from 'node:fs';
import type * as vite from 'vite';
type NodeFileSystemModule = typeof nodeFs;
interface LoadFallbackPluginParams {
	fs?: NodeFileSystemModule;
	root: URL;
}
export default function loadFallbackPlugin({ fs, root }: LoadFallbackPluginParams): vite.Plugin[];
export {};
