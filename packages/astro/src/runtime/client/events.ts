const HYDRATE_KEY = `astro:hydrate`;
function debounce<T extends (...args: any[]) => any>(cb: T, wait = 20) {
	let h = 0;
	let callable = (...args: any) => {
		clearTimeout(h);
		h = setTimeout(() => cb(...args), wait) as unknown as number;
	};
	return callable as T;
}

export const notify = debounce(() => {
	window.dispatchEvent(new CustomEvent(HYDRATE_KEY));
});

if (!(window as any)[HYDRATE_KEY]) {
	if ('MutationObserver' in window) {
		new MutationObserver(notify).observe(document.body, { subtree: true, childList: true });
	}
	(window as any)[HYDRATE_KEY] = true;
}
