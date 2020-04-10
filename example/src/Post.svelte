<script>
  export let params, query, route;
  import RouterParams from "./RouterParams.svelte";
</script>

<h1 class="title">This is the post number {params.id} page</h1>
<a href="#/posts">Go Back</a>
<RouterParams {route} {query} {params} />
