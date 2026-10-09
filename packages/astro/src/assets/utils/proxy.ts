import type { ImageMetadata } from '../types.js';

export function getProxyCode(
	options: ImageMetadata,
	isSSR: boolean,
	fsPath: string | undefined = options.fsPath,
): string {
	const stringifiedFSPath = JSON.stringify(fsPath);
	// `isImageMetadata` identifies an ESM-imported image as a proxy that exposes `fsPath` only
	// through the getter below. Keep `fsPath` out of the serialized target so the metadata is not
	// mistaken for a plain options object.
	const serializable: Record<string, unknown> = { ...options };
	delete serializable.fsPath;
	return `
						new Proxy(${JSON.stringify(serializable)}, {
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
