import escalade from 'escalade/sync';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

const EVENT_SESSION = 'ASTRO_CLI_SESSION_STARTED';

interface EventCliSession {
	astroVersion: string;
	cliCommand: string;
}

interface ConfigInfo {
	hasViteConfig: boolean;
	hasMarkdownPlugins: boolean;
	hasBase: boolean;
	adapter: string | null;
	integrations: string[];
	experimentalFeatures: string[];
}

interface EventCliSessionInternal extends EventCliSession {
	nodeVersion: string;
	viteVersion: string;
	config?: ConfigInfo;
}

function getViteVersion() {
	try {
		const { version } = require('vite/package.json');
		return version;
	} catch (e) {}
	return undefined;
}

function getExperimentalFeatures(astroConfig?: Record<string, any>): string[] | undefined {
	if (!astroConfig) return undefined;
	return Object.entries(astroConfig.experimental).reduce((acc, [key, value]) => {
		if (value) {
			acc.push(key);
		}
		return acc;
	}, [] as string[]);
}

export function eventCliSession(
	event: EventCliSession,
	astroConfig?: Record<string, any>
): { eventName: string; payload: EventCliSessionInternal }[] {
	const payload: EventCliSessionInternal = {
		cliCommand: event.cliCommand,
		// Versions
		astroVersion: event.astroVersion,
		viteVersion: getViteVersion(),
		nodeVersion: process.version.replace(/^v?/, ''),
		// Config Values
		config: astroConfig
			? {
					hasViteConfig: Object.keys(astroConfig?.vite).length > 0,
					hasMarkdownPlugins:
						[
							astroConfig?.markdown?.remarkPlugins ?? [],
							astroConfig?.markdown?.rehypePlugins ?? [],
						].flat(1).length > 0,
					hasBase: astroConfig?.base !== '/',
					adapter: astroConfig?.adapter?.name ?? null,
					integrations: astroConfig?.integrations.map((i: any) => i.name) ?? [],
					experimentalFeatures: getExperimentalFeatures(astroConfig) ?? [],
			  }
			: undefined,
	};
	return [{ eventName: EVENT_SESSION, payload }];
}
