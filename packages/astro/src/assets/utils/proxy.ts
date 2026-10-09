import type { ImageMetadata } from '../types.js';

export function getProxyCode(
	options: ImageMetadata,
	isSSR: boolean,
	fsPath: string | undefined = options.fsPath,
): string {
	const stringifiedFSPath = JSON.stringify(fsPath);
	// Serialize the resolved `fsPath` into the proxy target, so reads, `clone` and the
	// getter all agree when `fsPath` overrides the metadata's own value.
	return `
						new Proxy(${JSON.stringify({ ...options, fsPath })}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return ${stringifiedFSPath};
							}
							${
								!isSSR
									? `if (target[name] !== undefined && globalThis.astroAsset) {
										globalThis.astroAsset.referencedImages?.add(${stringifiedFSPath});
										globalThis.astroAsset.recordReferencedImage?.(${stringifiedFSPath});
									}`
									: ''
							}
							return target[name];
						}
					})
					`;
}
