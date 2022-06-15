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

function serializeArray(value: any[]): any[] {
	return value.map((v) => convertToSerializedForm(v));
}

function serializeObject(value: Record<any, any>): Record<any, any> {
	return Object.fromEntries(Object.entries(value).map(([k, v]) => {
		return [k, convertToSerializedForm(v)];
	}));
}

function convertToSerializedForm(value: any): [ValueOf<typeof PROP_TYPE>, any] {
	const tag = Object.prototype.toString.call(value);
	switch(tag) {
		case '[object Date]': {
			return [PROP_TYPE.Date, (value as Date).toISOString()];
		}
		case '[object RegExp]': {
			return [PROP_TYPE.RegExp, (value as RegExp).source];
		}
		case '[object Map]': {
			return [PROP_TYPE.Map, Array.from(value as Map<any, any>)];
		}
		case '[object Set]': {
			return [PROP_TYPE.Set, Array.from(value as Set<any>)];
		}
		case '[object BigInt]': {
			return [PROP_TYPE.BigInt, (value as bigint).toString()];
		}
		case '[object URL]': {
			return [PROP_TYPE.URL, (value as URL).toString()];
		}
		case '[object Array]': {
			return [PROP_TYPE.JSON, JSON.stringify(serializeArray(value))];
		}
		default: {
			if(typeof value === 'object') {
				return [PROP_TYPE.Value, serializeObject(value)];
			} else {
				return [PROP_TYPE.Value, value];
			}
		}
	}
}

export function serializeProps(props: any) {
	return JSON.stringify(serializeObject(props));
}
