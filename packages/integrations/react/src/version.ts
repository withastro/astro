import { version as ReactVersion } from 'react-dom';

type SupportedReactVersion = keyof typeof versionsConfig;
export type ReactVersionConfig = (typeof versionsConfig)[SupportedReactVersion];

export function getReactMajorVersion(): number {
	const matches = /\d+\./.exec(ReactVersion);
	if (!matches) {
		return NaN;
	}
	return Number(matches[0]);
}

export function isSupportedReactVersion(
	majorVersion: number,
): majorVersion is SupportedReactVersion {
	return majorVersion in versionsConfig;
}

export const versionsConfig = {
	17: {
		server: '@astrojs/react/server-v17.js',
		client: '@astrojs/react/client-v17.js',
	},
	18: {
		server: '@astrojs/react/server.js',
		client: '@astrojs/react/client.js',
	},
	19: {
		server: '@astrojs/react/server.js',
		client: '@astrojs/react/client.js',
	},
};
