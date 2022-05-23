<script lang="typescript">
    import { foo } from '../documentation'

    foo()
    abc(1, '')

    function abc(a: number, b: number): string
    /**
     * @param b formatted number
     */
    function abc(a: number, b: string): string
    function abc(a: number, b: string | number): string {

    }

    let items: string[] = [];
</script>

{#each items as item}
    {item}
{/each}
