function lazyload(elem: HTMLImageElement) {
	const img = new Image();
	const src = elem.getAttribute('data-src')!;
	img.onload = () => {
		elem.src = src;
		elem.removeAttribute('data-src');
	}
	img.src = src;
}

function handleIntersect(entries: IntersectionObserverEntry[], observer: IntersectionObserver) {
	entries.forEach((entry) => {
		if (entry.intersectionRatio > 0) {
			lazyload(entry.target as HTMLImageElement);
			observer.unobserve(entry.target);
		}
	});
}

const observer = new IntersectionObserver(handleIntersect);
document.querySelectorAll<HTMLImageElement>('img[data-src]').forEach((elem) => observer.observe(elem));

console.log('lazyload')
