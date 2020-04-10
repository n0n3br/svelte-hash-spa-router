<script>
  import { getContext } from "svelte";
  const routes = [
    { name: "main", path: "/" },
    { name: "about", path: "/about" },
    { name: "posts", path: "/posts" }
  ];
</script>

<style>
  .navbar-menu {
    margin-right: 20px;
  }
</style>

<nav
  class="navbar is-info is-light"
  role="navigation"
  aria-label="main navigation">
  <div class="navbar-brand">
    <div class="navbar-item">svelte-hash-spa-router</div>
  </div>
  <div class="navbar-menu">
    <div class="navbar-end">
      {#each routes as route}
        <a class="navbar-item" href={'#' + route.path}>{route.name}</a>
      {/each}
    </div>
  </div>
</nav>
