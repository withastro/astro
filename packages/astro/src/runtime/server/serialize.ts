import type { AstroComponentMetadata } from '../../@types/astro';

type ValueOf<T> = T[keyof T];

const PROP_TYPE = {
	Value: 0,
	JSON: 1,
	RegExp: 2,
	Date: 3,
	Map: 4,
	Set: 5,
	BigInt: 6,
	URL: 7,
};

function serializeArray(value: any[], metadata: AstroComponentMetadata | Record<string, any> = {}): any[] {
	return value.map((v) => convertToSerializedForm(v, metadata));
}

function serializeObject(
	value: Record<any, any>,
	metadata: AstroComponentMetadata | Record<string, any> = {}
): Record<any, any> {
	if (cyclicRefs.has(value) && cyclicRefs.get(value).has(value)) {
		throw new Error(`Cyclic reference detected while serializing props for <${metadata.displayName} client:${metadata.hydrate}>!

Cyclic references cannot be safely serialized for client-side usage. Please remove the cyclic reference.`);
	}
	const childRefs = new WeakSet();
	cyclicRefs.set(value, childRefs);
	return Object.fromEntries(
		Object.entries(value).map(([k, v]) => {
			if (v && typeof v === 'object') childRefs.add(v);
			return [k, convertToSerializedForm(v, metadata)];
		})
	);
}

function convertToSerializedForm(
	value: any,
	metadata: AstroComponentMetadata | Record<string, any> = {}
): [ValueOf<typeof PROP_TYPE>, any] {
	const tag = Object.prototype.toString.call(value);
	switch (tag) {
		case '[object Date]': {
			return [PROP_TYPE.Date, (value as Date).toISOString()];
		}
		case '[object RegExp]': {
			return [PROP_TYPE.RegExp, (value as RegExp).source];
		}
		case '[object Map]': {
			return [
				PROP_TYPE.Map,
				JSON.stringify(serializeArray(Array.from(value as Map<any, any>), metadata)),
			];
		}
		case '[object Set]': {
			return [
				PROP_TYPE.Set,
				JSON.stringify(serializeArray(Array.from(value as Set<any>), metadata)),
			];
		}
		case '[object BigInt]': {
			return [PROP_TYPE.BigInt, (value as bigint).toString()];
		}
		case '[object URL]': {
			return [PROP_TYPE.URL, (value as URL).toString()];
		}
		case '[object Array]': {
			return [PROP_TYPE.JSON, JSON.stringify(serializeArray(value, metadata))];
		}
		default: {
			if (value !== null && typeof value === 'object') {
				return [PROP_TYPE.Value, serializeObject(value, metadata)];
			} else {
				return [PROP_TYPE.Value, value];
			}
		}
	}
}

let cyclicRefs = new WeakMap<any, any>();
export function serializeProps(props: any, metadata: AstroComponentMetadata) {
	const serialized = JSON.stringify(serializeObject(props, metadata));
	cyclicRefs = new WeakMap<any, any>();
	return serialized;
}
