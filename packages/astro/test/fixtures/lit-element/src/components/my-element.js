import { LitElement, html } from 'lit';

export const tagName = 'my-element';

export class MyElement extends LitElement {
  render() {
    return html`
      <div>Testing...</div>
    `;
  }
}

customElements.define('my-element', MyElement);