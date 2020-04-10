<script>
  import { onMount, getContext } from "svelte";
  export let to = "",
    params = {},
    query = {},
    config = {};
  let route, routes, className, activeClassName;

  className = config.class || "";
  activeClassName = config.activeClass || "active";
  onMount(() => {
    if (!to) {
      throw new Error(
        "svelte-hash-spa-router Link component expects to to be defined"
      );
      routes = getContext("shsr-routes");
      route = routes.find(r => r.path === to || r.name === to);
      if (!route) {
        throw new Error(
          `svelte-hash-spa-router Link to value '${to}' is not a name or path of a valid route`
        );
      }
    }
  });
  $: hash = route.path
    .split("/")
    .map(r => {
      if (r.slice(0, 1) != 0) return r;
      if (!params[r.slice(1)]) {
        throw new Error(
          `svelte-hash-spa-router : route ${route.name ||
            route.path} expects param ${r.slice(1)} to be defined`
        );
        return "";
      }
      return params[r.slice(1)];
    })
    .join("/");
  $: query = !Object.keys(query).length
    ? ""
    : "?" +
      Object.keys(query)
        .map(key => key + "=" + query[key])
        .join("&");

  $: currentRoute = getContext("ssh-route");
</script>

<a
  href={hash + query}
  class={className}
  class:{activeClassName}={route.path === currentRoute.path}>
  <slot />
</a>
