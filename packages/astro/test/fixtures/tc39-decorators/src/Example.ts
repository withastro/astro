import { logCall } from './decorator';

export class Example {
	@logCall
	greet(name: string): string {
		return `Hello, ${name}!`;
	}
}
