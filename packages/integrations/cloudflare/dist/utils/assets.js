import { isRemotePath } from '@astrojs/internal-helpers/path';
import { matchHostname, matchPattern } from '@astrojs/internal-helpers/remote';
function isRemoteAllowed(src, { domains = [], remotePatterns = [] }) {
	if (!isRemotePath(src)) return false;
	const url = new URL(src);
	return (
		domains.some((domain) => matchHostname(url, domain)) ||
		remotePatterns.some((remotePattern) => matchPattern(url, remotePattern))
	);
}
export { isRemoteAllowed };
