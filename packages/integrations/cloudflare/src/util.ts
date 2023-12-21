export const isNode =
	typeof process === 'object' && Object.prototype.toString.call(process) === '[object process]';

export function getProcessEnvProxy() {
	return new Proxy(
		{},
		{
			get: (target, prop) => {
				console.warn(
					// NOTE: \0 prevents Vite replacement
					`Unable to access \`import.meta\0.env.${prop.toString()}\` on initialization as the Cloudflare platform only provides the environment variables per request. Please move the environment variable access inside a function that's only called after a request has been received.`
				);
			},
		}
	);
}
