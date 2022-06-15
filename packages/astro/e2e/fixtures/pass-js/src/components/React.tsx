import type { BigNestedObject } from '../types';
import { useState } from 'react';

interface Props {
	obj: BigNestedObject;
	num: bigint;
}

const isNode = typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]';

/** a counter written in React */
export default function Component({ obj, num, arr }: Props) {
	// We are testing hydration, so don't return anything in the server.
	if(isNode) {
		return <div></div>
	}

	return (
		<div>
			<span id="nested-date">{obj.nested.date.toUTCString()}</span>
			<span id="regexp-type">{Object.prototype.toString.call(obj.more.another.exp)}</span>
			<span id="regexp-value">{obj.more.another.exp.source}</span>
			<span id="bigint-type">{Object.prototype.toString.call(num)}</span>
			<span id="bigint-value">{num.toString()}</span>
			<span id="arr-type">{Object.prototype.toString.call(arr)}</span>
			<span id="arr-value">{arr.join(',')}</span>
		</div>
	);
}
