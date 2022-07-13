import Turbolinks from 'turbolinks';
export { Turbolinks };

// Before every page navigation, remove any previously added component hydration scripts
document.addEventListener('turbolinks:before-render', function () {
	const scripts = document.querySelectorAll('script[data-astro-component-hydration]');
	for (const script of scripts) {
		script.remove();
	}
});

// After every page navigation, move the bundled styles into the body
document.addEventListener('turbolinks:render', function () {
	const styles = document.querySelectorAll('link[href^="/assets/asset"][href$=".css"]');
	for (const style of styles) {
		document.body.append(style);
	}
});
