import { render } from "astro:toolbar:preact";

function HelloWorld() {
	return <h1 id="preact-title">Hello, world from Preact!</h1>;
}

export default {
  id: "preact-app",
  name: "A Preact App",
  icon: "astro:logo",
	init(canvas, eventTarget) {
		// Inject our app into the DOM
		render(<><HelloWorld/></>, canvas);
	}
};
