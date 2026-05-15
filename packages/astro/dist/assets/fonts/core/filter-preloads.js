function filterPreloads(data, preload) {
	if (!preload) {
		return null;
	}
	if (preload === true) {
		return data;
	}
	return data.filter(({ weight, style, subset }) =>
		preload.some((p) => {
			if (p.weight !== void 0 && weight !== void 0 && !checkWeight(p.weight.toString(), weight)) {
				return false;
			}
			if (p.style !== void 0 && p.style !== style) {
				return false;
			}
			if (p.subset !== void 0 && p.subset !== subset) {
				return false;
			}
			return true;
		}),
	);
}
function checkWeight(input, target) {
	const trimmedInput = input.trim();
	if (trimmedInput.includes(' ')) {
		return trimmedInput === target;
	}
	if (target.includes(' ')) {
		const [a, b] = target.split(' ');
		const parsedInput = Number.parseInt(input);
		return parsedInput >= Number.parseInt(a) && parsedInput <= Number.parseInt(b);
	}
	return input === target;
}
export { filterPreloads };
