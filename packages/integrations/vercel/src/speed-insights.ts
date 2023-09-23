import type { Metric } from 'web-vitals';
import { onCLS, onFCP, onFID, onLCP, onTTFB } from 'web-vitals';

const SPEED_INSIGHTS_INTAKE = 'https://vitals.vercel-analytics.com/v1/vitals';

type Options = { path: string; analyticsId: string };

const getConnectionSpeed = () => {
	return 'connection' in navigator &&
		navigator['connection'] &&
		'effectiveType' in (navigator['connection'] as unknown as { effectiveType: string })
		? (navigator['connection'] as unknown as { effectiveType: string })['effectiveType']
		: '';
};

const sendToSpeedInsights = (metric: Metric, options: Options) => {
	const body = {
		dsn: options.analyticsId,
		id: metric.id,
		page: options.path,
		href: location.href,
		event_name: metric.name,
		value: metric.value.toString(),
		speed: getConnectionSpeed(),
	};
	const blob = new Blob([new URLSearchParams(body).toString()], {
		type: 'application/x-www-form-urlencoded',
	});
	if (navigator.sendBeacon) {
		navigator.sendBeacon(SPEED_INSIGHTS_INTAKE, blob);
	} else
		fetch(SPEED_INSIGHTS_INTAKE, {
			body: blob,
			method: 'POST',
			credentials: 'omit',
			keepalive: true,
		});
};

function collectWebVitals() {
	const analyticsId = (import.meta as any).env.PUBLIC_VERCEL_ANALYTICS_ID;

	if (!analyticsId) {
		console.error('[Speed Insights] VERCEL_ANALYTICS_ID not found');
		return;
	}

	const options: Options = { path: window.location.pathname, analyticsId };

	try {
		onFID((metric) => sendToSpeedInsights(metric, options));
		onTTFB((metric) => sendToSpeedInsights(metric, options));
		onLCP((metric) => sendToSpeedInsights(metric, options));
		onCLS((metric) => sendToSpeedInsights(metric, options));
		onFCP((metric) => sendToSpeedInsights(metric, options));
	} catch (err) {
		console.error('[Speed Insights]', err);
	}
}

const mode = (import.meta as any).env.MODE as 'development' | 'production';

if (mode === 'production') {
	collectWebVitals();
}
