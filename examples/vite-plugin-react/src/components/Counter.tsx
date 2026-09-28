import { useState } from 'react';

const button =
	'size-10 rounded-lg border border-white/10 bg-white/5 text-lg text-white transition-colors hover:bg-violet-500/30 active:bg-violet-500/50';

export default function Counter() {
	const [count, setCount] = useState(0);
	return (
		<div className="mt-4 flex items-center gap-4">
			<button id="dec" className={button} onClick={() => setCount((c) => c - 1)}>
				-
			</button>
			<span id="count" className="min-w-12 text-center text-3xl font-bold tabular-nums text-white">
				{count}
			</span>
			<button id="inc" className={button} onClick={() => setCount((c) => c + 1)}>
				+
			</button>
		</div>
	);
}
