import { isRemoteAllowed, matchPattern } from '@astrojs/internal-helpers/remote';
import { emitClientAsset } from './assets.js';
import { isESMImportedImage, isRemoteImage, resolveSrc } from './imageKind.js';
import { imageMetadata } from './metadata.js';
import { getOrigQueryParams } from './queryParams.js';
import { inferRemoteSize } from './remoteProbe.js';
import { fetchWithRedirects } from './redirectValidation.js';
export {
	emitClientAsset,
	fetchWithRedirects,
	getOrigQueryParams,
	imageMetadata,
	inferRemoteSize,
	isESMImportedImage,
	isRemoteAllowed,
	isRemoteImage,
	matchPattern,
	resolveSrc,
};
