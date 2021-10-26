<script>
    export let name = "Jeanine White";
</script>

<footer>
    &copy; {new Date().getFullYear()} {name}
    <small>🚀 Built with Astro</small>
</footer>

<style>
    footer {
        text-align: center;
        padding: 8rem 2rem 4rem;
    }

    small {
        display: block;
        margin-top: 1rem;
        color: var(--t-subdue);
        font-size: var(--f-d2);
        text-transform: uppercase;
    }
</style>
