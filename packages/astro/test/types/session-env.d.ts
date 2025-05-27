declare namespace App {
	interface SessionData {
		value: string;
		cart: Array<string>;
		key: { value: 'none' | 'expected' | 'unexpected' };
		user: {
			id: string;
			email: string;
		};
	}
}
