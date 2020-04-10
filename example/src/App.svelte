<script>
  import Nav from "./Nav.svelte";
  import Router from "./Router.svelte";
</script>

<main>
  <Nav />
  <div class="hero is-fullheight-with-navbar">
    <div class="hero-body">
      <div class="container has-text-centered">
        <Router />
      </div>

    </div>
  </div>
</main>
