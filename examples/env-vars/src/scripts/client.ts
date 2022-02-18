(() => {
	const { SSR, DB_PASSWORD, PUBLIC_SOME_KEY } = import.meta.env;

	// DB_PASSWORD is NOT available because we're running on the client
	console.log({ SSR, DB_PASSWORD });

	// PUBLIC_SOME_KEY is available everywhere
	console.log({ SSR, PUBLIC_SOME_KEY });
})();
