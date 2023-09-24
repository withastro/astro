import type { IncomingRequestCfProperties } from '@cloudflare/workers-types/experimental';

export async function getCFObject(
	runtimeMode: string
): Promise<IncomingRequestCfProperties | void> {
	const CF_ENDPOINT = 'https://workers.cloudflare.com/cf.json';
	const CF_FALLBACK: IncomingRequestCfProperties = {
		asOrganization: '',
		asn: 395747,
		colo: 'DFW',
		city: 'Austin',
		region: 'Texas',
		regionCode: 'TX',
		metroCode: '635',
		postalCode: '78701',
		country: 'US',
		continent: 'NA',
		timezone: 'America/Chicago',
		latitude: '30.27130',
		longitude: '-97.74260',
		clientTcpRtt: 0,
		httpProtocol: 'HTTP/1.1',
		requestPriority: 'weight=192;exclusive=0',
		tlsCipher: 'AEAD-AES128-GCM-SHA256',
		tlsVersion: 'TLSv1.3',
		tlsClientAuth: {
			certPresented: '0',
			certVerified: 'NONE',
			certRevoked: '0',
			certIssuerDN: '',
			certSubjectDN: '',
			certIssuerDNRFC2253: '',
			certSubjectDNRFC2253: '',
			certIssuerDNLegacy: '',
			certSubjectDNLegacy: '',
			certSerial: '',
			certIssuerSerial: '',
			certSKI: '',
			certIssuerSKI: '',
			certFingerprintSHA1: '',
			certFingerprintSHA256: '',
			certNotBefore: '',
			certNotAfter: '',
		},
		edgeRequestKeepAliveStatus: 0,
		hostMetadata: undefined,
		clientTrustScore: 99,
		botManagement: {
			corporateProxy: false,
			verifiedBot: false,
			ja3Hash: '25b4882c2bcb50cd6b469ff28c596742',
			staticResource: false,
			detectionIds: [],
			score: 99,
		},
	};

	if (runtimeMode === 'local') {
		return CF_FALLBACK;
	} else if (runtimeMode === 'remote') {
		try {
			const res = await fetch(CF_ENDPOINT);
			const cfText = await res.text();
			const storedCf = JSON.parse(cfText);
			return storedCf;
		} catch (e: any) {
			return CF_FALLBACK;
		}
	}
}
