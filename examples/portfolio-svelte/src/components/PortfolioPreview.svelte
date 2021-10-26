<script>
    export let project;
</script>

<div class="card">
    <div class="titleCard" style="background-image:url({project.img})">
        <h1 class="title">{project.title}</h1>
    </div>
    <div class="pa3">
        <p class="desc mt0 mb2">{project.description}</p>
        <div class="tags">
            Tagged:
            {#each project.tags as t}
                <div class="tag" data-tag={t}>
                    {t}
                </div>
            {/each}
        </div>
        <a class="link" href={project.url}>
            <span class="linkInner">View</span>
        </a>
    </div>
</div>

<style>
    .card {
        position: relative;
        color: var(--t-bg);
        background: var(--t-fg);
        border: 1px solid #f0f0f0;
    }
    .title {
        position: absolute;
        top: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0;
        color: white;
        flex-direction: column;
        font-size: var(--f-u4);
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.0625em;
    }
    .titleCard {
        position: relative;
        background-size: cover;
        background-position: 50% 100%;
        padding-top: 37.5%;
    }
    .desc {
        font-size: var(--f-u1);
        line-height: 1.4;
    }
    .link {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--t-bg);
        font-size: var(--f-u2);
        font-weight: 700;
        background: rgba(0, 0, 0, 0.25);
        opacity: 0;
        text-decoration: none;
        text-transform: uppercase;
        transition: opacity 150ms linear;
    }
    .link:focus,
    .link:hover {
        opacity: 1;
    }
    .link:focus .linkInner,
    .link:hover .linkInner {
        transform: translateY(0);
        border-color: rgba(255, 255, 255, 0.625);
    }
    .linkInner {
        padding: 0.375em 1em;
        border: 2px solid rgba(255, 255, 255, 0);
        transition: transform 300ms cubic-bezier(0, 0.4, 0.6, 1),
            border-color 1s linear;
        transform: translateY(25%);
    }
    .nav {
        display: flex;
        justify-content: flex-end;
    }
    .tags {
        font-size: var(--f-d2);
        text-transform: uppercase;
    }
    .tag {
        display: inline-block;
        color: var(--c-yellow);
        text-transform: uppercase;
        margin-left: 0.5em;
    }
    .tag:nth-of-type(1n) {
        color: var(--c-green);
    }
    .tag:nth-of-type(2n) {
        color: var(--c-orange);
    }
    .tag:nth-of-type(3n) {
        color: var(--c-blue);
    }
    .tag:nth-of-type(4n) {
        color: var(--c-pink);
    }
</style>
