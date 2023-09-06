import { AstroError } from 'astro/errors';
import type { AnalyticsProps } from '@vercel/analytics';
import { fileURLToPath } from 'url';
import { existsSync } from 'node:fs';
import type { AstroIntegrationLogger } from 'astro';

export type VercelWebAnalyticsConfig = {
	enabled: boolean;
	config?: Omit<AnalyticsProps, 'beforeSend'>;
};

export function getWebAnalyticsViteConfig(enabled?: boolean) {
	if (enabled) {
		return {
			build: {
				rollupOptions: {
					external: ['@vercel/analytics'],
				},
			},
		};
	}

	return {};
}

async function getWebAnalyticsFunctions({
	root,
	logger,
}: {
	root: URL;
	logger: AstroIntegrationLogger;
}) {
	const tsPath = fileURLToPath(new URL('./vercel-web-analytics.ts', root));
	const jsPath = fileURLToPath(new URL('./vercel-web-analytics.js', root));

	const tsFileExists = existsSync(tsPath);
	const jsFileExists = existsSync(jsPath);

	if (tsFileExists && jsFileExists) {
		logger.warn(
			`@astrojs/vercel: Both \`vercel-web-analytics.ts\` and \`vercel-web-analytics.js\` exist. Using \`vercel-web-analytics.ts\`.`
		);
	}

	if (!tsFileExists && !jsFileExists) {
		logger.debug(
			`@astrojs/vercel: \`vercel-web-analytics.ts\` or \`vercel-web-analytics.js\` not found.`
		);

		return {
			beforeSend: undefined,
		};
	}

	const functions = await import(
		tsFileExists ? /* @vite-ignore */ tsPath : /* @vite-ignore */ jsPath
	);

	if (typeof functions.beforeSend !== 'function') {
		throw new AstroError(
			`@astrojs/vercel: \`vercel-web-analytics.${
				tsFileExists ? 'ts' : 'js'
			}\` must export a \`beforeSend\` function.`
		);
	}

	return {
		beforeSend: functions.beforeSend,
	};
}

export async function getInjectableWebAnalyticsContent({
	config,
	astro,
}: {
	config: Omit<AnalyticsProps, 'beforeSend'> | undefined;
	astro: {
		root: URL;
		logger: AstroIntegrationLogger;
	};
}) {
	const { beforeSend } = await getWebAnalyticsFunctions(astro);

	return `import { inject } from '@vercel/analytics';
		inject({
			mode: ${config?.mode},
			beforeSend: ${beforeSend},
			debug: ${config?.debug}
		});`;
}
