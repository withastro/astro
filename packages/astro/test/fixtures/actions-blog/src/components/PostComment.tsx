import { getNameProps, actions } from "astro:actions";
import { useState } from "react";

export function PostComment({postId}: {postId: string}) {
	const [comments, setComments] = useState<{ author: string, body: string }[]>([]);

	return (
		<>
		<form method="POST" onSubmit={async (e) => {
			e.preventDefault();
			const form = e.target as HTMLFormElement;
			const formData = new FormData(form);
			const {comment} = await actions.blog.comment(formData);
			setComments(c => [comment, ...c]);
			form.reset();
		}}>
			<input {...getNameProps(actions.blog.comment)} />
			<input type="hidden" name="postId" value={postId} />
			<label className="sr-only" htmlFor="author">Author</label>
			<input id="author" type="text" name="author" placeholder="Your name" />
			<textarea rows={10} name="body"></textarea>
			<button type="submit">Post</button>
		</form>
		{comments.map(c => (
        <article style={{ border: '2px solid color-mix(in srgb, var(--accent), transparent 80%)', padding: '0.3rem 1rem', borderRadius: '0.3rem', marginBlock: '0.3rem' }}>
          <p>{c.body}</p>
          <p>{c.author}</p>
        </article>
		))}
		</>
	)
}
