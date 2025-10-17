/**
 * NOTE: this is a public module exposed to the user, so all functions exposed
 * here must be documented via JsDoc and in the docs website.
 *
 * If some functions don't need to be exposed, just import the file that contains the functions.
 */

export { isESMImportedImage, isRemoteImage, resolveSrc } from './imageKind.js';
export { imageMetadata } from './metadata.js';
export {
	/**
	 * @deprecated
	 */
	emitESMImage,
	emitImageMetadata,
} from './node/emitAsset.js';
export { getOrigQueryParams } from './queryParams.js';
export {
	isRemoteAllowed,
	matchHostname,
	matchPathname,
	matchPattern,
	matchPort,
	matchProtocol,
	type RemotePattern,
} from './remotePattern.js';
export { inferRemoteSize } from './remoteProbe.js';
export { hashTransform, propsToFilename } from './transformToPath.js';
