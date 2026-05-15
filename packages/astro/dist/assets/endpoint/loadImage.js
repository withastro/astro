import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';
import { fetchWithRedirects } from '../utils/redirectValidation.js';
async function loadImage(src, headers, imageConfig, isRemote, fetchFn) {
	try {
		const res = await fetchWithRedirects({ url: src, headers, imageConfig, fetchFn });
		if (isRemote && !isRemoteAllowed(res.url, imageConfig)) {
			return void 0;
		}
		if (!res.ok) {
			return void 0;
		}
		return await res.arrayBuffer();
	} catch {
		return void 0;
	}
}
export { loadImage };
