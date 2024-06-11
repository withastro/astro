import type {ContainerRenderer, SSRLoadedRenderer, SSRLoadedRendererValue} from 'astro';
import {
	getReactMajorVersion,
	isUnsupportedVersion,
	versionsConfig,
	type SupportedReactVersion,
} from './version.js';

import * as _server from "../server.js" 
import * as _server17 from "../server-v17.js" 
import * as _client from "../client.js" 
import * as _client17 from "../client-v17.js" 

export function getContainerRenderer(): ContainerRenderer {
	const majorVersion = getReactMajorVersion();
	if (isUnsupportedVersion(majorVersion)) {
		throw new Error(`Unsupported React version: ${majorVersion}.`);
	}
	const versionConfig = versionsConfig[majorVersion as SupportedReactVersion];

	return {
		name: '@astrojs/react',
		serverEntrypoint: versionConfig.server,
	};
}

const server: SSRLoadedRenderer = {
	ssr: _server as SSRLoadedRendererValue
}

export {
	server,
	client,
	server17,
	client17
}
