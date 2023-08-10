import { exposeEnv } from './env';

export type VercelSpeedInsightsConfig = {
	enabled: boolean;
};

export function getSpeedInsightsViteConfig(enabled?: boolean) {
	if (enabled) {
		return {
			define: exposeEnv(['VERCEL_ANALYTICS_ID']),
		};
	}

	return {};
}
