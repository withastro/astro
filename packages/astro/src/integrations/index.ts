import type { AstroIntegration } from "../@types/astro.js";

type IntegrationDefinition = {
	name: string;
	setup: (hooks: AstroIntegration['hooks']) => AstroIntegration;
}

export function defineIntegration(integration: IntegrationDefinition) {
	return integration;
}

// TODO: mirror aik behavior