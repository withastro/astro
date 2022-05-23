<script lang="ts">
    function aFunction(param: string) {
        param += 1; // should error
        const foo = subFunction();

        function subFunction() {
            return param ? 1 : 2;
        }
    }

    function action(node: HTMLElement) {
        aFunction(true); // should error
        const foo = 'bar';
    }
</script>

<div use:action>
    <p>lorem ipsum</p>
    <slot />
</div>

<NonExistentComponent
    propA={1}
    on:event={(evt) => {
        const result = evt.detail ? aFunction(false) : aFunction('right');
        result;
    }}
>
    <p>Inner Content</p>
</NonExistentComponent>
