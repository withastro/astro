export default (parentElement) => async (Component, props) => {
	const vdom = Component(props);
	const node = document.createElement(vdom.tag);
	node.textContent = vdom.text;
	parentElement.appendChild(node);
};
