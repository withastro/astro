function formatList(values: string[]): string {
	if (values.length === 1) {
		return values[0];
	}
	return `${values.slice(0, -1).join(', ')} or ${values[values.length - 1]}`;
}

export function serializeListValue(value: any) {
	const hash: Record<string, any> = {};

	push(value);

	return Object.keys(hash).join(' ');

	function push(item: any) {
		// push individual iteratables
		if (item && typeof item.forEach === 'function') item.forEach(push);
		// otherwise, push object value keys by truthiness
		else if (item === Object(item))
			Object.keys(item).forEach((name) => {
				if (item[name]) push(name);
			});
		// otherwise, push any other values as a string
		else {
			// get the item as a string
			item = item == null ? '' : String(item).trim();

			// add the item if it is filled
			if (item) {
				item.split(/\s+/).forEach((name: string) => {
					hash[name] = true;
				});
			}
		}
	}
}
