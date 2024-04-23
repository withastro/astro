// @ts-expect-error useFormStatus and useFormState are untyped
import { useFormStatus, useFormState } from "react-dom";
import { actions } from "astro:actions";

export function Like({ postId, initial }: { postId: string; initial: number }) {
  const [state, actionName] = useFormState(
    async () => {
      const { likes } = await actions.blog.like({ postId });
      return { likes };
    },
    {
      likes: initial,
    }
  );
  return (
    <form action={actionName}>
      <Button likes={state.likes} />
    </form>
  );
}

function Button({ likes }: { likes: number }) {
  const { pending } = useFormStatus();

  return (
    <button disabled={pending} type="submit">
      {likes} ❤️
    </button>
  );
}
