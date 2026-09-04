<script lang="ts" generics="T extends (val: string) => boolean">
  interface Props {
    predicate: T;
    value: string;
  }

  let { predicate, value }: Props = $props();
</script>

<p>{predicate(value)}</p>
