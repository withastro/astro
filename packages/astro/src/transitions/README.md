# View Transition Navigation Events

## Current State
Currently we have to Events that provide the standard Event properties and notify the user about these two facts:
1. `astro:after-swap`: fired inside the ViewTransition after the DOM has been updated. 
2. `astro:page-load`: fired when all new scripts are run and the route announcer is set up.

The purpose of these events is to allow the users to react to the effects of the view transition on the user's code.

## Extensions

We want to extend the current event system and give users event with which they can control the processing of the view transition. We will define `astro:before-swap` as an event that is fired at `window.document` directy at the beginning of the View transition. It can be used to influence the the animation of the view transition and to replace the `swap()` function with a custom implementation.

We would also like offer an `astro:transition-prepare` event to control the part of Astro's router that runs before the ViewTransition is created. This mainly consists of the loader. Being able to replace it would allow for additional functionality like creating precentage events for the UI during loading or replacing loading from server with DOM programmatic manipulation.

There is an upcomming Standard for Navigation and events that control the navigation. It is called the [Navigation API](https://github.com/WICG/navigation-api/blob/main/README.md). The `astro:before-swap` event is completely independent of the navigation API, but influenced by it.

The natural way to introduce a preparation event with Navigation API would be to use its `NavigateEvent`. We would move the actual code of the router into an interceptor of the navigation API and would also start the view transition from with in that. It is not really feasable to simulate that with out a huge effort in a polyfill

### Event Properties known from the Navigation API

These two properties are taken over from Navigation API's `NavigateEvent`
* `navigationType: NavigationTypeString` 
* `info: any` If the transition was initiated by a call to `navigate()`, the value of `options.info`. Otherwise `undefined`

### Astro Specific Properties

The proposal fot the `astro:before-swap` Event is now:
* `readonly` `from: URL` the page where the navigation started (renamed to minimize confusion with Navigation API)
* `read-write` `to: URL` the target of the navigation (renamed to minimize confusion with Navigation API)
* `read-write` `direction: Direction | string` the values directly supported by Astro are `'forward'` and `'backward'` but this can be extended to other values. This property is writable.
* `readonly` `navigationType: NavigationTypeString` 
* `readonly``info: any` If the transition was initiated by a call to `navigate()`, the value of `options.info`. Otherwise `undefined`
* `read-write` `newDocument: Document`the DOM to transition to. might be an empty DOM when `swap()` manipulates the current DOM programmatically.
* `read-write` `swap: ()=>Promise<Void>` initially the deault inplementation of the `swap()` opperation. 
The task of the swap operation is to update the current DOM, typically to reflect the newDocument. Event listeners can set this to their custom implementation. It is the responibility of this implementation to `call` and `await` the value that was formerly stored in that property. This way, a Decorator / Chain of Resposibility of code can be build with parts that run before or after the original `swap()` or even instead, if the implementation deliberately decides not to to call the former `swap()`. 
* `viewTransition: `[ViewTransition](https://developer.mozilla.org/en-US/docs/Web/API/ViewTransition) the object returned by `startViewTransition()`  

The event is fired on `window.document` right at the beginning of the view transition. The listeners should only execute short sequences of synchronous code as EventListener can not be `awaited` for are.  Arbitrarry asynchronous code can be executed inside `swap()` by definig a decorator callback..

For the proparation of the transition, two further events are proposed: `astro:before-prepare`and `astro:after-prepare` These events will also be supported once a Navigation API only implementation of Astro's view transitions is available. 

The proposal for `astro:before-preparation` event  is this:
* `redonly` `from: URL` the page where the navigation started 
* `readwrite` `to: URL` the target of the navigation. This property is writable.
* `readwrite` `direction: Direction | string` the values directly supported by Astro are `'forward'` and `'backward'` but this can be extended to other values. This property is writable.
* `readonly` `navigationType: NavigationTypeString` 
* `readonly` `info: any` If the transition was initiated by a call to `navigate()`, the value of `options.info`. Otherwise `undefined`
* `read-write` `newDocument:Document` the DOM to transition to. might be an empty DOM when `swap()` manipulates the current DOM programmatically.
* `read-write` `loader: ()=>Promise<Void>` initially the deault inplementation of the `swap()` opperation. The task of the loader is to define a walue for `event.newDocument` Event listeners can set this to their custom implementation. It is the responibility of this implementation to `call` and `await` the value that was formerly stored in that property. This way, a Decorator / Chain of Resposibility of code can be build with parts that run before or after the original `swap()` or even instead, if the implementation deliberately decides not to to call the former `loader()` for example to replace the load from the server with programmatic DOM manipulation. Anothe rexample for decoration is to use the original loader and add some prefetching based on the newDocument's content. In case of redirects, the value of writable `event.to` should also updated to reflect the redirect.

The event is fired on `window.document` right at the beginning navigation. The listeners should only execute short sequences of synchronous code as EventListener can not be `awaited` for.  Arbitrarry asynchronous code can be executed inside `swap()` by definig a decorator callback.

The `astro:after-preparation` mimics the `astro:after-swap` event. It is a standard event with no additional attributes or functions. It is raised by `window.document` right befor the View Transition starts. The listeners should only execute short sequences of synchronous code as EventListener can not be `awaited` for. This event is ideal for example to remove a waiting animation before View Transition API takes a screenshot.

## Design Goals
### Ease of use
For Astro's users, ViewTransitions should stay as simple as they are. The use of all concepts added by this proposal is optional.

### Exposure of View Transition API
The current implementation does not use the promises returned by startViewTransition and also does not expose them to the users. We will give users accees to the ViewTransition object to enable them to integrate ViewTransition examples found on the net that use this full API. 

### Compatibility with Navigation API
After looking taking a deeper look into Navigation API we decided that it would be a valid goal to integrate with that API once it is widely available. #it seem not to be feasable to substitute Navigation Api on browsers the do not support it yet. The are no reliable polyfills and the effort to run our own is too big. The API is still experimental and subject to change. 

The benefit of integrating with the Navigation API is that on the long run we can get rid of a lot of the code that currently is maintained by Astro but will be obsolete when using the API 
* Eventhandler for link navigation, history traversal and form submission, 
* Scrolling to the target hash 
  (which the browser is a lot better at than what we do, as it also takes into account that the page may not be complete and tries it several tymes asynchronously), 
* Setting history state, redirects and rollbacks
* An error modell with abort signals and error and success events (not a part of Astro yet)
* Giving read access to older state entries (not a part of Astro yet)

## Redesign of View Transitions using Navigation API

