import os from 'os'
interface NetworkAddressOpt {
	local: string[]
	network: string[]
}

const wildcardHosts = new Set([
	'0.0.0.0',
	'::',
	'0000:0000:0000:0000:0000:0000:0000:0000',
])
type Protocol = 'http' | 'https'

// this code from vite https://github.com/vitejs/vite/blob/d09bbd093a4b893e78f0bbff5b17c7cf7821f403/packages/vite/src/node/utils.ts#L892-L914
export function getNetworkAddress(protocol: Protocol = 'http', hostname: string | undefined, port: number, base?: string) {
	const NetworkAddress: NetworkAddressOpt = {
		local: [],
		network: []
	}
	Object.values(os.networkInterfaces())
		.flatMap((nInterface) => nInterface ?? [])
		.filter(
			(detail) =>
				detail &&
				detail.address &&
				(detail.family === 'IPv4' ||
					// @ts-expect-error Node 18.0 - 18.3 returns number
					detail.family === 4),
		)
		.forEach((detail) => {
			let host = detail.address.replace('127.0.0.1', hostname === undefined || wildcardHosts.has(hostname) ? 'localhost' : hostname)
			// ipv6 host
			if (host.includes(':')) {
				host = `[${host}]`
			}
			const url = `${protocol}://${host}:${port}${base ? base : ''}`
			if (detail.address.includes('127.0.0.1')) {
				NetworkAddress.local.push(url)
			} else {
				NetworkAddress.network.push(url)
			}
		})
	return NetworkAddress
}
