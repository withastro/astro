import { type Layer } from './layer'

export type LoaderConfig<K> = {
	key(key: K): any;
	load(...args: any[]): Promise<any>;
	layers?: Layer<K>[];
};

const ReturnType = {
	Value: 0,
	Promise: 1,
	None: 2
} as const;

type ReturnTypeValues = (typeof ReturnType)[keyof typeof ReturnType];


function returnType(returnValue: unknown): ReturnTypeValues {
	if(!returnValue) {
		return ReturnType.None;
	}
	if(typeof (returnValue as any).then === 'function') {
		return ReturnType.Promise;
	}
	return ReturnType.Value;
}

export function createLoader<K>(config: LoaderConfig<K>) {
	const layers = config.layers ?? [];
	return async function(possibleKey: K, ...args: any[]) {
		const key = config.key(possibleKey);
		
		// Loop over caching layers
		for(let layer of layers) {
			let returnValue = layer.get(key);
			switch(returnType(returnValue)) {
				case ReturnType.None: continue;
				case ReturnType.Promise: {
					returnValue = await returnValue;
					break;
				}
			}
			// TODO schema validation
			return returnValue;
		}

		// Not cached, load it.
		let returnValue = config.load(possibleKey, ...args);
		switch(returnType(returnValue)) {
			case ReturnType.Promise: {
				returnValue = await returnValue;
				break;
			}
		}
		// TODO schema validation
		for(let layer of layers) {
			let cacheReturn = layer.cache(key, returnValue);
			switch(returnType(cacheReturn)) {
				case ReturnType.Promise: await cacheReturn;
			}
		}

		return returnValue;
	};
}
