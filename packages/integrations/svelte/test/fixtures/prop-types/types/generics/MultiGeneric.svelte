<script lang="ts" generics="T extends Record<string, unknown>, U extends keyof T">
  interface Props {
    data: T;
    key: U;
  }

  let { data, key }: Props = $props();
</script>

<p>{String(data[key])}</p>
