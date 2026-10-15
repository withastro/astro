<script lang="ts">
  import type { Snippet } from 'svelte';
  interface Props {
    title: string;
    loadingIcon: Snippet;
    successIcon: Snippet;
    errorIcon: Snippet;
    children?: Snippet;
  }
  const { title, loadingIcon, successIcon, errorIcon, children }: Props = $props();
</script>

<h1>{title}</h1>
{@render loadingIcon()}
{@render successIcon()}
{@render errorIcon()}
{#if children}
  {@render children()}
{/if}
