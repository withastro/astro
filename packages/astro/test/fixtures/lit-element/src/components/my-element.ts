import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('my-element')
export class MyElement extends LitElement {
	@property({ type: Boolean })
	bool = false;

	@property({ type: Boolean })
	falseBool = false;

	@property({type: String, attribute: 'str-attr'})
	str = 'not initialized';

	@property({type: Object})
	obj = {data: null};

	foo = 'not initialized';

	render() {
		let typeofwindow = typeof window.Window;
		return html`
			<div>Testing...</div>
			<div id="bool">${this.bool ? 'A' : 'B'}</div>
			<div id="false-bool">${this.falseBool ? 'A' : 'B'}</div>
			<div id="str">${this.str}</div>
			<div id="non-reactive">${this.foo}</div>
			<div id="data">data: ${this.obj.data}</div>
			<div id="win">${typeofwindow}</div>

			<!-- Slots -->
			<div id="default"><slot /></div>
			<div id="named"><slot name="named" /></div>
		`;
	}
}
