async function collectPropagatedHeadParts(input) {
	const collectedHeadParts = [];
	const iterator = input.propagators.values();
	while (true) {
		const { value, done } = iterator.next();
		if (done) {
			break;
		}
		const returnValue = await value.init(input.result);
		if (input.isHeadAndContent(returnValue) && returnValue.head) {
			collectedHeadParts.push(returnValue.head);
		}
	}
	return collectedHeadParts;
}
export { collectPropagatedHeadParts };
