import type fsType from 'node:fs';
interface LoadConfigWithViteOptions {
	root: string;
	configPath: string;
	fs: typeof fsType;
}
export declare function loadConfigWithVite({
	configPath,
	fs,
	root,
}: LoadConfigWithViteOptions): Promise<Record<string, any>>;
export {};
