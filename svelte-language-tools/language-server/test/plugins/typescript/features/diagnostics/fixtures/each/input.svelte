<script lang="ts">
interface OptionObject {
  label: string;
  value: string;
}

const simpleOptions: number[] = [];
const complexOptions: string[] | OptionObject[] = [];

const badOptions = {
  object: {},
  number: 1,
};
</script>

<!-- Simple Arrays work fine -->
{#each simpleOptions as option, i}
  <div>{option}, {i}</div>
{/each}
{#each simpleOptions as option, i (i)}
  <div>{option}, {i}</div>
{/each}

<!-- Unions of Arrays work fine -->
{#each complexOptions as option, i (typeof option === "string" ? option : option.value)}
  <div>{typeof option === "string" ? option : option.label}, {i}</div>
{/each}

<!-- Non-ArrayLike items fail-->
{#each badOptions.object as option, i}
  <div>{option} {i}</div>
{/each}

{#each badOptions.number as option, i}
  <div>{option} {i}</div>
{/each}
