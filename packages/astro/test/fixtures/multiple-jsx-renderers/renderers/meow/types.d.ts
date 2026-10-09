declare module 'astro:meow:opts' {
	const opts: {
		include: import('vite').FilterPattern;
		exclude: import('vite').FilterPattern;
	};
	export default opts;
}
