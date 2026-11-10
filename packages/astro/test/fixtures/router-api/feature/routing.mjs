/** Matches `/alias` as `/api`. */
export default {
	resolvePathname({ url }) {
		return url.pathname === '/alias' ? '/api' : undefined;
	},
};
