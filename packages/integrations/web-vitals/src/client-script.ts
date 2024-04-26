import { type Metric, onCLS, onFCP, onFID, onINP, onLCP, onTTFB } from 'web-vitals';
import type { ClientMetric } from './schemas.js';

const pathname = location.pathname.replace(/(?<=.)\/$/, '');
const route =
	document
		.querySelector<HTMLMetaElement>('meta[name="x-astro-vitals-route"]')
		?.getAttribute('content') || pathname;

const queue = new Set<Metric>();
const addToQueue = (metric: Metric) => queue.add(metric);
function flushQueue() {
	if (!queue.size) return;
	const rawBody: ClientMetric[] = [...queue].map(({ name, id, value, rating }) => ({
		pathname,
		route,
		name,
		id,
		value,
		rating,
	}));
	const body = JSON.stringify(rawBody);
	const endpoint = '/_/astro-vitals';
	if (navigator.sendBeacon) navigator.sendBeacon(endpoint, body);
	else fetch(endpoint, { body, method: 'POST', keepalive: true });
	queue.clear();
}

for (const listener of [onCLS, onLCP, onINP, onFID, onFCP, onTTFB]) {
	listener(addToQueue);
}

addEventListener('visibilitychange', () => {
	if (document.visibilityState === 'hidden') flushQueue();
});
addEventListener('pagehide', flushQueue);
