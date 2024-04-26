import { useActionState } from 'react';

let count = 0;

async function addLike() {
	await new Promise((resolve) => setTimeout(resolve, 200));
	count++;
	return count;
}

function withState<TInput, TOutput>(action: (input: TInput) => Promise<TOutput>) {
	return async (state: TOutput, input: TInput) => {
		const bound: typeof action = action.bind({
			headers: {
				'X-React-State': JSON.stringify(state)
			}
		})
		return bound(input);
	};
}

export function Like() {
	const [state, action, pending] = useActionState(withState(addLike), 0);

	return (
		<form action={action}>
			<button type="submit" disabled={pending}>Like</button>
			<p>{state} likes</p>
		</form>
	)
}
