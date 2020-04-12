<script>
  import { onMount } from "svelte";
  import { store } from "./Router.svelte";
  import { makeHash, makeQuery } from "./utils";
  export let to = "",
    params = {},
    query = {},
    config = {},
    match = false;
  let routes = [],
    currentRoute = {},
    className = "",
    activeClassName = "",
    linkRoute = {};

  onMount(() => {
    className = config.class || "";
    activeClassName = config.activeClass || "active";
    if (!to)
      throw new Error(
        "svelte-hash-spa-router Link component expects 'to' to be defined"
      );
  });

  store.subscribe(state => {
    routes = state.routes;
    currentRoute = state.route;
  });

  $: linkRoute = routes.find(r => r.name === to || r.path === to) || {};
  $: active =
    linkRoute.path === currentRoute.path ||
    linkRoute.name === currentRoute.name ||
    (match && currentRoute.path.match(match));

  $: completeClassName = className + (active ? " " + activeClassName : "");
</script>

<a
  href={'#' + makeHash(linkRoute, params) + makeQuery(query)}
  class={completeClassName}>
  <slot />
</a>
