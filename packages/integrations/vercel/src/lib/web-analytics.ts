import type { AnalyticsProps } from '@vercel/analytics';
import { fileURLToPath } from 'url';

export type VercelWebAnalyticsConfig = {
	enabled: boolean;
	config?: Omit<AnalyticsProps, 'beforeSend'>;
};

async function getWebAnalyticsFunctions(root: URL) {
	try {
		const files = await Promise.all([
			import(/* @vite-ignore */ fileURLToPath(new URL('./vercel-web-analytics.ts', root))).catch(
				() => undefined
			),
			import(/* @vite-ignore */ fileURLToPath(new URL('./vercel-web-analytics.js', root))).catch(
				() => undefined
			),
		]);

		const functions = files[0] || files[1];

		if (functions?.default) {
			if (typeof functions.default.beforeSend !== 'function') {
				throw new Error(
					`@astrojs/vercel: ./vercel-web-analytics.js should export a \`beforeSend\` function.`
				);
			}

			return {
				beforeSend: functions.default.beforeSend,
			};
		}

		return {
			beforeSend: undefined,
		};
	} catch (e) {
		return {
			beforeSend: undefined,
		};
	}
}

export async function getInjectableWebAnalyticsContent(
	config: Omit<AnalyticsProps, 'beforeSend'> | undefined,
	root: URL
) {
	const { beforeSend } = await getWebAnalyticsFunctions(root);

	return `import { inject } from '@vercel/analytics';
		inject({
			mode: ${config?.mode},
			beforeSend: ${beforeSend},
			debug: ${config?.debug}
		});`;
}
