// Detect iOS Safari, including iPadOS in desktop mode.
export const isIOSSafari =
	typeof navigator !== 'undefined' &&
	(/iPad|iPhone|iPod/.test(navigator.userAgent) ||
		(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
