<script>
  export let route, params, query;
  import RouterParams from "./RouterParams.svelte";
</script>

<h1 class="title">This is the about page</h1>
<h2>The query name is {query.name}</h2>
<RouterParams {route} {params} {query} />
