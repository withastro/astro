import os from 'os'
interface ReturnValOpt {
	local: string[]
	network: string[]
}

const wildcardHosts = new Set([
  '0.0.0.0',
  '::',
  '0000:0000:0000:0000:0000:0000:0000:0000',
])
type Protocol = 'http' | 'https'

export function getNetworkAddress(protocol: Protocol = 'http', hostname: string, port:number, base?:string) {

	const returnVal:ReturnValOpt = {
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
			returnVal.local.push(url)
		} else {
			returnVal.network.push(url)
		}
	})
	return returnVal
}



