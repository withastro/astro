import nodeLogger from "astro/logger/node";

// A custom logger destination referenced by a relative entrypoint (`./src/logger.mjs`),
// resolved against this project's root rather than against astro core's location.
//
// - `__custom` lets tests assert this module was actually resolved and bundled,
//   rather than a built-in fallback (used for the SSR runtime path).
// - Recording events on `globalThis` lets in-process tests observe that the
//   config logger was used during dev and build.
export default function customLoggerDestination() {
	const inner = nodeLogger();
	const events = (globalThis.__astroLoggerEvents ??= []);
	return {
		__custom: true,
		write(event) {
			events.push(event);
			return inner.write(event);
		},
		close: inner.close,
		flush: inner.flush,
	};
}
