/**
 * Keyed reconciliation, ported from zebra's List: walk both ends inward,
 * handle swaps across the ends, and fall back to a key map for the middle.
 * Items are their own keys and every item already owns its row element, so
 * nothing is ever recreated, only moved, inserted or removed.
 */
export function reconcile<T>(
	parent: Element,
	prev: readonly T[],
	next: readonly T[],
	elOf: (item: T) => Element,
): void {
	const a: (T | null)[] = prev.slice();
	const nextSet = new Set(next);

	// Rows that are gone entirely.
	for (let i = 0; i < a.length; i++) {
		if (!nextSet.has(a[i]!)) {
			elOf(a[i]!).remove();
			a[i] = null;
		}
	}

	let oldHead = 0;
	let oldTail = a.length - 1;
	let newHead = 0;
	let newTail = next.length - 1;
	let oldIndex: Map<T, number> | undefined;

	while (oldHead <= oldTail && newHead <= newTail) {
		if (a[oldHead] === null) {
			oldHead++;
		} else if (a[oldTail] === null) {
			oldTail--;
		} else if (a[oldHead] === next[newHead]) {
			oldHead++;
			newHead++;
		} else if (a[oldTail] === next[newTail]) {
			oldTail--;
			newTail--;
		} else if (a[oldHead] === next[newTail]) {
			elOf(a[oldTail]!).after(elOf(a[oldHead]!));
			oldHead++;
			newTail--;
		} else if (a[oldTail] === next[newHead]) {
			elOf(a[oldHead]!).before(elOf(a[oldTail]!));
			oldTail--;
			newHead++;
		} else {
			if (!oldIndex) {
				oldIndex = new Map();
				for (let i = oldHead; i <= oldTail; i++) if (a[i] !== null) oldIndex.set(a[i]!, i);
			}
			const i = oldIndex.get(next[newHead]);
			elOf(a[oldHead]!).before(elOf(next[newHead]));
			if (i !== undefined) a[i] = null;
			newHead++;
		}
	}

	// New rows left over go before whatever row follows them.
	const ref = newTail + 1 < next.length ? elOf(next[newTail + 1]) : null;
	for (; newHead <= newTail; newHead++) {
		const el = elOf(next[newHead]);
		if (ref) ref.before(el);
		else parent.append(el);
	}
}
