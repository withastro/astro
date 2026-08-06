<script lang="ts">

  interface Props {
    children: number;
  }

  const { children }: Props = $props();
</script>

<p>{children}</p>