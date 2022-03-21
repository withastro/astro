
export default function() {
	return {
		name: '@astrojs/node',

		adapt(builder: any) {
			builder.bundle(true); // This is done by default probably...
			builder.serverEntry(new URL('./server.js', import.meta.url));
		}
	}
};
