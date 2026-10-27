import { createSignal, Loading } from 'solid-js';
import { dynamic } from '@solidjs/web';
import { getPanel } from '../frames/panel.jsx';

export default function ServerComponentDemo() {
	const [name, setName] = createSignal('alpha');
	// The whole client surface for server components: `dynamic` over a server
	// function call. The SSR'd boundary is adopted at boot with zero endpoint
	// requests; re-evaluations stream over the endpoint and morph in place.
	const Panel = dynamic(() => getPanel(name()));

	return (
		<div id="sc-demo">
			<button id="sc-rename" type="button" onClick={() => setName('beta')}>
				Rename
			</button>
			<Loading fallback={<p id="sc-loading">loading…</p>}>
				<Panel>
					<input id="sc-draft" placeholder="client slot state" />
				</Panel>
			</Loading>
		</div>
	);
}
