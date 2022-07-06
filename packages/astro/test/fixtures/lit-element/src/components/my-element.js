import { LitElement, html } from 'lit';

export class MyElement extends LitElement {
  static properties = {
    bool: {type: Boolean},
    str: {type: String, attribute: 'str-attr'},
    obj: {type: Object},
    reflectedBool: {type: Boolean, reflect: true},
    reflectedStr: {type: String, reflect: true, attribute: 'reflected-str'},
    reflectedStrProp: {type: String, reflect: true, attribute: 'reflected-str-prop'},
  }

  constructor() {
    super();
    this.bool = true;
    this.str = 'not initialized';
    this.obj = {data: null};
    // not a reactive property
    this.foo = 'not initialized';
    // reflected props
    this.reflectedBool = true;
    this.reflectedStr = 'default reflected string';
  }
  render() {
		let typeofwindow = typeof window.Window;
    return html`
      <div>Testing...</div>
      <div id="bool">${this.bool ? 'A' : 'B'}</div>
      <div id="str">${this.str}</div>
      <div id="data">data: ${this.obj.data}</div>
			<div id="win">${typeofwindow}</div>

			<!-- Slots -->
			<div id="default"><slot /></div>
			<div id="named"><slot name="named" /></div>
    `;
  }
}

customElements.define('my-element', MyElement);
