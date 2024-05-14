import { actions } from 'astro:actions';
import { useActionState } from 'react';
import { withState } from '@astrojs/react/actions';

export function Like({ postId, initial }: { postId: string; initial: number }) {
	const [state, action, pending] = useActionState(
		withState(actions.blog.like),
		initial,
	);

	return (
		<form action={action}>
			<input type="hidden" name="postId" value={postId} />
		<button
			aria-label="Like"
			disabled={pending}
			type="submit"
		>
			{state} ❤️
		</button>
		</form>
	);
}
