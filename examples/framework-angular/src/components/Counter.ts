import { Component, Input } from '@angular/core';
@Component({
	selector: 'counter',
	standalone: true,
	template: `<div class="counter">
			<button (click)="subtract()">-</button>
			<pre>{{ counterValue }}</pre>
			<button (click)="add()">+</button>
		</div>
		<div class="counter-message">
			<h1>{{ textProp }}</h1>
		</div>`,
	styles: [
		`
			.counter {
				display: grid;
				font-size: 2em;
				grid-template-columns: repeat(3, minmax(0, 1fr));
				margin-top: 2em;
				place-items: center;
			}

			.counter-message {
				text-align: center;
			}
		`,
	],
})
export default class Counter {
	@Input() textProp = '';

	counterValue = 0;
	add() {
		this.counterValue++;
	}
	subtract() {
		this.counterValue--;
	}
}
