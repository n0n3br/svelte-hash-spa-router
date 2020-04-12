# svelte-hash-spa-router

A schema based spa (single page application) router built for Svelte3.

The package exports 4 constants:

- Router
- Link
- navigate
- store

## Why hash and not history ?

Hash mode is better suited por static single page application, since it doesn't require any server special configuration. Users can share the link or refresh the page and the router won't get lost.

## Get started

Look at the [example](https://github.com/n0n3br/svelte-hash-spa-router/tree/master/example) folder in the project github for a real life example including all the features provided

## Install

```bash
# you can use npm
npm install --save @n0n3br/svelte-hash-spa-router
# or yarn
yarn add @n0n3br/svelte-hash-spa-router
```

## Usage

```html
<!-- App.svelte -->
<script>
  import { Router, Link } from '@n0n3br/svelte-hash-spa-router';
  import Home from './Home.svelte';
  import About from './About.svelte';
  import Redirect from './Redirect.svelte';

  const routes = [
    { name: 'home', path: '/', component: Home},
    { name: 'about', path: '/about', component: About},
    // redirect route won't render because of the beforeRouteEnter guard
    { name: 'redirec', path: '/redirect', component: Redirect, beforeRouteEnter: navigate => navigate('home', {}, {}) }
  ]

  const linkConfig = {
    activeClass: 'is-active', // class applied when the link is active
    class: 'nav-link' // class applied to the a element of the link
  }
</script>
<main>
  <ul>
    <li><Link to='home' config={linkConfig}>Home</Link></li>
    <li><Link to='about' config={linkConfig}>About</Link></li>
    <li><Link to='redirec' config={linkConfig}>Redirect</Link></li>
  </ul>
  <Router {routes} />
</main>
```

## API

### Router

Provides the router container that will choose wich component to render based on the browser url.

###### Properties

| Property | Required | Default Value | Description                                                                                                                                            |
| :------: | :------: | :-----------: | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `routes` |    ✔     |      [ ]      | An array that describes the routes. Each route is composed of a name, a path (`/main` for example), a component and an optional beforeRouteEnter guard |

The router will export route (the active route path and name), params (url params with name and value), and query (query params with name and value) to the rendered route. All you need to do is put a `export let route, params, query` in the script portion of your component.

### route

Each individual route in the routes array of the Router component

###### Properties

|      Property      | Required | Default Value | Description                                                                                                                                                                                                                                                                                                                                                                                                                       |
| :----------------: | :------: | :-----------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|       `name`       |    ✔     |      ''       | A string to name the route. The name can be used in the Link component or in the navigate function                                                                                                                                                                                                                                                                                                                                |
|       `path`       |    ✔     |      ''       | A string that describe the path of the route. To insert parameters passed by the url in the path, prepend their name with : (/post/:id for example). You can have as many parameters as you want in the path                                                                                                                                                                                                                      |
|    `component`     |    ✔     |     null      | The Svelte component that will be rendered when the route path matches the navigator url                                                                                                                                                                                                                                                                                                                                          |
| `beforeRouteEnter` |          |     true      | A function that can be used as a guard to prevent the route render. The function receives the navigate method, making possible a redirection to another route if needed. If the function returns false, the route will not be rendered. If the function returns the redirect method, the router will render the passed route (for example redirect('main') or redirec('\')). Any other returned value will make the route render. |

### Link

Provides an easy way to render a link to a route. The rendered element will be an [A](https://developer.mozilla.org/docs/Web/HTML/Element/a).

###### Properties

| Property | Required |            Default Value            | Description                                                                                                                        |
| :------: | :------: | :---------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------- |
|   `to`   |    ✔     |                 ''                  | The name of the route that will be rendered when the link is clicked.                                                              |
| `params` |          |                 { }                 | An object with the URL params that should be applied to the route path. The name of the parameters must match the route definition |
| `query`  |          |                 { }                 | An object with the query params that should be applied to the route path.                                                          |
| `config` |          | { class: '', activeClass: 'active'} | An object with class and activeClass string parameteres.                                                                           |
| `match`  |          |                null                 | A regular expression that can be used along with route path and name to determine if the link should have the active class         |

### navigate

A method that can be used to do programatic navigation. It can have 3 parameters: to, params and query. Examples:

- navigate('main') will navigate to the main route
- navigate('posts', { id: 1 }) will navigate to /posts/1 assuming the route posts has path '/posts/:id'
- navigate('about',{}, { mode: 'development'}) will navigate to '/about?mode=development'

###### Properties

| Property | Required | Default Value | Description                                                                                                                        |
| :------: | :------: | :-----------: | :--------------------------------------------------------------------------------------------------------------------------------- |
|   `to`   |    ✔     |      ''       | The name of the route that will be rendered when the link is clicked.                                                              |
| `params` |          |      { }      | An object with the URL params that should be applied to the route path. The name of the parameters must match the route definition |
| `query`  |          |      { }      | An object with the query params that should be applied to the route path.                                                          |

### store

A subscribable Svelte Store without set and update methods. It provides access to 4 parameters:

- routes: the routes configured in the Router element
- route: the path and name of the active route
- params: url params of the current route
- query: query params of the active route

You can use the store to have access to the router information in any component, including the ones that are not children of the router.

You can subscribe to it's updates like any other Svelte store:

```javascript
import { store } from "@n0n3br/svelte-hash-spa-router";
let routes, route, params, query;
store.subscribe((state) => {
  ({ router, route, params, query } = state);
});
```
