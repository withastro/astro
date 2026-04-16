<script lang="ts">
  interface Props {
    name: string;
    age?: number;
    bold?: boolean;
  }

  let { name, age = 0, bold = false }: Props = $props();
</script>

<p class:bold={bold}>
  Hello {name}, you are {age} years old.
</p>
