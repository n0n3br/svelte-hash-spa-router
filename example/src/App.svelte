<script>
  import Nav from "./Nav.svelte";
  import AppRouter from "./AppRouter.svelte";
</script>

<main>
  <Nav />
  <div class="hero is-fullheight-with-navbar">
    <div class="hero-body">
      <div class="container has-text-centered">
        <AppRouter />
      </div>

    </div>
  </div>
</main>
