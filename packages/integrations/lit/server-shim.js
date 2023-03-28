document.getElementsByTagName = () => [];

const ceDefine = customElements.define;
customElements.define = function (tagName, Ctr) {
	Ctr[Symbol.for('tagName')] = tagName;
	return ceDefine.call(this, tagName, Ctr);
};
