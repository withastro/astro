import https from 'node:https';
import os from 'node:os';
const wildcardHosts = /* @__PURE__ */ new Set([
	'0.0.0.0',
	'::',
	'0000:0000:0000:0000:0000:0000:0000:0000',
]);
async function logListeningOn(logger, server, configuredHost) {
	await new Promise((resolve) => server.once('listening', resolve));
	const protocol = server instanceof https.Server ? 'https' : 'http';
	const host = getResolvedHostForHttpServer(configuredHost);
	const { port } = server.address();
	const address = getNetworkAddress(protocol, host, port);
	if (host === void 0 || wildcardHosts.has(host)) {
		logger.info(
			`Server listening on 
  local: ${address.local[0]} 	
  network: ${address.network[0]}
`,
		);
	} else {
		logger.info(`Server listening on ${address.local[0]}`);
	}
}
function getResolvedHostForHttpServer(host) {
	if (host === false) {
		return 'localhost';
	} else if (host === true) {
		return void 0;
	} else {
		return host;
	}
}
function getNetworkAddress(protocol = 'http', hostname, port, base) {
	const NetworkAddress = {
		local: [],
		network: [],
	};
	Object.values(os.networkInterfaces())
		.flatMap((nInterface) => nInterface ?? [])
		.filter((detail) => detail && detail.address && detail.family === 'IPv4')
		.forEach((detail) => {
			let host = detail.address.replace(
				'127.0.0.1',
				hostname === void 0 || wildcardHosts.has(hostname) ? 'localhost' : hostname,
			);
			if (host.includes(':')) {
				host = `[${host}]`;
			}
			const url = `${protocol}://${host}:${port}${base ? base : ''}`;
			if (detail.address.includes('127.0.0.1')) {
				NetworkAddress.local.push(url);
			} else {
				NetworkAddress.network.push(url);
			}
		});
	return NetworkAddress;
}
export { logListeningOn };
