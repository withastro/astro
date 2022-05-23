<script lang="ts">
    import { SvelteComponentTyped } from "svelte";
    import Imported from './imported.svelte';

    class Works extends SvelteComponentTyped<any, any, any> {}
    class Works2 extends SvelteComponentTyped<
        { hi: string },
        { click: MouseEvent },
        {
            default: {
                foo: string;
            };
        }
    > {}
    class Works3 extends SvelteComponentTyped<
        any,
        { [evt: string]: CustomEvent<any> },
        never
    > {}
    class DoesntWork {}
</script>

<!-- valid -->
<Works />
<Imported />
<Works2 hi="hi" on:click={e => console.log(e.movementX)} let:foo>
    {foo.toLocaleLowerCase()}
</Works2>
<Works3 />
<svelte:component this={Works} />
<svelte:component this={Works2}  hi="hi" on:click={e => console.log(e.movementX)} let:foo>
    {foo.toLocaleLowerCase()}
</svelte:component>
<svelte:component this={Works3} />

<!-- invalid -->
<DoesntWork />
<svelte:component this={DoesntWork} />

<!-- invalid, no additional errors for new transformation (everything else is any) -->
<DoesntWork foo="bar" on:click={() => ''} let:etc>
    {etc}
</DoesntWork>
<svelte:component this={DoesntWork} foo="bar" on:click={() => ''} let:etc>
    {etc}
</svelte:component>
