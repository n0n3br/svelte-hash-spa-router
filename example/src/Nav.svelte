<script>
  import { Link } from "svelte-hash-spa-router";
  const routes = [
    { name: "main", path: "/" },
    { name: "about", path: "/about", query: { name: "Rogerio " } },
    { name: "posts", path: "/posts", match: /\/posts\/.+/g }
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
        <Link
          to={route.path}
          config={{ class: 'navbar-item', activeClass: 'is-active' }}
          match={route.match}
          query={route.query}>
          {route.name}
        </Link>
      {/each}
    </div>
  </div>
</nav>
