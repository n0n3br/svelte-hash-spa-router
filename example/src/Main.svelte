<script>
  export let route, params, query;
  import RouterParams from "./RouterParams.svelte";
</script>

<h1 class="title">This is the main page</h1>
<RouterParams {route} {params} {query} />
