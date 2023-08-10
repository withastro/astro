import type { AnalyticsProps } from '@vercel/analytics';

export type VercelWebAnalyticsConfig = {
	enabled: boolean;
	config?: AnalyticsProps;
};

export function getInjectableWebAnalyticsContent(config?: AnalyticsProps) {
	return `import { inject } from '@vercel/analytics';
		inject({
			mode: ${config?.mode},
			beforeSend: ${config?.beforeSend},
			debug: ${config?.debug}
		});`;
}
