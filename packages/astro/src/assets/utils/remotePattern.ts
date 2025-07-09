import {
	isRemoteAllowed,
	matchHostname,
	matchPathname,
	matchPattern,
	matchPort,
	matchProtocol,
	type RemotePattern,
} from '@astrojs/internal-helpers/remote';

export { isRemoteAllowed, matchHostname, matchPort, matchPathname, matchProtocol, matchPattern };

export type { RemotePattern };
