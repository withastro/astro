import { actions, isInputError } from 'astro:actions';
import { useState } from 'react';

export function ApplyForm() {
	const [result, setResult] = useState<any>(null);

	return (
		<form
			method="POST"
			data-testid="apply-form"
			action={actions.blog.apply.toString()}
			onSubmit={async (e) => {
				e.preventDefault();
				const form = e.target as HTMLFormElement;
				const formData = new FormData(form);
				const { data, error } = await actions.blog.apply(formData);

				if (error) {
					console.error('Error:', error);
				} else {
					setResult(data);
					form.reset();
				}
			}}
		>
			<label htmlFor="name">Name</label>
			<input id="name" type="text" name="name" placeholder="Your name" />

			<label htmlFor="email">Email</label>
			<input id="email" type="email" name="email" placeholder="your.email@example.com" />

			<button type="submit">Submit</button>

			{result && (
				<div data-testid="result">
					<p>Submitted: {result.name} ({result.email})</p>
				</div>
			)}
		</form>
	);
}
