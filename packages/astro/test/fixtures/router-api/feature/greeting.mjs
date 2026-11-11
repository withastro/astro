/** `Astro.greeting` / `context.greeting`, worded by the `greetingWord` manifest data. */
export default function greeting(state) {
	return { create: () => `${state.manifest.greetingWord} from ${state.pathname}` };
}
