import type { AstroSettings } from '../types/astro.js';
import type { AstroIntegration } from '../types/public/integrations.js';
/**
 * This integration is applied when the user is using Actions in their project.
 * It will inject the necessary routes and middlewares to handle actions.
 */
export default function astroIntegrationActionsRouteHandler({
	settings,
	filename,
}: {
	settings: AstroSettings;
	filename: string;
}): AstroIntegration;
