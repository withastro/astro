import {
	loadFixture as baseLoadFixture,
	type Fixture,
	type DevServer,
	type AstroInlineConfig,
} from '../../../astro/test/test-utils.js';

export type { Fixture, DevServer, AstroInlineConfig };

export interface VercelOutputConfig {
	version: number;
	routes: Array<{
		src: string;
		dest: string;
		status: number;
		headers: Record<string, string>;
		continue: boolean;
		handle: string;
	}>;
}

export async function getVercelConfig(fixture: Fixture): Promise<VercelOutputConfig> {
	const json = await fixture.readFile('../.vercel/output/config.json');
	return JSON.parse(json);
}

export function loadFixture(config: AstroInlineConfig) {
	if (config?.root) {
		config.root = new URL(config.root as string, import.meta.url).toString();
	}
	return baseLoadFixture(config);
}
