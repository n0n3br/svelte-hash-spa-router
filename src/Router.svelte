<script context="module">
  import { writable, get } from "svelte/store";
  import { makeHash, makeQuery, pathRegex } from "./utils";
  const routerStore = writable({
    routes: [],
    route: {},
    query: {},
    params: {}
  });

  export const store = {
    subscribe: routerStore.subscribe
  };
  export const navigate = (to, params = {}, query = {}) => {
    if (!to)
      throw new Error(
        "svelte-hash-spa-router navigate method expects 'to' to be defined"
      );
    const routes = get(store).routes;
    const route =
      routes.find(r => r.name === to || to.match(pathRegex(r.path))) || {};
    if (!route)
      throw new Error(`svelte-hash-spa-router route '${to}' is not valid`);
    location.hash = "#" + makeHash(route, params) + makeQuery(query);
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
    const newRoute = routes.find(r => path.match(pathRegex(r.path))) || {};
    if (!newRoute) {
      history.replaceState({}, {}, "#/404");
    }
    const beforeRouteEnter = newRoute.beforeRouteEnter || (() => true);
    const fakeNavigate = to => to;
    const routeGuardResponse = beforeRouteEnter(fakeNavigate);
    if (typeof routeGuardResponse === "string") {
      beforeRouteEnter(navigate);
    } else if (!routeGuardResponse) {
      return;
    } else {
      route = newRoute;
      params = extractParams();
      query = extractQuery();
      routerStore.update(state => ({ ...state, route, params, query }));
    }
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
