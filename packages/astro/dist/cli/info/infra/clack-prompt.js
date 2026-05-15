import { confirm } from '@clack/prompts';
class ClackPrompt {
	#force;
	constructor({ force }) {
		this.#force = force;
	}
	async confirm({ message, defaultValue }) {
		if (this.#force) {
			return true;
		}
		const response = await confirm({
			message,
			initialValue: defaultValue,
			withGuide: false,
		});
		return response === true;
	}
}
export { ClackPrompt };
