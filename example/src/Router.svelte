<script>
  import { Router } from "svelte-hash-spa-router";
  import Main from "./Main.svelte";
  import About from "./About.svelte";
  import Posts from "./Posts.svelte";
  import Post from "./Post.svelte";

  const routes = [
    { name: "main", path: "/", component: Main },
    { name: "about", path: "/about", component: About },
    { name: "posts", path: "/posts", component: Posts },
    { name: "post", path: "/posts/:id", component: Post }
  ];
</script>

<Router {routes} />
