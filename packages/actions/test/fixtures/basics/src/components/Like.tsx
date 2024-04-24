// @ts-expect-error useFormStatus and useActionState are untyped
import { useActionState } from "react";
import { actions } from "astro:actions";

export function Like({ postId, initial }: { postId: string; initial: number }) {
  const [state, actionName, pending] = useActionState(
    async () => {
      const { likes } = await actions.blog.like({ postId });
      return { likes };
    },
    {
      likes: initial,
    },
  );
  return (
    <form action={actionName}>
			<button disabled={pending} type="submit">
				{state.likes} ❤️
			</button>
    </form>
  );
}
