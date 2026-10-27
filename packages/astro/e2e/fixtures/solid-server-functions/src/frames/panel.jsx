'use server';
// Server components: "use server" functions that RETURN a function. The
// returned component's props are client positions (slots); the function's
// arguments are the server's inputs. The whole module is replaced by
// reference proxies in the client build.

const SERVER_ONLY_TEXT = 'rendered-on-the-server';

export async function getPanel(name) {
	return (props) => (
		<section id="sc-panel">
			<h2 id="sc-name">panel:{name}</h2>
			<p id="sc-secret">{SERVER_ONLY_TEXT}</p>
			{props.children}
		</section>
	);
}
