// @ts-check

/**
 * @param {HTMLElement} parentElement
 * @returns {(component: any, props: Record<string, any>) => Promise<void>}
 */
export default (parentElement) => async (Component, props) => {
	const html = Component(props);
	const div = document.createElement('div');
	div.setAttribute('data-renderer', 'meow');
	div.textContent = html;
	parentElement.appendChild(div);
};
