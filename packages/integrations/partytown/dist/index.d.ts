import type { PartytownConfig } from '@qwik.dev/partytown/integration';
import type { AstroIntegration } from 'astro';
export type PartytownOptions = {
	config?: PartytownConfig;
};
export default function createPlugin(options?: PartytownOptions): AstroIntegration;
