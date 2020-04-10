<script>
  export let route, params, query;
  import RouterParams from "./RouterParams.svelte";
  const posts = [...Array(10).keys()].map(key => ({
    id: key,
    description: "post number " + String(key)
  }));
</script>

<h1 class="title">This is the posts page</h1>
<div class="columns">
  <div class="column is-one-third is-offset-one-third">
    <div class="panel">
      <div class="panel-heading">Posts List</div>
      {#each posts as post}
        <div class="panel-block has-text-centered">
          <a href={`#/post/${post.id}`}>{post.description}</a>
        </div>
      {/each}
    </div>

  </div>
</div>

<RouterParams {route} {params} {query} />
