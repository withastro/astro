import type { AuditRuleWithSelector } from './index.js';

// A regular expression to match external URLs
const externalUrlRe = new RegExp('^(?:[a-z+]+:)?//', 'i');

export const perf: AuditRuleWithSelector[] = [
	{
		code: 'perf-use-image-component',
		title: 'Use the Image component',
		message: 'This image could be replaced with the Image component to improve performance.',
		selector: 'img:not([data-image-component])',
		async match(element) {
			const src = element.getAttribute('src');
			if (!src) return false;

			// Don't match data URIs, they're typically used for specific use-cases that the image component doesn't help with
			if (src.startsWith('data:')) return false;

			// Ignore images that are smaller than 20KB, most of the time the image component won't really help with these, or they're used for specific use-cases (pixel tracking, etc.)
			// Ignore this test for remote images for now, fetching them can be very slow and possibly dangerous
			if (!externalUrlRe.test(src)) {
				const imageData = await fetch(src).then((response) => response.blob());
				if (imageData.size < 20 * 1024) return false;
			}

			return true;
		},
	},
	{
		code: 'perf-use-loading-lazy',
		title: 'Use the loading="lazy" attribute',
		message: (element) =>
			`This ${element.tagName} is below the fold and could be lazy-loaded to improve performance.`,
		selector:
			'img:not([loading]), img[loading="eager"], iframe:not([loading]), iframe[loading="eager"]',
		match(element) {
			// Ignore elements that are above the fold, they should be loaded eagerly
			if (element.getBoundingClientRect().top < window.innerHeight) return false;
		},
	},
	{
		code: 'perf-use-loading-eager',
		title: 'Use the loading="eager" attribute',
		message: (element) =>
			`This ${element.tagName} is above the fold and could be eagerly-loaded to improve performance.`,
		selector: 'img[loading="lazy"], iframe[loading="lazy"]',
		match(element) {
			// Ignore elements that are below the fold, they should be loaded lazily
			if (element.getBoundingClientRect().top > window.innerHeight) return false;
		},
	},
	{
		code: 'perf-use-videos',
		title: 'Use videos instead of GIFs for large animations',
		message: 'This GIF could be replaced with a video to improve performance.',
		selector: 'img[src$=".gif"]',
		async match(element) {
			const src = element.getAttribute('src');
			if (!src) return false;

			// Ignore remote URLs
			if (externalUrlRe.test(src)) return false;

			// Ignore GIFs that are smaller than 100KB, those are typically small enough to not be a problem
			if (!externalUrlRe.test(src)) {
				const imageData = await fetch(src).then((response) => response.blob());
				if (imageData.size < 100 * 1024) return false;
			}

			return true;
		},
	},
];
