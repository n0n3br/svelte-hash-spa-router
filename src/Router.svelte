<script context="module">
  import { writable } from "svelte/store";
  const routerStore = writable({
    routes: [],
    route: {},
    query: {},
    params: {}
  });
  export const store = {
    subscribe: routerStore.subscribe
  };
</script>

<script>
  import { onMount } from "svelte";
  import Template404 from "./404.svelte";
  import TemplateError from "./Error.svelte";
  export let routes = [];

  let path, route, params, query;

  onMount(() => {
    if (!window.location.href.includes("/#/"))
      window.history.pushState("", "", `${window.location.origin}/#/`);
    if (!routes.find(r => r.name === "404"))
      routes.push({ name: "404", path: "/404", component: Template404 });
    routerStore.update(state => ({
      ...state,
      routes: routes.map(r => ({ name: r.name, path: r.path }))
    }));
    update();
    window.onhashchange = () => {
      update();
    };
  });

  const update = () => {
    path = window.location.hash.split("?")[0].replace("#", "");
    route = routes.find(r => {
      return pathRegex(r.path).test(path);
    });
    if (!route) {
      history.replaceState({}, {}, "#/404");
    }
    params = extractParams();
    query = extractQuery();
    routerStore.update(state => ({ ...state, route, params, query }));
  };

  const pathRegex = url => {
    return new RegExp(
      "^" +
        url
          .split("?")[0]
          .replace(/\//g, "\\/")
          .replace(/(:\w+)/g, ".") +
        "$"
    );
  };

  const extractParams = () => {
    if (!route || !path) return {};
    const routeTokens = route.path.split("/");
    const urlTokens = path.split("/");
    return routeTokens.reduce((m, r, i) => {
      if (r.includes(":")) m[r.slice(1)] = urlTokens[i];
      return m;
    }, {});
  };

  const extractQuery = () => {
    if (!path) return {};
    let token = window.location.hash.split("?");
    if (token.length <= 1) return {};
    return token[1].split("&").reduce((m, v) => {
      return { ...m, [v.split("=")[0]]: v.split("=")[1] };
    }, {});
  };
</script>

{#if route}
  <svelte:component
    this={route.component}
    route={{ path: route.path, name: route.name }}
    {params}
    {query} />
{:else}
  <TemplateError />
{/if}
