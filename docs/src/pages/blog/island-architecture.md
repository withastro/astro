---
layout: ~/layouts/Main.astro
title: Island Architecture
draft: true
---

<!--
    @aFuzzyBear: I have been spending most the day learning more about Island Architecture, wrote plenty of notes, listened to Fred K Schott's interview on Speakeasy(https://www.youtube.com/watch?v=mgkwZqVkrwo) and the interview with Jason Lengstrof (https://www.youtube.com/watch?v=z15YLsLMtu4)
    Figured I might give writing this a wee go,

    I wanted to take this from the direction of it being more of a critique of the past and present state of affairs in web dev
    Post structure:
    1)Start with an introduction to Islands Arch
    2)Talk about the different Architectures that can be used in Web-dev
    3)MVC/StaticSites - SPA's
    4)Frameworks, get some external links onto the page
    4)Moving to ESM
    5)Benefits of ESM
    6)

 -->

<!-- Intro -->

> "No man is an island. However, Web Components should be"

The concept behind Island architecture comes from [Jason Miller](https://twitter.com/_developit), The creator of [Preact](https://preactjs.com/) and a Google, DevRel Engineer.

In the summer of 2020, he managed to formulated his thoughts of how web architecture should be, in the idyllic sense, and placed them onto his [blog post](https://jasonformat.com/islands-architecture/).

His seminal post outlines and discusses the general concept of 'islands' as an architectural design process that could be used in Web Development, allowing for better improvements in overall site performance, SEO, UX, and everywhere else. His given explanation describing this new paradigm, was extraordinarily succinct:

> "The general idea of an _“Islands”_ architecture is deceptively simple: Render HTML pages on the server, and inject placeholders or slots around highly dynamic regions. These placeholders/slots contain the server-rendered HTML output from their corresponding widget. They denote regions that can then be "hydrated" on the client into small self-contained widgets, reusing their server-rendered initial HTML."-Jason Miller

To develop a better understanding of what Jason meant with his proposal, let's quickly explore the backdrop, before we explain 'Island Architecture' and how it is applied into Astro as our primary ethos.

## Programming Paradigms

Think of a simple webpage. On which are many different types of components that are shown on this page, components that are shared across the site, others contain fixed content, some are a bit more elaborate that may perhaps use different state's or need to fetch multiple data streams from external sources.

Such a site would have very few actual 'moving' pieces, or _dynamic_ elements. For the most part the content tends to be fixed, and static.

In order to allow for dynamism and interactivity we are often left making overly complex solutions to deliver the slightest form of action on the application.

Complexity becomes inherent in the design process of the application. As a result, developers have to adopt some dogma, that comes from certain architectural design styles and patterns.

Given the [catalogue of patterns](https://en.wikipedia.org/wiki/List_of_software_architecture_styles_and_patterns) that are available, utilizing the right architecture for the application often comes from hard-to-obtain experience.

Web developers tend to gravitate towards tried and tested practices, and none fit the requirements better than the [Model-View-Controller](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller) (**MVC**) design pattern.

Where the **Model** contains the data structures and logic that governs the use of the data in the application. **Views** are the visual representation of the data that the user sees, and the **Controller** connects the views to their relevant data _Models_ based on their interactions with the User.

This design pattern works well for our [client-server](https://en.wikipedia.org/wiki/Client%E2%80%93server_model) based applications. Since the models are placed on the _servers_, the views that are sent back over the wire tend to be static _documents_, controllers are sent along with the static files to facilitate the behaviours that web developers created for their application, in the form of _scripts_.

## Rise of the Frameworks

A vast swathe of libraries, frameworks and tooling rose up to meet the challenges of providing a Developer Experience (DX) that would let them create their applications, _'freely'_.

Helping to abstract away much of the complexity needed in implementing architectural design decisions into their application.

The likes of; [ASP.NET](https://dotnet.microsoft.com/learn/aspnet/what-is-aspnet-core) and [Blazor](https://dotnet.microsoft.com/apps/aspnet/web-apps/blazor) for [.NET](https://dotnet.microsoft.com/), [Ruby On Rails](https://rubyonrails.org/), [Laravel](https://laravel.com/) & [Symphony](https://symfony.com/) for [PHP](https://www.php.net/), are examples of the MVC patterns seen in other server-side programming languages.

For a long time, JavaScript was solely restricted to the Browser, then [Node.js](https://nodejs.org/en/) appeared. Node.js is a standalone JavaScript runtime built on the Chrome V8 engine.

This was a seismic shift that occurred in Web Development, by allowing JavaScript to escape the browser and operate on the server, developers could use JS on both; Front & Back-ends, when developing their applications.

Within the new JavaScript + Node ecosystem, JS MVC frameworks began to appear, e.g: [BackboneJS](https://backbonejs.org/), [ExpressJS](https://expressjs.com/), [Ember](https://emberjs.com/), [MeteorJS](https://www.meteor.com/), to name but a few.

This pattern of statically generated content on the server was becoming a bit of a performance bottleneck.

Where some asset-heavy page would take longer to render on the server than a lighter page.

This would block subsequent requests being made to the server, and more crucially responses being sent back from the server.

Server performance and optimisation only addressed the problem so far, but with larger payloads and pages being sent more frequently, something had to be done.

Frameworks, rose again to the challenge of delivering a better User Experience (UX) began to ship [Single Page Applications](https://en.wikipedia.org/wiki/Single-page_application) (**SPA**) to the client.

SPA's became a fast and effective ways to sending feature-rich applications to the client without the load being placed on the server.

Instead rendering the application would now be carried out wholly on the client device. Thus allowing the Server to send a single, simple, page to the client.

There are many benefits in providing a SPA to Clients. SPA's never needs a page refresh, since all the files (HTML/CSS/JS) had already been sent over the wire.

This only required the End-User's web browser to then read and render the application to the screen.

But SPA's came with their own hidden cost that comes with abstracting away the complexity. Recognising the many issues with SPA's from a holistic DX to a seamless UX/UI.

Frameworks began to appear in the ecosystem that allowed developers to build even more advanced Single-Page-Applications.

Some of these were developed by industry leaders, such as Google with their [Angular Project](https://angularjs.org/), [React](https://reactjs.org/) which was open sourced by Facebook. Or by the JS community themselves driving changes with [Preact](https://preactjs.com/), [Vue](https://vuejs.org/) and [Svelte](https://svelte.dev/), [Webpack](https://webpack.js.org/) & [Babel](https://babeljs.io/setup)

## The Status Quo

It's slightly hubris to suggest that the web development ecosystem had at all settled for any period of time, well at least long enough for a Status Quo to coalesce.

However, given the vibrancy and versatility of the ecosystem, a status quo had indeed began to take hold.

Rooted in the deepest annals of the developers psyche, was the slow conformity towards embracing UI frameworks to build the whole site as applications instead of the dynamic components that it was meant for.

Everything ended up being sent to the Client. From Rendering to Routing, bundled payload sizes drastically increased, and client devices were asked to do a lot more.

By placing the onus on the client, Server stress was indeed lessened. But there was a cost to this status quo.

The End-User experience was drastically suffering, for their devices now became the bottleneck, unable to execute the massive payloads that were being sent back from the server.

As demonstrated, JavaScript and its community are quick to change in certain places and slow in others. The gradual adoption of [EcmaScript Modules](https://tc39.es/ecma262/#sec-modules)(**ESM**) as a standard to the JavaScript spec was a complete sea-change to the ecosystem.

Prior to the formalisation of ESM, module usage in JS were often limited to libraries and were difficult to use outside the browser.

Using community developed conventions, helped push the goal of a modular ecosystem with [CommonJS](https://en.wikipedia.org/wiki/CommonJS)(**CJS**).

Node v12 shipped with ESM Modules as part of the standard in node. Signalling the start of something entirely new.

## The Great Migration

ESM adoption was indeed slow, the gradual migration from `require()` to `import()` took a while.

Now developing in an ESM world, allows for certain advantages to be exploited.

This wanting exploitation of new features have given way for another influx of new libraries, frameworks, tooling and a whole suite of new methods of writing JS.

We are now experiencing new tools in the ecosystem that feature ESM as defaults.

By doing so we can take full advantage of unbundled developer environments, allowing for projects to start-up in the tens of milliseconds, instead of whole seconds and full minutes.

Using ESM in the Browser, tools can build once and cache forever. Tree-shaking and code optimisations can occur, more frequently and with greater efficacy. Reducing massive bundle sizes down to a few hundred Kilobytes.

Tools like [Snowpack](https://www.snowpack.dev/) and [Vite](https://vitejs.dev/) introduce a whole new experience that developers were previously denied in their development process and that is speed.

With cut-edge DX features like [HMR](https://npm.io/package/esm-hmr) has quickly became the industry de facto, and build times reduced by a factor of 100x.

This new generation of ESM tools is extremely encouraging for web developers.

## A Brave New World

Into this new age ESM world, we have had a dearth of innovation from the established frameworks to address some of the root issues that plagued web development over its time.

Basic questions of : Websites or WebApp's were still unresolved. Where to render the site, on the server or on the client, perhaps a bit of both? What determines the need for dynamic content and what specifies content to be static?

Witnessing frameworks slowly go full circle and return to Server-Side-Rendering (_SSR_) their applications was in part only allowed to be considered in an ESM world, however it was a bit of an admission of culpability of sorts.

By inadvertently admitting that the current model is flawed, opened up the space for a new form of discourse to enter, and help redefine the ecosystem moving forward.

SSR frameworks such as [Next.js](https://nextjs.org/), [Nuxt.js](https://nuxtjs.org/), [SvelteKit](https://kit.svelte.dev/), did help address some of the underling questions, within the current paradigm.

Developing methods and techniques to deliver production-stable SSR along with tooling and support for the developer.

But in a new age, retaining previously disputed tenants only aided the lack of innovation in this new dawn.

Jason Miller's formulations of an 'Island'-styled approach only augments the discussion with fresh new ideas about Website and Application development.

## The Golden Isles and its many Islands

In the introduction we placed a quote from Jason, describing the general concept of Island architecture. Let's revisit his words, since we have a better understanding of the context in which this is being proposed.

Jason asks us to think of a Island architecture as a static HTML document. One that is rendered entirely on the server.

The document contains multiple separate embedded applications, that are injected into placeholders or '_slots_', which form dynamic regions on the page.

The Server renders HTML outputs form each of these dynamic components, and places them onto the static document being sent back down to the End-User.

These slots, of dynamic regions, can then be '_hydrated_'. [Hydration](<https://en.wikipedia.org/wiki/Hydration_(web_development)>) is a process that allows for Client-Sided JS to convert and make static HTML, dynamic, reusing their initial server-rendered HTML.

This 'micro' architecture is similar to both 'micro-frontends' and 'micro-services'. Both share the concept of breaking applications into small indivisible units. But the problem is that a lot of the small modular units are rarely composed in HTML.

With Island-Architecture, he proposes a form of progressive enhancement for the dynamic components by using a technique known as _Partial Hydration_.

Let's look at the following analogy:

On our Static page, we have an image carousel. Such carousel needs to have some form of interactivity to load the next image after a certain amount of time has elapsed, along with navigation and pagination buttons on the carousel.

To do this we would need to implement some behaviour on our carousel.

In the traditional sense, we might be using a React Component to help create the aforementioned experience. In order to do this we would have to include the React-runtime plugin as a top-level `<script>` within our HTML document.

This means for our page, we need to wait for React to be fetched and downloaded, then parsed and executed, have it wait for the page to display the carousel before we receive the behaviour and functionality we expect from our small dynamic component.

Instead of this laborious process, one would simply render the carousel in HTML on the server and have a dedicated `<script>` that is emitted when the component for the carousel is displayed.

This would then load the functionality for the carousel in-place, transforming it instantly into a dynamic image slide show, with navigation.

## Island Hydration

By now the idea of Island-architecture must be settling in, and one must be thinking, this is just [Progressive Hydration](<https://en.wikipedia.org/wiki/Hydration_(web_development)#Progressive_rehydration>), and you wouldn't be overly off mark.

Progressive Hydration that is used in frameworks like: Angular, React, Preact, Vue. Are individual components, which are loaded and then initialised over a period of time.

Using scheduling processes, and accounting for things like viewport visibility, content value, probability of interaction etc. They can abstract away the intricacies and delivery this form of hydration for developers.

By using Island styled components, this form of hydration essentially comes for **free**.

Since the larger dynamic components on a page are being initialised separately, not progressively. The difference lets individual regions on the page to become interactive without the page requiring to first load anything.

This expands further, as it doesn't need any form of ['Top-down Rendering'](https://developers.google.com/web/fundamentals/performance/rendering).

Since there is no outer `<div id='root'>` element that needs to be initialised before the inner contents can be exposed.

Every region of the page is an isolated unit, an island, on its own, connected to others by the HTML page. With such an approach the benefits do begin to stack up.

A key benefit is seen with the site performance. Since isolation is inherent, if a single issue affects a component, it wouldn't affect the other _islands_ on the page.

## Exploring the Island

As we explore further into the Island, we can see immediate trade differences between framework produced SSR solutions and those that could be provided by using Island Architecture.

Quickly wandering back to the Status Quo for a brief interlude. We use SSR with SPA's to help tackle the downside of SPA's and its SEO. Appealing to the search engines in this manner has another negative effect on the UX.

> "...visitors are left waiting for the actual functionality of a page to arrive while staring at a frustratingly fake version of that page." - Jason Miller

There are other issues that stem from traditional SSR, and being idly unawares of such performance pitfalls, gives rise to an orchestra of potential problems.

Further compounded with misconceptions on implementations and utilisations of solid SSR techniques, this practice is increasingly prominent amongst the Status Quoticians.

The one most obvious drawback with SSR is the amount of work JS has to do during the initial page load, is far excessive than is necessary, and is extremely inefficient use of resources.

We find with our "Islands" model, that with Server rendering is a fundamental part of how pages are delivered to the browser.

The responded HTML, would still contain all the rendered content that the user requested. With some islands yet to engage their client-sided interactivity. The document sent should contain all the content that the User would need.

An example of this would be a product page for a e-commerce business. A product page, using the Islands model would contain that product's description, price etc, Having the dynamic components becoming interactive on demand.

We also discover that with the Islands model we have better accessibility and discoverability of our elements and the contents within.

Less code is eventually shipped from each island which is a massive cost-saving benefit.

However the conceptual idea of using Islands from a Web developers viewpoint is that, we get to come full circle and begin to deliver lightening fast user experiences without having the previous trade-offs and penalties that came from previous design models.

They're plenty of more important discoveries yet to be made when exploring the Island Architecture model in more detail.

Jason finished his post with the following:

> "It's possible...that adopting a model like this requires more up-front design thinking. There are far few batteries-included options available ...Who knows, maybe we can fix that." - August 2020

## Astrolands

<!-- Conclusion, final words. Here tie in Astro -->

Here at Astro, we fully embrace the principles ideas behind Jason's 'Island Architecture'. As a result, we have been hard at work trying to apply this new innovative concept into Web Development and the JS ecosystem.

We would like to take this time to encourage you to start exploring how Astro accomplishes this. And experience how easy it is to adopt as an architectural design philosophy.
