import { actions } from 'astro:actions';
import { useFormStatus } from 'react-dom';

export function Like({ postId, label, likes }: { postId: string; label: string; likes: number }) {
	return (
		<form action={actions.blog.like}>
			<input type="hidden" name="postId" value={postId} />
			<Button likes={likes} label={label} />
		</form>
	);
}

function Button({likes, label}: {likes: number; label: string}) {
	const { pending } = useFormStatus();

	return (
		<button aria-label={label} disabled={pending} type="submit">
			{likes} ❤️
		</button>
	)
}
