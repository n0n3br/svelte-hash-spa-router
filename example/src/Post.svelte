<script>
  export let params, query, route;
  import { navigate } from "svelte-hash-spa-router";
  import RouterParams from "./RouterParams.svelte";
</script>

<h1 class="title">This is the post number {params.id} page</h1>
<button
  class="button is-primary"
  on:click={() => {
    navigate('posts');
  }}>
  Go Back
</button>
<RouterParams {route} {query} {params} />
