interface PropTypeSelector {
	[k: string]: (value: any) => any;
}

const propTypes: PropTypeSelector = {
	0: (value) => value,
	1: (value) => JSON.parse(value, reviver),
	2: (value) => new RegExp(value),
	3: (value) => new Date(value),
	4: (value) => new Map(JSON.parse(value, reviver)),
	5: (value) => new Set(JSON.parse(value, reviver)),
	6: (value) => BigInt(value),
	7: (value) => new URL(value),
};

const reviver = (propKey: string, raw: string): any => {
	if (propKey === '' || !Array.isArray(raw)) return raw;
	if (Array.isArray(raw) && typeof raw[0] !== 'number') return JSON.stringify(raw);
	const [type, value] = raw;
	return type in propTypes ? propTypes[type](value) : undefined;
};

export default function deserialize(value: string) {
	return JSON.parse(value, reviver);
}
