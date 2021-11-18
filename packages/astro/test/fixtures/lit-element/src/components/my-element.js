import { LitElement, html } from 'lit';

export const tagName = 'my-element';

export class MyElement extends LitElement {
  static properties = {
    bool: {type: Boolean},
    str: {type: String, attribute: 'str-attr'},
    obj: {type: Object},
  }

  constructor() {
    super();
    this.bool = true;
    this.str = 'not initialized';
    this.obj = {data: null};
    // not a reactive property
    this.foo = 'not initialized';
  }
  render() {
    return html`
      <div>Testing...</div>
      <div id="bool">${this.bool ? 'A' : 'B'}</div>
      <div id="str">${this.str}</div>
      <div id="data">data: ${this.obj.data}</div>
    `;
  }
}

customElements.define('my-element', MyElement);
