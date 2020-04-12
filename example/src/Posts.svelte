<script>
  export let route, params, query;
  import RouterParams from "./RouterParams.svelte";
  import { Link } from "svelte-hash-spa-router";
  const posts = [...Array(5).keys()].map(key => ({
    id: key + 1,
    description: "post number " + String(key + 1)
  }));
</script>

<h1 class="title">This is the posts page</h1>
<div class="columns">
  <div class="column is-one-third is-offset-one-third">
    <div class="panel">
      <div class="panel-heading">Posts List</div>
      {#each posts as post}
        <div class="panel-block has-text-centered">
          <Link to="post" params={{ id: post.id }}>Post number {post.id}</Link>
        </div>
      {/each}
    </div>

  </div>
</div>

<RouterParams {route} {params} {query} />
