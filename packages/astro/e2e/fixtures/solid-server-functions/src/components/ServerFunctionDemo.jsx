import { createMemo, createSignal } from 'solid-js';
import { double, whoami } from '../functions/api.js';

export default function ServerFunctionDemo() {
	const [value, setValue] = createSignal(1);
	const [user, setUser] = createSignal('');
	// Runs as a direct in-process call during island SSR; over the transport
	// when the memo re-evaluates on the client.
	const ssrUser = createMemo(() => whoami());

	return (
		<div id="sf-demo">
			<span id="sf-ssr-user">{ssrUser()}</span>
			<span id="sf-value">{value()}</span>
			<span id="sf-user">{user()}</span>
			<button id="sf-double" type="button" onClick={async () => setValue(await double(value()))}>
				Double
			</button>
			<button id="sf-whoami" type="button" onClick={async () => setUser(await whoami())}>
				Who am I
			</button>
		</div>
	);
}
