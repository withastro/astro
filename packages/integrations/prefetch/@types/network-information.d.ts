export {};

declare global {
	interface NetworkInformation {
		// http://wicg.github.io/netinfo/#effectiveconnectiontype-enum
		readonly effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
		// http://wicg.github.io/netinfo/#savedata-attribute
		readonly saveData?: boolean;
	}

	var NetworkInformation: {
		prototype: NetworkInformation;
		new (): NetworkInformation;
	};
}
