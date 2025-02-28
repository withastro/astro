import {
	isRemoteAllowed,
	matchHostname,
	matchPort,
	matchPathname,
	matchProtocol,
	type RemotePattern,
	matchPattern,
} from '@astrojs/internal-helpers/remote';

export { isRemoteAllowed, matchHostname, matchPort, matchPathname, matchProtocol, matchPattern };

export type { RemotePattern };
