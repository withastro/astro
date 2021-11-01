import { LitElement, html } from 'lit';

class CalcAdd extends LitElement {
  static get properties() {
    return {
      num: {
        type: Number,
      },
    };
  }

  render() {
    return html` <div>Number: ${this.num}</div> `;
  }
}

const tagName = 'calc-add'
customElements.define(tagName, CalcAdd);
