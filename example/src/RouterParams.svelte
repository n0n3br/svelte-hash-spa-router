<script>
  export let route, params, query;
  $: router = {
    route,
    params,
    query
  };
</script>

<hr />
<h2 class="subtitle">The router params are :</h2>

<pre>{JSON.stringify(router)}</pre>
